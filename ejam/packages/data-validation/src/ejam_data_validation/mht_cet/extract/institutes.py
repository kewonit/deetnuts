"""Build year-versioned official institute and choice-code references."""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup

CODE_RE = re.compile(r"^\d{5}$")
CHOICE_RE = re.compile(r"^\d{10}[A-Z]{0,2}$")
ALLOWED_HOSTS = {"fe2024.mahacet.org", "fe2025.mahacet.org", "fe2026.mahacet.org"}
HOME_UNIVERSITY_BY_DISTRICT = {
    "Chhatrapati Sambhajinagar": "dr-babasaheb-ambedkar-marathwada-university",
    "Beed": "dr-babasaheb-ambedkar-marathwada-university",
    "Jalna": "dr-babasaheb-ambedkar-marathwada-university",
    "Dharashiv": "dr-babasaheb-ambedkar-marathwada-university",
    "Hingoli": "swami-ramanand-teerth-marathwada-university-nanded",
    "Latur": "swami-ramanand-teerth-marathwada-university-nanded",
    "Nanded": "swami-ramanand-teerth-marathwada-university-nanded",
    "Parbhani": "swami-ramanand-teerth-marathwada-university-nanded",
    "Mumbai City": "mumbai-university",
    "Mumbai Suburban": "mumbai-university",
    "Ratnagiri": "mumbai-university",
    "Raigad": "mumbai-university",
    "Palghar": "mumbai-university",
    "Sindhudurg": "mumbai-university",
    "Thane": "mumbai-university",
    "Dhule": "kavayitri-bahinabai-chaudhari-north-maharashtra-university-jalgaon",
    "Jalgaon": "kavayitri-bahinabai-chaudhari-north-maharashtra-university-jalgaon",
    "Nandurbar": "kavayitri-bahinabai-chaudhari-north-maharashtra-university-jalgaon",
    "Ahmednagar": "savitribai-phule-pune-university",
    "Ahilyanagar": "savitribai-phule-pune-university",
    "Nashik": "savitribai-phule-pune-university",
    "Pune": "savitribai-phule-pune-university",
    "Kolhapur": "shivaji-university",
    "Sangli": "shivaji-university",
    "Satara": "shivaji-university",
    "Solapur": "punyashlok-ahilyadevi-holkar-solapur-university",
    "Akola": "sant-gadge-baba-amravati-university",
    "Amravati": "sant-gadge-baba-amravati-university",
    "Buldhana": "sant-gadge-baba-amravati-university",
    "Washim": "sant-gadge-baba-amravati-university",
    "Yavatmal": "sant-gadge-baba-amravati-university",
    "Bhandara": "rashtrasant-tukadoji-maharaj-nagpur-university",
    "Gondia": "rashtrasant-tukadoji-maharaj-nagpur-university",
    "Nagpur": "rashtrasant-tukadoji-maharaj-nagpur-university",
    "Wardha": "rashtrasant-tukadoji-maharaj-nagpur-university",
    "Chandrapur": "gondwana-university",
    "Gadchiroli": "gondwana-university",
}


def slug(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    if not normalized:
        raise ValueError(f"cannot slug empty official value: {value!r}")
    return normalized


def fetch(url: str, attempts: int = 5) -> str:
    parsed = urllib.parse.urlparse(url)
    if parsed.hostname not in ALLOWED_HOSTS or parsed.scheme != "https":
        raise ValueError(f"official institute URL is not allowlisted: {url}")
    error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(
                url, headers={"User-Agent": "eJAM official-data audit/1.0"}
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8", errors="replace")
        except Exception as exc:  # network errors are retried deterministically
            error = exc
            time.sleep(min(4, 0.25 * 2**attempt))
    raise RuntimeError(f"failed to fetch {url}: {error}")


def row_cells(row: object) -> list[str]:
    return [
        cell.get_text(" ", strip=True)
        for cell in getattr(row, "find_all")(["th", "td"])
    ]


def field_value(soup: BeautifulSoup, label: str) -> str:
    for row in soup.find_all("tr"):
        cells = row_cells(row)
        for index, cell in enumerate(cells[:-1]):
            if cell.rstrip(":").strip() == label:
                return cells[index + 1].strip()
    raise ValueError(f"official institute summary missing {label}")


def list_institute_codes(list_url: str) -> list[str]:
    soup = BeautifulSoup(fetch(list_url), "html.parser")
    codes = {
        text
        for text in (
            cell.get_text(" ", strip=True) for cell in soup.find_all(["td", "a"])
        )
        if CODE_RE.fullmatch(text)
    }
    if not codes:
        raise ValueError("official institute list contained no five-digit codes")
    return sorted(codes)


def course_rows(soup: BeautifulSoup) -> list[dict[str, str]]:
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if not rows:
            continue
        headers = row_cells(rows[0])
        if "Choice Code" not in headers or "Course Name" not in headers:
            continue
        courses: list[dict[str, str]] = []
        for row in rows[1:]:
            cells = row_cells(row)
            if len(cells) != len(headers):
                continue
            record = dict(zip(headers, cells, strict=True))
            if CHOICE_RE.fullmatch(record.get("Choice Code", "")):
                courses.append(record)
        return courses
    raise ValueError("official institute summary missing course table")


def minority_community_id(status: str) -> str | None:
    if status.strip().lower() == "non-minority":
        return None
    return f"official-{slug(status)}"


def home_university_id(district: str) -> str:
    try:
        return HOME_UNIVERSITY_BY_DISTRICT[district]
    except KeyError as exc:
        raise ValueError(
            f"district is absent from the reviewed 2026 CAP "
            f"home-university rules: {district}"
        ) from exc


def extract_references(*, base_url: str, year: int) -> tuple[list[dict], list[dict]]:
    list_url = f"{base_url.rstrip('/')}/StaticPages/frmInstituteList"
    codes = list_institute_codes(list_url)
    institutes: list[dict] = []
    programs: list[dict] = []
    for code in codes:
        summary_url = (
            f"{base_url.rstrip('/')}/StaticPages/frmInstituteSummary"
            f"?InstituteCode={code}"
        )
        soup = BeautifulSoup(fetch(summary_url), "html.parser")
        official_code = field_value(soup, "Institute Code")
        if official_code != code:
            raise ValueError(f"institute summary code mismatch: {code} vs {official_code}")
        courses = course_rows(soup)
        universities = sorted(
            {course["University"].strip() for course in courses if course.get("University")}
        )
        if len(universities) != 1:
            raise ValueError(f"{code}: expected one official university, got {universities}")
        minority_status = field_value(soup, "Minority Status")
        district = field_value(soup, "District")
        cap_home_university_id = home_university_id(district)
        affiliating_university_id = slug(universities[0])
        institute = {
            "schema_version": 1,
            "year": year,
            "institute_id": f"mht-institute-{code}",
            "institute_code": code,
            "institute_name": field_value(soup, "Institute Name"),
            "institute_type": " / ".join(
                [field_value(soup, "Status"), field_value(soup, "Autonomy Status")]
            ),
            "district": district,
            "home_university_id": cap_home_university_id,
            "affiliating_university_id": affiliating_university_id,
            "minority_community_id": minority_community_id(minority_status),
            "source_id": f"mht-cet.{year}.institute-summary",
            "source_locator": summary_url,
        }
        institutes.append(institute)
        for course in courses:
            choice_code = course["Choice Code"]
            programs.append(
                {
                    "schema_version": 1,
                    "year": year,
                    "institute_code": code,
                    "choice_code": choice_code,
                    "offering_id": f"mht-choice-{choice_code.lower()}",
                    "program_id": slug(course["Course Name"]),
                    "program_name": course["Course Name"],
                    "home_university_id": cap_home_university_id,
                    "affiliating_university_id": slug(course["University"]),
                    "minority_community_id": minority_community_id(
                        course.get("Minority Status", minority_status)
                    ),
                    "source_id": f"mht-cet.{year}.institute-summary",
                    "source_locator": summary_url,
                }
            )
    return institutes, programs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--institutes-output", type=Path, required=True)
    parser.add_argument("--programs-output", type=Path, required=True)
    args = parser.parse_args()

    institutes, programs = extract_references(base_url=args.base_url, year=args.year)
    args.institutes_output.parent.mkdir(parents=True, exist_ok=True)
    args.programs_output.parent.mkdir(parents=True, exist_ok=True)
    args.institutes_output.write_text(json.dumps(institutes, indent=2) + "\n")
    args.programs_output.write_text(json.dumps(programs, indent=2) + "\n")
    print(
        f"official MHT-CET references: {len(institutes)} institutes, "
        f"{len(programs)} choices"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
