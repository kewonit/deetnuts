"""Extract official Maharashtra CAP seat matrices from CET Cell PDFs.

Seat counts are reference-only validation data. They are deliberately kept out
of the predictor model and probability calculation.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import pdfplumber

INSTITUTE_RE = re.compile(r"^(\d{5})\s*-\s*(.+)$")
CHOICE_RE = re.compile(r"^\d{10}[A-Z]{0,2}$")
CAP_RE = re.compile(r"CAP Seats\s*:\s*(\d+)")
COMMON_RE = re.compile(r"^(PWD|DEF) Common Reserved Seats\s*:\s*(\d+)$")
EWS_RE = re.compile(r"Economically Weaker Section \(EWS\) Seats\s*:\s*(\d+)")
TFWS_RE = re.compile(
    r"Tution Fee Waiver Scheme Choice Code\s*:\s*"
    r"(\d{10}[A-Z]{0,2})?\s*:\s*Seats\s*:\s*(\d+)"
)

TABLE_SETTINGS = {
    "vertical_strategy": "lines",
    "horizontal_strategy": "lines",
    "snap_tolerance": 3,
    "join_tolerance": 3,
}

SCOPE_NAMES = {
    "HU": "HOME_UNIVERSITY",
    "OHU": "OTHER_HOME_UNIVERSITY",
    "State Level": "STATE_LEVEL",
}


def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def integer(value: str | None, *, context: str) -> int:
    normalized = clean(value)
    if not normalized.isdigit():
        raise ValueError(f"{context}: expected integer, found {value!r}")
    return int(normalized)


def first_matching_row(
    rows: list[list[str | None]], predicate: Any
) -> tuple[int, list[str | None]]:
    for index, row in enumerate(rows):
        if predicate(row):
            return index, row
    raise ValueError("required seat-matrix row was not found")


def value_at_header(
    header: list[str | None],
    values: list[str | None],
    label: str,
    *,
    context: str,
) -> int:
    for index, cell in enumerate(header):
        if clean(cell) == label:
            return integer(values[index], context=f"{context} {label}")
    raise ValueError(f"{context}: missing {label!r} column")


def category_layout(
    category_row: list[str | None],
    entitlement_row: list[str | None],
) -> list[tuple[str, int, int]]:
    layout: list[tuple[str, int, int]] = []
    for index in range(1, len(category_row) - 1):
        category = clean(category_row[index])
        if not category:
            continue
        general_index = index
        ladies_index = index + 1
        if clean(entitlement_row[general_index]) != "G":
            raise ValueError(f"{category}: missing general-seat column")
        if clean(entitlement_row[ladies_index]) != "L":
            raise ValueError(f"{category}: missing ladies-seat column")
        layout.append((category, general_index, ladies_index))
    if not layout:
        raise ValueError("seat matrix has no category columns")
    return layout


def allocation_counts(
    row: list[str | None],
    layout: list[tuple[str, int, int]],
    *,
    context: str,
) -> tuple[dict[str, dict[str, int]], int]:
    counts: dict[str, dict[str, int]] = {}
    calculated_total = 0
    for category, general_index, ladies_index in layout:
        general = integer(row[general_index], context=f"{context} {category} G")
        ladies = integer(row[ladies_index], context=f"{context} {category} L")
        counts[category] = {"general": general, "ladies": ladies}
        calculated_total += general + ladies
    declared_total = integer(row[-1], context=f"{context} total")
    if calculated_total != declared_total:
        raise ValueError(
            f"{context}: category total {calculated_total} "
            f"does not equal declared total {declared_total}"
        )
    return counts, declared_total


def special_counts(
    rows: list[list[str | None]],
    label: str,
    layout: list[tuple[str, int, int]],
    *,
    context: str,
) -> tuple[dict[str, int], int]:
    _, row = first_matching_row(rows, lambda item: clean(item[0]) == label)
    counts: dict[str, int] = {}
    calculated_total = 0
    for category, general_index, _ in layout:
        count = integer(
            row[general_index],
            context=f"{context} {label} {category}",
        )
        counts[category] = count
        calculated_total += count
    declared_total = integer(row[-1], context=f"{context} {label} total")
    if calculated_total != declared_total:
        raise ValueError(
            f"{context} {label}: category total {calculated_total} "
            f"does not equal declared total {declared_total}"
        )
    return counts, declared_total


def extract_official_seat_matrix(
    pdf_path: Path,
    *,
    year: int,
    source_id: str,
) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    with pdfplumber.open(pdf_path) as document:
        for page_number, page in enumerate(document.pages, start=1):
            tables = page.extract_tables(TABLE_SETTINGS)
            if len(tables) != 1:
                raise ValueError(
                    f"page {page_number}: expected one ruled seat-matrix table, "
                    f"found {len(tables)}"
                )
            rows = tables[0]
            context = f"{pdf_path.name} page {page_number}"
            _, institute_row = first_matching_row(
                rows,
                lambda row: bool(INSTITUTE_RE.match(clean(row[0]))),
            )
            institute = INSTITUTE_RE.match(clean(institute_row[0]))
            if not institute:
                raise ValueError(f"{context}: invalid institute row")

            choice_header_index, choice_header = first_matching_row(
                rows,
                lambda row: clean(row[0]) == "Choice Code",
            )
            offering_row = rows[choice_header_index + 1]
            choice_code = clean(offering_row[0])
            if not CHOICE_RE.fullmatch(choice_code):
                raise ValueError(f"{context}: invalid choice code {choice_code!r}")

            status_index = choice_header_index - 1
            status_row = rows[status_index]
            institute_status = clean(status_row[0])
            cap_match = next(
                (
                    CAP_RE.search(clean(cell))
                    for cell in status_row
                    if CAP_RE.search(clean(cell))
                ),
                None,
            )
            if not cap_match:
                raise ValueError(f"{context}: missing CAP seat count")

            summary = {
                "sanctioned_intake": value_at_header(
                    choice_header,
                    offering_row,
                    "SI",
                    context=context,
                ),
                "maharashtra_state_seats": value_at_header(
                    choice_header,
                    offering_row,
                    "MS Seats",
                    context=context,
                ),
                "minority_seats": value_at_header(
                    choice_header,
                    offering_row,
                    "Minority Seats",
                    context=context,
                ),
                "all_india_seats": value_at_header(
                    choice_header,
                    offering_row,
                    "All India",
                    context=context,
                ),
                "institute_seats": value_at_header(
                    choice_header,
                    offering_row,
                    "Institute Seats",
                    context=context,
                ),
                "orphan_seats": value_at_header(
                    choice_header,
                    offering_row,
                    "Orphan",
                    context=context,
                ),
                "cap_seats": int(cap_match.group(1)),
            }

            category_index, category_row = first_matching_row(
                rows,
                lambda row: clean(row[0]) == "Category",
            )
            entitlement_row = rows[category_index + 1]
            if clean(entitlement_row[0]) != "General / Ladies":
                raise ValueError(f"{context}: missing General / Ladies row")
            layout = category_layout(category_row, entitlement_row)
            pwd_counts, pwd_total = special_counts(
                rows,
                "PWD",
                layout,
                context=context,
            )
            defence_counts, defence_total = special_counts(
                rows,
                "DEF",
                layout,
                context=context,
            )

            common_reserved: dict[str, int] = {}
            ews_seats: int | None = None
            tfws_choice_code: str | None = None
            tfws_seats: int | None = None
            for row in rows:
                for cell in row:
                    normalized = clean(cell)
                    common_match = COMMON_RE.match(normalized)
                    if common_match:
                        common_reserved[common_match.group(1)] = int(
                            common_match.group(2)
                        )
                    ews_match = EWS_RE.search(normalized)
                    if ews_match:
                        ews_seats = int(ews_match.group(1))
                    tfws_match = TFWS_RE.search(normalized)
                    if tfws_match:
                        tfws_choice_code = tfws_match.group(1) or None
                        tfws_seats = int(tfws_match.group(2))
            if (
                set(common_reserved) != {"PWD", "DEF"}
                or ews_seats is None
                or tfws_seats is None
            ):
                raise ValueError(f"{context}: incomplete special-pool summary")

            found_scope = False
            for row in rows[category_index + 2 :]:
                scope = SCOPE_NAMES.get(clean(row[0]))
                if not scope:
                    continue
                found_scope = True
                category_counts, scope_total = allocation_counts(
                    row,
                    layout,
                    context=f"{context} {scope}",
                )
                output.append(
                    {
                        "schema_version": 1,
                        "year": year,
                        "institute_code": institute.group(1),
                        "institute_name": clean(institute.group(2)),
                        "institute_status": institute_status,
                        "choice_code": choice_code,
                        "program_name": clean(offering_row[1]),
                        "allocation_scope": scope,
                        "category_seats": category_counts,
                        "scope_total": scope_total,
                        **summary,
                        "pwd_category_seats": pwd_counts,
                        "pwd_total": pwd_total,
                        "pwd_common_reserved": common_reserved["PWD"],
                        "defence_category_seats": defence_counts,
                        "defence_total": defence_total,
                        "defence_common_reserved": common_reserved["DEF"],
                        "ews_seats": ews_seats,
                        "tfws_choice_code": tfws_choice_code,
                        "tfws_seats": tfws_seats,
                        "source_id": source_id,
                        "source_locator": (
                            f"{pdf_path.name}#page={page_number}&table=1"
                        ),
                    }
                )
            if not found_scope:
                raise ValueError(f"{context}: no HU, OHU, or State Level row")

    keys = {
        (row["year"], row["choice_code"], row["allocation_scope"])
        for row in output
    }
    if len(keys) != len(output):
        raise ValueError("official seat matrix contains duplicate offering/scope keys")
    return sorted(
        output,
        key=lambda row: (
            row["institute_code"],
            row["choice_code"],
            row["allocation_scope"],
        ),
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    rows = extract_official_seat_matrix(
        args.pdf,
        year=args.year,
        source_id=args.source_id,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w") as stream:
        for row in rows:
            stream.write(json.dumps(row, sort_keys=True) + "\n")
    print(f"official MHT-CET seat matrix: {len(rows)} rows -> {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
