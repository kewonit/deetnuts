"""Extract official Maharashtra CAP cutoff tables from CET Cell PDFs.

This parser reads the ruled table cells, not whitespace-tokenized text. That is
important because sparse Stage II rows and wrapped category codes otherwise
shift values into the wrong seat pool.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import pdfplumber

INSTITUTE_RE = re.compile(r"^(\d{5})\s*-\s*(.+)$")
CHOICE_RE = re.compile(r"^(\d{10}[A-Z]{0,2})\s*-\s*(.+)$")
STATUS_RE = re.compile(
    r"^Status:\s*(.*?)(?:\s+Home University\s*:\s*(.+))?$"
)
CELL_RE = re.compile(r"^\s*(\d+)\s*\n?\s*\((\d+(?:\.\d+)?)\)\s*$")

ALLOCATION_HEADINGS = {
    "Home University Seats Allotted to Home University Candidates": "HOME_TO_HOME",
    "Home University Seats Allotted to Other Than Home University Candidates": "HOME_TO_OTHER",
    "Other Than Home University Seats Allotted to Other Than Home University Candidates": "OTHER_TO_OTHER",
    "Other Than Home University Seats Allotted to Home University Candidates": "OTHER_TO_HOME",
    "State Level": "STATE_LEVEL",
    "Maharashtra State Seats": "MAHARASHTRA_STATE",
    "Minority Seats Allotted to Maharashtra State Candidature Candidates": "MAHARASHTRA_STATE",
}

TABLE_SETTINGS = {
    "vertical_strategy": "lines",
    "horizontal_strategy": "lines",
    "snap_tolerance": 3,
    "join_tolerance": 3,
}


def normalize_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def category_code(value: str | None) -> str:
    return re.sub(r"\s+", "", value or "").strip()


def page_lines(page: Any) -> list[tuple[float, str]]:
    grouped: list[tuple[float, list[dict[str, Any]]]] = []
    for word in sorted(
        page.extract_words(x_tolerance=2, y_tolerance=2),
        key=lambda item: (float(item["top"]), float(item["x0"])),
    ):
        top = float(word["top"])
        if grouped and abs(top - grouped[-1][0]) <= 2:
            grouped[-1][1].append(word)
            continue
        grouped.append((top, [word]))
    lines: list[tuple[float, str]] = []
    for top, words in grouped:
        ordered = sorted(words, key=lambda word: float(word["x0"]))
        lines.append((top, normalize_text(" ".join(word["text"] for word in ordered))))
    return sorted(lines)


def latest_match(
    lines: list[tuple[float, str]],
    before: float,
    pattern: re.Pattern[str],
) -> re.Match[str] | None:
    for _, text in reversed([line for line in lines if line[0] < before]):
        match = pattern.match(text)
        if match:
            return match
    return None


def latest_allocation(
    lines: list[tuple[float, str]], before: float, after: float
) -> str | None:
    for top, text in reversed(lines):
        if top >= before or top <= after:
            continue
        if "All India Candidature Candidates" in text:
            return "EXCLUDED_ALL_INDIA"
        allocation = ALLOCATION_HEADINGS.get(text)
        if allocation:
            return allocation
    return None


def stage_semantics(stage: str) -> str:
    normalized = normalize_text(stage).upper()
    semantics = {
        "I": "standard",
        "II": "ladies-to-male-same-category",
        "I-NON PWD": "pwd-released-to-base-category",
        "I-NON DEFENCE": "defence-released-to-base-category",
        "MH": "minority-to-maharashtra",
        "VII": "unrestricted-maharashtra-merit",
    }
    result = semantics.get(normalized)
    if result is None:
        raise ValueError(f"unknown official MHT-CET cutoff stage: {stage!r}")
    return result


def choice_code_for_pool(choice_code: str, category: str) -> str:
    if category != "TFWS":
        return choice_code
    match = re.fullmatch(r"(\d{9})\d([A-Z]{0,2})", choice_code)
    if not match:
        raise ValueError(f"cannot derive TFWS choice code from {choice_code}")
    suffix = match.group(2)
    return f"{match.group(1)}1{suffix}{'' if suffix.endswith('T') else 'T'}"


def extract_official_cutoffs(
    pdf_path: Path,
    *,
    year: int,
    round_number: int,
    source_id: str,
) -> list[dict[str, Any]]:
    extracted: list[dict[str, Any]] = []
    current_institute: re.Match[str] | None = None
    current_choice: re.Match[str] | None = None
    current_status: re.Match[str] | None = None
    current_allocation: str | None = None
    current_stages: list[tuple[str, int, str]] = []
    previous_page_tables: list[dict[str, Any]] = []
    with pdfplumber.open(pdf_path) as document:
        for page_number, page in enumerate(document.pages, start=1):
            lines = page_lines(page)
            page_tables: list[dict[str, Any]] = []
            for table_index, table in enumerate(
                page.find_tables(TABLE_SETTINGS), start=1
            ):
                top = float(table.bbox[1])
                cells = table.extract()
                if not cells or len(cells) < 2:
                    raise ValueError(
                        f"page {page_number} table {table_index}: empty cutoff table"
                    )
                continuation = category_code(cells[0][0]) not in {"", "Stage"}
                if continuation:
                    headers = [category_code(cell) for cell in cells[0]]
                    candidates = [
                        context
                        for context in previous_page_tables
                        if len(context["stages"]) >= len(cells[1:])
                        and not set(headers).intersection(context["headers"])
                    ]
                    aligned = [
                        context
                        for context in candidates
                        if abs(float(context["top"]) - top) <= 2
                    ]
                    if aligned:
                        candidates = aligned
                    if candidates:
                        widest = max(len(context["headers"]) for context in candidates)
                        candidates = [
                            context
                            for context in candidates
                            if len(context["headers"]) == widest
                        ]
                    if len(candidates) != 1:
                        raise ValueError(
                            f"page {page_number} table {table_index}: "
                            f"continuation table matched {len(candidates)} "
                            "prior table contexts"
                        )
                    context = candidates[0]
                    institute = context["institute"]
                    choice = context["choice"]
                    status = context["status"]
                    allocation = context["allocation"]
                    current_stages = context["stages"]
                    stage_rows = list(
                        zip(current_stages[: len(cells[1:])], cells[1:], strict=True)
                    )
                else:
                    headers = [category_code(cell) for cell in cells[0][1:]]
                    current_stages = []
                    for sequence, stage_row in enumerate(cells[1:], start=1):
                        label = normalize_text(stage_row[0])
                        current_stages.append(
                            (
                                label,
                                sequence,
                                stage_semantics(label) if label else "",
                            )
                        )
                    stage_rows = list(
                        zip(current_stages, cells[1:], strict=True)
                    )
                    local_choice = latest_match(lines, top, CHOICE_RE)
                    local_institute = latest_match(lines, top, INSTITUTE_RE)
                    local_status = latest_match(lines, top, STATUS_RE)
                    choice = local_choice or current_choice
                    institute = local_institute or current_institute
                    status = local_status or current_status
                    if not choice or not institute or not status:
                        raise ValueError(
                            f"page {page_number} table {table_index}: "
                            "missing institute, choice, or status context"
                        )
                    choice_top = max(
                        (
                            line_top
                            for line_top, text in lines
                            if line_top < top and CHOICE_RE.match(text)
                        ),
                        default=-1,
                    )
                    allocation = latest_allocation(lines, top, choice_top)
                    if allocation is None and local_choice is None:
                        allocation = current_allocation
                    if not allocation:
                        raise ValueError(
                            f"page {page_number} table {table_index}: "
                            "unknown allocation heading"
                        )
                if not headers or any(not header for header in headers):
                    raise ValueError(
                        f"page {page_number} table {table_index}: invalid category header"
                    )
                current_institute = institute
                current_choice = choice
                current_status = status
                current_allocation = allocation
                page_tables.append(
                    {
                        "institute": institute,
                        "choice": choice,
                        "status": status,
                        "allocation": allocation,
                        "stages": current_stages,
                        "top": top,
                        "headers": (
                            set(context["headers"]).union(headers)
                            if continuation
                            else set(headers)
                        ),
                    }
                )

                for stage_context, metric_cells in stage_rows:
                    stage, stage_sequence, semantics = stage_context
                    if not stage:
                        continue
                    if not continuation:
                        metric_cells = metric_cells[1:]
                    for header, cell in zip(headers, metric_cells, strict=True):
                        if not normalize_text(cell):
                            continue
                        metric = CELL_RE.match(cell or "")
                        if not metric:
                            raise ValueError(
                                f"page {page_number} table {table_index}: "
                                f"invalid metric cell for {header}: {cell!r}"
                            )
                        if allocation == "EXCLUDED_ALL_INDIA":
                            continue
                        extracted.append(
                            {
                                "schema_version": 2,
                                "year": year,
                                "round": round_number,
                                "institute_code": institute.group(1),
                                "institute_name": normalize_text(institute.group(2)),
                                "choice_code": choice_code_for_pool(
                                    choice.group(1), header
                                ),
                                "program_name": normalize_text(choice.group(2)),
                                "source_category_code": header,
                                "source_allocation_section": allocation,
                                "source_stage_label": stage,
                                "source_stage_sequence": stage_sequence,
                                "stage_semantics_id": semantics,
                                "closing_rank": int(metric.group(1)),
                                "closing_percentile": float(metric.group(2)),
                                "institute_status": normalize_text(status.group(1)),
                                "home_university": normalize_text(
                                    status.group(2) or ""
                                ),
                                "source_id": source_id,
                                "source_locator": (
                                    f"{pdf_path.name}#page={page_number}"
                                    f"&table={table_index}"
                                ),
                            }
                        )
            previous_page_tables = page_tables

    seen: set[tuple[Any, ...]] = set()
    for row in extracted:
        key = (
            row["year"],
            row["round"],
            row["institute_code"],
            row["choice_code"],
            row["source_category_code"],
            row["source_allocation_section"],
            row["source_stage_label"],
            row["source_stage_sequence"],
        )
        if key in seen:
            raise ValueError(f"duplicate official cutoff stage cell: {key}")
        seen.add(key)

    return sorted(
        extracted,
        key=lambda row: (
            row["institute_code"],
            row["choice_code"],
            row["source_allocation_section"],
            row["source_category_code"],
            row["source_stage_sequence"],
            row["source_stage_label"],
        ),
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--round", type=int, required=True, dest="round_number")
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    rows = extract_official_cutoffs(
        args.pdf,
        year=args.year,
        round_number=args.round_number,
        source_id=args.source_id,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w") as stream:
        for row in rows:
            stream.write(json.dumps(row, sort_keys=True) + "\n")
    print(f"official MHT-CET cutoffs: {len(rows)} rows -> {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
