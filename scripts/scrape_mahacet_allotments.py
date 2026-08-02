#!/usr/bin/env python3
"""Archive and strictly extract the official 2026 MAHACET CAP-I allotment PDFs.

This script is intentionally local-only: it writes under data/output and has no
database imports or upload code. Existing valid PDFs are reused on later runs.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import threading
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable, Optional
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

import pdfplumber
from pypdf import PdfReader


DEFAULT_URL = (
    "https://fe2026.mahacet.org/StaticPages/"
    "frmInstituteWiseAllotmentList?did=2021"
)
DEFAULT_OUTPUT = Path("data/output/mahacet_2026_cap_round_1")
USER_AGENT = "DeetNuts-MAHACET-Local-Archiver/1.0"
PDF_NAME_RE = re.compile(r"^CAPR-I_(\d{5})\.pdf$", re.IGNORECASE)
APPLICATION_ID_RE = re.compile(r"^EN\d{8}$")
INTEGER_RE = re.compile(r"^\d+$")
SCORE_RE = re.compile(r"^\d{1,3}(?:\.\d+)?$")
NAME_RE = re.compile(r"^[A-Z .'-]+$")

CSV_FIELDS = [
    "source_pdf",
    "source_page",
    "institute_serial",
    "institute_code",
    "institute_name",
    "choice_code",
    "course_name",
    "course_variant",
    "cap_seats",
    "institute_status",
    "home_university",
    "allocation_section",
    "allocation_section_raw",
    "parent_allocation_section",
    "exam",
    "serial_no",
    "merit_rank",
    "score",
    "application_id",
    "candidate_name",
    "gender",
    "candidate_category",
    "seat_type",
    "is_vacant",
]


@dataclass(frozen=True)
class Institute:
    serial: int
    code: str
    name: str
    pdf_url: str
    pdf_filename: str


class InstituteListParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.rows: list[tuple[list[str], str]] = []
        self._row: Optional[list[str]] = None
        self._cell: Optional[list[str]] = None
        self._pdf_link: Optional[str] = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        attributes = dict(attrs)
        if tag == "tr":
            self._row = []
            self._pdf_link = None
        elif tag == "td" and self._row is not None:
            self._cell = []
        elif tag == "a" and self._row is not None:
            href = attributes.get("href") or ""
            if ".pdf" in href.lower():
                self._pdf_link = href

    def handle_data(self, data: str) -> None:
        if self._cell is not None:
            self._cell.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "td" and self._cell is not None and self._row is not None:
            self._row.append(clean_text("".join(self._cell)))
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if self._pdf_link:
                self.rows.append((self._row, self._pdf_link))
            self._row = None
            self._pdf_link = None


class RequestRateLimiter:
    def __init__(self, interval_seconds: float) -> None:
        self.interval_seconds = max(0.0, interval_seconds)
        self._lock = threading.Lock()
        self._next_start = 0.0

    def wait(self) -> None:
        with self._lock:
            now = time.monotonic()
            delay = max(0.0, self._next_start - now)
            if delay:
                time.sleep(delay)
            self._next_start = time.monotonic() + self.interval_seconds


def clean_text(value: str) -> str:
    return " ".join(value.replace("\u00a0", " ").split())


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fetch_bytes(url: str, timeout: float) -> tuple[bytes, dict[str, str]]:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "identity"})
    with urlopen(request, timeout=timeout) as response:
        body = response.read()
        headers = {key.lower(): value for key, value in response.headers.items()}
    return body, headers


def parse_institutes(html: bytes, page_url: str) -> list[Institute]:
    parser = InstituteListParser()
    parser.feed(html.decode("utf-8", errors="strict"))
    institutes: list[Institute] = []
    expected_host = urlparse(page_url).hostname

    for cells, href in parser.rows:
        if len(cells) < 3:
            raise ValueError(f"PDF row has fewer than three cells: {cells!r}")
        serial_text, code, name = cells[:3]
        if not serial_text.rstrip(".").isdigit():
            raise ValueError(f"Invalid institute serial: {serial_text!r}")
        if not re.fullmatch(r"\d{5}", code):
            raise ValueError(f"Invalid institute code: {code!r}")
        if not name:
            raise ValueError(f"Institute {code} has a blank name")
        pdf_url = urljoin(page_url, href.strip())
        parsed_url = urlparse(pdf_url)
        filename = Path(parsed_url.path).name
        match = PDF_NAME_RE.fullmatch(filename)
        if parsed_url.scheme != "https" or parsed_url.hostname != expected_host:
            raise ValueError(f"Unexpected PDF origin for institute {code}: {pdf_url}")
        if not match or match.group(1) != code:
            raise ValueError(f"PDF filename/code mismatch for institute {code}: {filename}")
        institutes.append(
            Institute(int(serial_text.rstrip(".")), code, name, pdf_url, filename)
        )

    if not institutes:
        raise ValueError("No PDF rows were found on the official institute list")
    serials = [item.serial for item in institutes]
    if serials != list(range(1, len(institutes) + 1)):
        raise ValueError("Institute serials are not contiguous and ordered from 1")
    codes = [item.code for item in institutes]
    urls = [item.pdf_url for item in institutes]
    if len(codes) != len(set(codes)):
        raise ValueError("Duplicate institute codes found on the official list")
    if len(urls) != len(set(urls)):
        raise ValueError("Duplicate PDF URLs found on the official list")
    return institutes


def inspect_pdf(path: Path, expected_code: Optional[str] = None) -> dict[str, Any]:
    size = path.stat().st_size
    if size < 100:
        raise ValueError("file is too small to be a PDF")
    with path.open("rb") as stream:
        if stream.read(5) != b"%PDF-":
            raise ValueError("missing PDF signature")
        stream.seek(max(0, size - 4096))
        if b"%%EOF" not in stream.read():
            raise ValueError("missing PDF EOF marker")
    reader = PdfReader(path, strict=True)
    if reader.is_encrypted:
        raise ValueError("encrypted PDF is unsupported")
    page_count = len(reader.pages)
    if page_count < 1:
        raise ValueError("PDF contains no pages")
    first_text = clean_text(reader.pages[0].extract_text() or "")
    if expected_code and not re.search(rf"(?<!\d){re.escape(expected_code)}(?!\d)", first_text):
        raise ValueError(f"institute code {expected_code} was not found on page 1")
    return {"size_bytes": size, "sha256": sha256_file(path), "page_count": page_count}


def download_pdf(
    institute: Institute,
    pdf_dir: Path,
    limiter: RequestRateLimiter,
    timeout: float,
    retries: int,
) -> dict[str, Any]:
    destination = pdf_dir / institute.pdf_filename
    try:
        metadata = inspect_pdf(destination, institute.code)
        return {**asdict(institute), **metadata, "status": "reused", "error": ""}
    except Exception:
        if destination.exists():
            quarantine_dir = pdf_dir.parent / "quarantine"
            quarantine_dir.mkdir(parents=True, exist_ok=True)
            quarantine = quarantine_dir / f"{destination.stem}.invalid-{int(time.time())}.pdf"
            destination.replace(quarantine)

    last_error: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        part = destination.with_suffix(".pdf.part")
        try:
            limiter.wait()
            body, headers = fetch_bytes(institute.pdf_url, timeout)
            content_type = headers.get("content-type", "").lower()
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"response is not a PDF (content-type={content_type!r})")
            part.write_bytes(body)
            metadata = inspect_pdf(part, institute.code)
            part.replace(destination)
            return {
                **asdict(institute),
                **metadata,
                "status": "downloaded",
                "content_type": content_type,
                "error": "",
            }
        except Exception as error:
            last_error = error
            part.unlink(missing_ok=True)
            if attempt < retries:
                time.sleep(min(8.0, 0.75 * (2 ** (attempt - 1))))
    return {
        **asdict(institute),
        "status": "failed",
        "error": f"{type(last_error).__name__}: {last_error}",
    }


def group_lines(words: list[dict[str, Any]], tolerance: float = 2.5) -> list[dict[str, Any]]:
    lines: list[dict[str, Any]] = []
    for word in sorted(words, key=lambda item: (float(item["top"]), float(item["x0"]))):
        top = float(word["top"])
        line = next((item for item in reversed(lines[-4:]) if abs(item["top"] - top) <= tolerance), None)
        if line is None:
            line = {"top": top, "words": []}
            lines.append(line)
        line["words"].append(word)
        line["top"] = min(line["top"], top)
    for line in lines:
        line["words"].sort(key=lambda item: float(item["x0"]))
        line["text"] = clean_text(" ".join(str(item["text"]) for item in line["words"]))
    return sorted(lines, key=lambda item: item["top"])


SECTION_PATTERNS = [
    ("All India Seats Allotted", "ALL_INDIA"),
    ("All India Candidature Candidates", "ALL_INDIA"),
    ("Other Than Home University Seats Allotted to Home University Candidates", "OTHER_TO_HOME"),
    ("Other Than Home University Seats Allotted to Other Than Home University Candidates", "OTHER_TO_OTHER"),
    ("Home University Seats Allotted to Other Than Home University Candidates", "HOME_TO_OTHER"),
    ("Home University Seats Allotted to Home University Candidates", "HOME_TO_HOME"),
    ("Economically Weaker Section Seats", "EWS"),
    ("ORPHAN Seats", "ORPHAN"),
    ("Minority Seats Allotted", "MINORITY"),
    ("State Level Seats", "STATE_LEVEL"),
]

BASE_ALLOCATION_SECTIONS = {
    "HOME_TO_HOME",
    "HOME_TO_OTHER",
    "OTHER_TO_HOME",
    "OTHER_TO_OTHER",
    "STATE_LEVEL",
}


def section_from_line(text: str) -> Optional[str]:
    lower = text.lower()
    for pattern, normalized in SECTION_PATTERNS:
        if pattern.lower() in lower:
            return normalized
    return None


def parse_course_header(
    lines: list[dict[str, Any]], institute_code: str
) -> Optional[dict[str, str]]:
    choice_pattern = re.compile(rf"^{re.escape(institute_code)}\d{{5}}[A-Z]{{0,3}}$", re.IGNORECASE)
    for line in lines:
        if line["top"] > 180:
            break
        words = line["words"]
        choice_index = next(
            (index for index, word in enumerate(words) if choice_pattern.fullmatch(str(word["text"]))),
            None,
        )
        if choice_index is None:
            continue
        tokens = [str(word["text"]) for word in words[choice_index:]]
        if "-" not in tokens:
            continue
        dash = tokens.index("-")
        choice_code = tokens[0]
        prefix = " ".join(tokens[1:dash])
        course_name = clean_text(" ".join(tokens[dash + 1 :]))
        if not course_name:
            continue
        variant = "EWS" if "[EWS]" in prefix.upper() else "TFWS" if choice_code.upper().endswith("T") else "REGULAR"
        return {
            "choice_code": choice_code,
            "course_name": course_name,
            "course_variant": variant,
            "cap_seats": "",
            "institute_status": "",
            "home_university": "",
        }
    return None


def update_course_metadata(course: dict[str, str], lines: list[dict[str, Any]]) -> None:
    for line in lines:
        text = line["text"]
        cap_match = re.search(r"CAP Seats:\s*(\d+)", text, re.IGNORECASE)
        if cap_match:
            course["cap_seats"] = cap_match.group(1)
        match = re.search(r"Status:\s*(.*?)\s+Home University\s*:\s*(.+)$", text, re.IGNORECASE)
        if match:
            course["institute_status"] = clean_text(match.group(1))
            course["home_university"] = clean_text(match.group(2))


SEAT_TYPE_SUFFIX_RE = re.compile(
    r"(?:"
    r"AI|EWS|MI|TFWS|ORPHANI|ORPHANN|"
    r"DEF(?:R)?(?:OPEN|OBC|SC|ST|SEBC|VJ|NT[123])S|"
    r"PWD(?:R)?(?:OPEN|OBC|SC|ST|SEBC|VJ|NT[123])[HOS]|"
    r"[GL](?:OPEN|OBC|SC|ST|SEBC|VJ|NT[123])[HOS]"
    r")$"
)


def split_merged_category_seat(text: str) -> tuple[str, str]:
    match = SEAT_TYPE_SUFFIX_RE.search(text)
    if not match:
        return text, ""
    return clean_text(text[: match.start()]), match.group(0)


def words_in_column(
    words: list[dict[str, Any]], x_min: float, x_max: float, top: float, tolerance: float = 3.2
) -> list[dict[str, Any]]:
    return sorted(
        [
            word
            for word in words
            if x_min <= float(word["x0"]) < x_max and abs(float(word["top"]) - top) <= tolerance
        ],
        key=lambda item: float(item["x0"]),
    )


def join_words(words: Iterable[dict[str, Any]]) -> str:
    return clean_text(" ".join(str(word["text"]) for word in words))


def parse_candidate_rows(
    words: list[dict[str, Any]],
    lines: list[dict[str, Any]],
    inherited_base_section: Optional[str],
) -> tuple[list[dict[str, str]], list[dict[str, Any]], Optional[str]]:
    sections: list[tuple[float, str, str]] = []
    exam_markers: list[tuple[float, str, bool]] = []
    for line in lines:
        normalized = section_from_line(line["text"])
        if normalized:
            sections.append((line["top"], normalized, line["text"]))
        lower = line["text"].lower()
        if "jee(main)" in lower:
            exam_markers.append((line["top"], "JEE_MAIN", True))
        elif "mht-cet" in lower:
            explicit = "allotted" in lower and "score" in lower
            exam_markers.append((line["top"], "MHT_CET", explicit))
        elif "all india candidature candidates" in lower:
            exam_markers.append((line["top"], "UNSPECIFIED", True))

    anchors = [
        word
        for word in words
        if 35 <= float(word["x0"]) < 65
        and 140 <= float(word["top"]) < 700
        and INTEGER_RE.fullmatch(str(word["text"]))
    ]
    anchors.sort(key=lambda item: float(item["top"]))
    rows: list[dict[str, str]] = []
    issues: list[dict[str, Any]] = []

    for index, anchor in enumerate(anchors):
        top = float(anchor["top"])
        serial_no = str(anchor["text"])
        application_words = words_in_column(words, 165, 235, top)
        seat_words = words_in_column(words, 500, 590, top)
        name_words = words_in_column(words, 235, 400, top)
        same_line_text = join_words(word for word in words if abs(float(word["top"]) - top) <= 3.2)
        is_vacant = "VACANT" in same_line_text.upper()

        application_id = join_words(application_words)
        seat_type = join_words(seat_words)
        merged_category = ""
        if not seat_type:
            merged_category, seat_type = split_merged_category_seat(
                join_words(words_in_column(words, 430, 590, top))
            )
        likely_candidate = bool(seat_type or is_vacant)
        if not is_vacant and not APPLICATION_ID_RE.fullmatch(application_id):
            if likely_candidate:
                issues.append({"serial_no": serial_no, "top": top, "reason": "invalid application ID"})
            continue
        if not seat_type:
            issues.append({"serial_no": serial_no, "top": top, "reason": "missing seat type"})
            continue

        next_top = float(anchors[index + 1]["top"]) if index + 1 < len(anchors) else top + 22
        continuation_limit = min(next_top - 3.0, top + 19.0)
        if not is_vacant:
            continuation: list[dict[str, Any]] = []
            for line in lines:
                if not top + 3.2 < float(line["top"]) <= continuation_limit:
                    continue
                if line["words"] and all(
                    235 <= float(word["x0"]) < 400 for word in line["words"]
                ):
                    continuation.extend(line["words"])
            name_words.extend(continuation)
            name_words.sort(key=lambda item: (float(item["top"]), float(item["x0"])))

        merit_rank = join_words(words_in_column(words, 65, 108, top))
        score = join_words(words_in_column(words, 108, 165, top))
        gender = join_words(words_in_column(words, 400, 430, top))
        category = merged_category or join_words(words_in_column(words, 430, 512, top))
        candidate_name = "VACANT" if is_vacant else join_words(name_words)

        preceding_sections = [item for item in sections if item[0] < top]
        section_top, allocation_section, section_raw = (
            preceding_sections[-1] if preceding_sections else (-1.0, "", "")
        )
        section_exams = [item for item in exam_markers if section_top <= item[0] < top]
        explicit_exams = [item for item in section_exams if item[2]]
        exam = (explicit_exams or section_exams)[-1][1] if section_exams else "MHT_CET"
        if section_top < 0:
            issues.append({"serial_no": serial_no, "top": top, "reason": "missing allocation section"})
            continue
        preceding_base_sections = [
            item for item in preceding_sections if item[1] in BASE_ALLOCATION_SECTIONS
        ]
        parent_allocation_section = ""
        if allocation_section == "MINORITY":
            parent_allocation_section = (
                preceding_base_sections[-1][1]
                if preceding_base_sections
                else inherited_base_section or ""
            )
            if not parent_allocation_section:
                issues.append(
                    {
                        "serial_no": serial_no,
                        "top": top,
                        "reason": "minority row has no preceding base allocation section",
                    }
                )
                continue
        if allocation_section != "ALL_INDIA" and exam != "MHT_CET":
            issues.append(
                {
                    "serial_no": serial_no,
                    "top": top,
                    "reason": f"unexpected exam {exam} for section {allocation_section}",
                }
            )
            continue
        if not SEAT_TYPE_SUFFIX_RE.fullmatch(seat_type):
            issues.append({"serial_no": serial_no, "top": top, "reason": "unknown seat type"})
            continue

        if not is_vacant:
            problems = []
            rank_can_be_blank = exam == "UNSPECIFIED" and allocation_section == "ALL_INDIA"
            if not INTEGER_RE.fullmatch(merit_rank) and not (rank_can_be_blank and not merit_rank):
                problems.append("invalid merit rank")
            if not SCORE_RE.fullmatch(score):
                problems.append("invalid score")
            elif not 0 <= float(score) <= 100:
                problems.append("score outside 0..100")
            if not candidate_name:
                problems.append("missing candidate name")
            elif not NAME_RE.fullmatch(candidate_name):
                problems.append("candidate name contains unexpected characters")
            if gender not in {"M", "F"}:
                problems.append("invalid gender")
            if not category:
                problems.append("missing candidate category")
            if problems:
                issues.append(
                    {"serial_no": serial_no, "top": top, "reason": "; ".join(problems), "row": same_line_text}
                )
                continue
        else:
            merit_rank = score = application_id = gender = category = ""

        rows.append(
            {
                "allocation_section": allocation_section,
                "allocation_section_raw": section_raw,
                "parent_allocation_section": parent_allocation_section,
                "exam": exam,
                "serial_no": serial_no,
                "merit_rank": merit_rank,
                "score": score,
                "application_id": application_id,
                "candidate_name": candidate_name,
                "gender": gender,
                "candidate_category": category,
                "seat_type": seat_type,
                "is_vacant": "true" if is_vacant else "false",
            }
        )
    page_base_sections = [
        section for _, section, _ in sections if section in BASE_ALLOCATION_SECTIONS
    ]
    final_base_section = page_base_sections[-1] if page_base_sections else inherited_base_section
    return rows, issues, final_base_section


def extract_pdf(institute: Institute, path: Path) -> dict[str, Any]:
    rows: list[dict[str, str]] = []
    courses: dict[tuple[str, str], dict[str, str]] = {}
    issues: list[dict[str, Any]] = []
    current_course: Optional[dict[str, str]] = None
    current_base_section: Optional[str] = None
    previous_page_max_serial: Optional[int] = None

    with pdfplumber.open(path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            words = page.extract_words(x_tolerance=2, y_tolerance=2, keep_blank_chars=False) or []
            lines = group_lines(words)
            header = parse_course_header(lines, institute.code)
            if header:
                current_course = header
                current_base_section = None
                previous_page_max_serial = None
            if current_course:
                update_course_metadata(current_course, lines)
                courses[(current_course["choice_code"], current_course["course_variant"])] = dict(current_course)

            page_rows, page_issues, current_base_section = parse_candidate_rows(
                words, lines, current_base_section
            )
            if (page_rows or page_issues) and current_course is None:
                page_issues.append({"reason": "candidate data found before course metadata"})
                page_rows = []

            numeric_serials = [int(row["serial_no"]) for row in page_rows]
            if numeric_serials != sorted(numeric_serials) or len(numeric_serials) != len(set(numeric_serials)):
                page_issues.append({"reason": "candidate serials are not increasing and unique on page"})
                page_rows = []
            if numeric_serials and previous_page_max_serial is not None and numeric_serials[0] <= previous_page_max_serial:
                page_issues.append({"reason": "candidate serial did not increase across continuation pages"})
                page_rows = []
            if numeric_serials:
                previous_page_max_serial = max(numeric_serials)

            for row in page_rows:
                row.update(
                    {
                        "source_pdf": institute.pdf_filename,
                        "source_page": str(page_number),
                        "institute_serial": str(institute.serial),
                        "institute_code": institute.code,
                        "institute_name": institute.name,
                        **(current_course or {}),
                    }
                )
                rows.append(row)
            for issue in page_issues:
                issues.append(
                    {
                        "source_pdf": institute.pdf_filename,
                        "source_page": page_number,
                        "institute_code": institute.code,
                        **issue,
                    }
                )

    application_ids = [row["application_id"] for row in rows if row["application_id"]]
    duplicate_applications = [item for item, count in Counter(application_ids).items() if count > 1]
    if duplicate_applications:
        issues.append(
            {
                "source_pdf": institute.pdf_filename,
                "source_page": "",
                "institute_code": institute.code,
                "reason": f"duplicate application IDs within PDF: {len(duplicate_applications)}",
            }
        )
    rows_by_course: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        rows_by_course[(row["choice_code"], row["course_variant"])].append(row)
    for course_key, course in courses.items():
        course_rows = rows_by_course.get(course_key, [])
        serials = sorted(int(row["serial_no"]) for row in course_rows)
        expected_serials = list(range(1, max(serials) + 1)) if serials else []
        if serials != expected_serials:
            issues.append(
                {
                    "source_pdf": institute.pdf_filename,
                    "source_page": "",
                    "institute_code": institute.code,
                    "reason": f"non-contiguous serials for {course_key[0]} {course_key[1]}",
                }
            )
        cap_seats = course.get("cap_seats", "")
        if not cap_seats:
            issues.append(
                {
                    "source_pdf": institute.pdf_filename,
                    "source_page": "",
                    "institute_code": institute.code,
                    "reason": f"missing CAP seat count for {course_key[0]} {course_key[1]}",
                }
            )
        elif len(course_rows) != int(cap_seats):
            issues.append(
                {
                    "source_pdf": institute.pdf_filename,
                    "source_page": "",
                    "institute_code": institute.code,
                    "reason": (
                        f"row/CAP-seat mismatch for {course_key[0]} {course_key[1]}: "
                        f"rows={len(course_rows)} cap_seats={cap_seats}"
                    ),
                }
            )
    return {"rows": rows, "courses": list(courses.values()), "issues": issues}


def derive_cutoffs(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    groups: dict[tuple[str, ...], list[dict[str, str]]] = defaultdict(list)
    key_fields = [
        "institute_code",
        "institute_name",
        "choice_code",
        "course_name",
        "course_variant",
        "allocation_section",
        "parent_allocation_section",
        "exam",
        "seat_type",
    ]
    for row in rows:
        groups[tuple(row[field] for field in key_fields)].append(row)

    cutoffs: list[dict[str, str]] = []
    for key, group in sorted(groups.items()):
        filled = [row for row in group if row["is_vacant"] == "false"]
        vacant = [row for row in group if row["is_vacant"] == "true"]
        ranked = [row for row in filled if row["merit_rank"]]
        cutoff_row = max(ranked, key=lambda row: int(row["merit_rank"])) if ranked else None
        if filled and cutoff_row is None:
            cutoff_row = max(filled, key=lambda row: int(row["serial_no"]))
        record = dict(zip(key_fields, key))
        record.update(
            {
                "cutoff_score": cutoff_row["score"] if cutoff_row else "",
                "last_rank": cutoff_row["merit_rank"] if cutoff_row else "",
                "total_admitted": str(len(filled)),
                "total_vacant": str(len(vacant)),
                "cutoff_source_pdf": cutoff_row["source_pdf"] if cutoff_row else group[0]["source_pdf"],
                "cutoff_source_page": cutoff_row["source_page"] if cutoff_row else "",
                "cutoff_source_serial_no": cutoff_row["serial_no"] if cutoff_row else "",
            }
        )
        cutoffs.append(record)
    return cutoffs


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    temporary.replace(path)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--workers", type=int, default=2, help="PDF download workers (capped at 4)")
    parser.add_argument("--request-interval", type=float, default=0.20)
    parser.add_argument("--timeout", type=float, default=60.0)
    parser.add_argument("--retries", type=int, default=4)
    parser.add_argument("--limit", type=int, help="Development-only institute limit")
    parser.add_argument("--download-only", action="store_true")
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--allow-extraction-issues", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.request_interval < 0:
        raise ValueError("--request-interval cannot be negative")
    if args.timeout <= 0:
        raise ValueError("--timeout must be positive")
    if args.retries < 1:
        raise ValueError("--retries must be at least 1")
    output = args.output.resolve()
    source_dir = output / "source"
    pdf_dir = output / "pdfs"
    manifest_dir = output / "manifests"
    cleaned_dir = output / "cleaned"
    for directory in (source_dir, pdf_dir, manifest_dir, cleaned_dir):
        directory.mkdir(parents=True, exist_ok=True)

    started_at = utc_now()
    if args.skip_download:
        index_path = source_dir / "institute_list.html"
        if not index_path.exists():
            raise FileNotFoundError(f"--skip-download requires {index_path}")
        html = index_path.read_bytes()
    else:
        print(f"Fetching official institute list: {args.url}", flush=True)
        html, _ = fetch_bytes(args.url, args.timeout)
        if b"<html" not in html[:1000].lower():
            raise ValueError("official institute list response is not HTML")
        (source_dir / "institute_list.html").write_bytes(html)

    institutes = parse_institutes(html, args.url)
    source_count = len(institutes)
    if args.limit:
        if args.limit < 1:
            raise ValueError("--limit must be positive")
        institutes = institutes[: args.limit]
    print(f"Validated {source_count} official PDF links; processing {len(institutes)}", flush=True)
    write_csv(manifest_dir / "institutes.csv", [asdict(item) for item in institutes], list(asdict(institutes[0])))

    if args.skip_download:
        download_records = []
        for item in institutes:
            metadata = inspect_pdf(pdf_dir / item.pdf_filename, item.code)
            download_records.append({**asdict(item), **metadata, "status": "reused", "error": ""})
    else:
        workers = min(max(1, args.workers), 4)
        limiter = RequestRateLimiter(args.request_interval)
        download_records = []
        with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="mahacet-download") as executor:
            futures = {
                executor.submit(download_pdf, item, pdf_dir, limiter, args.timeout, args.retries): item
                for item in institutes
            }
            for completed, future in enumerate(as_completed(futures), start=1):
                record = future.result()
                download_records.append(record)
                if record["status"] == "failed" or completed % 25 == 0 or completed == len(futures):
                    print(
                        f"Downloads checked: {completed}/{len(futures)}; latest={record['status']} {record['pdf_filename']}",
                        flush=True,
                    )
        download_records.sort(key=lambda item: item["serial"])

    write_json(manifest_dir / "downloads.json", download_records)
    failures = [record for record in download_records if record["status"] == "failed"]
    if failures:
        raise RuntimeError(f"{len(failures)} PDFs failed; see manifests/downloads.json")
    if args.download_only:
        print("Download-only run complete", flush=True)
        return 0

    all_rows: list[dict[str, str]] = []
    all_courses: list[dict[str, str]] = []
    all_issues: list[dict[str, Any]] = []
    print("Extracting PDFs sequentially to keep CPU and memory bounded", flush=True)
    for index, institute in enumerate(institutes, start=1):
        extracted = extract_pdf(institute, pdf_dir / institute.pdf_filename)
        all_rows.extend(extracted["rows"])
        for course in extracted["courses"]:
            all_courses.append(
                {
                    "institute_serial": str(institute.serial),
                    "institute_code": institute.code,
                    "institute_name": institute.name,
                    **course,
                }
            )
        all_issues.extend(extracted["issues"])
        if index % 10 == 0 or index == len(institutes):
            print(
                f"Extracted {index}/{len(institutes)} PDFs: {len(all_rows)} rows, {len(all_issues)} quarantined issues",
                flush=True,
            )

    global_application_counts = Counter(
        row["application_id"] for row in all_rows if row["application_id"]
    )
    global_duplicate_applications = [
        application_id
        for application_id, count in global_application_counts.items()
        if count > 1
    ]
    if global_duplicate_applications:
        all_issues.append(
            {
                "source_pdf": "",
                "source_page": "",
                "institute_code": "",
                "reason": (
                    "duplicate application IDs across institute PDFs: "
                    f"{len(global_duplicate_applications)}"
                ),
            }
        )

    write_csv(cleaned_dir / "allotments.csv", all_rows, CSV_FIELDS)
    course_fields = [
        "institute_serial",
        "institute_code",
        "institute_name",
        "choice_code",
        "course_name",
        "course_variant",
        "cap_seats",
        "institute_status",
        "home_university",
    ]
    unique_courses = list({tuple(course.get(field, "") for field in course_fields): course for course in all_courses}.values())
    unique_courses.sort(key=lambda row: (row["institute_serial"], row["choice_code"], row["course_variant"]))
    write_csv(cleaned_dir / "courses.csv", unique_courses, course_fields)
    all_courses_have_cap_counts = all(course["cap_seats"].isdigit() for course in unique_courses)
    expected_cap_rows = sum(
        int(course["cap_seats"])
        for course in unique_courses
        if course["cap_seats"].isdigit()
    )
    cutoffs = derive_cutoffs(all_rows)
    cutoff_fields = [
        "institute_code",
        "institute_name",
        "choice_code",
        "course_name",
        "course_variant",
        "allocation_section",
        "parent_allocation_section",
        "exam",
        "seat_type",
        "cutoff_score",
        "last_rank",
        "total_admitted",
        "total_vacant",
        "cutoff_source_pdf",
        "cutoff_source_page",
        "cutoff_source_serial_no",
    ]
    write_csv(cleaned_dir / "derived_cutoffs.csv", cutoffs, cutoff_fields)
    issue_fields = sorted({key for issue in all_issues for key in issue} or {"reason"})
    write_csv(manifest_dir / "extraction_issues.csv", all_issues, issue_fields)

    verification = {
        "started_at_utc": started_at,
        "finished_at_utc": utc_now(),
        "source_url": args.url,
        "source_pdf_link_count": source_count,
        "processed_institute_count": len(institutes),
        "complete_source_run": args.limit is None and len(institutes) == source_count,
        "download_failures": len(failures),
        "download_status_counts": dict(Counter(record["status"] for record in download_records)),
        "total_pdf_bytes": sum(int(record["size_bytes"]) for record in download_records),
        "total_pdf_pages": sum(int(record["page_count"]) for record in download_records),
        "course_count": len(unique_courses),
        "all_courses_have_cap_counts": all_courses_have_cap_counts,
        "expected_rows_from_cap_seats": expected_cap_rows,
        "row_count_matches_cap_seats": len(all_rows) == expected_cap_rows,
        "allotment_row_count": len(all_rows),
        "filled_row_count": sum(row["is_vacant"] == "false" for row in all_rows),
        "vacant_row_count": sum(row["is_vacant"] == "true" for row in all_rows),
        "derived_cutoff_count": len(cutoffs),
        "extraction_issue_count": len(all_issues),
        "verified": (
            not failures
            and not all_issues
            and args.limit is None
            and all_courses_have_cap_counts
            and len(all_rows) == expected_cap_rows
        ),
        "verification_scope": {
            "source": "contiguous unique institute list, same-origin HTTPS PDF URLs, filename/code match",
            "downloads": "PDF signature and EOF, strict parse, nonempty unencrypted pages, institute code on page 1, SHA-256",
            "rows": "strict column formats, score bounds, section/course provenance, serial ordering; failures quarantined",
            "cutoffs": "derived from the admitted row with the greatest official merit rank in each exact seat group",
        },
    }
    write_json(manifest_dir / "verification.json", verification)
    readme = f"""# Local MAHACET 2026 CAP Round I archive

Generated from: {args.url}
Generated at (UTC): {verification['finished_at_utc']}

- Official institute/PDF links: {source_count}
- Valid local PDFs: {len(download_records)}
- PDF pages: {verification['total_pdf_pages']}
- Extracted allotment rows: {len(all_rows)}
- Quarantined extraction issues: {len(all_issues)}
- Strict verification passed: {verification['verified']}

`allotments.csv` preserves the official candidate-level values. `derived_cutoffs.csv`
is a local derivative and is not database-ready without domain review. See
`manifests/verification.json` for the exact checks and limitations.
"""
    (output / "README.md").write_text(readme, encoding="utf-8")

    if all_issues and not args.allow_extraction_issues:
        print(
            f"Extraction completed with {len(all_issues)} quarantined issues; strict verification failed",
            flush=True,
        )
        return 2
    print(f"Completed: {output}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
