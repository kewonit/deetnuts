from pathlib import Path

import polars as pl

ROOT = Path(__file__).resolve().parents[5]
REFERENCE_ROOT = ROOT / "data" / "reference"
DATASETS_ROOT = ROOT / "data" / "datasets"
TOOLS_ROOT = ROOT / "data" / "tools"


def discover_parquet_files() -> list[Path]:
    files: list[Path] = []
    if DATASETS_ROOT.exists():
        files.extend(
            path
            for path in sorted(DATASETS_ROOT.rglob("*.parquet"))
            if not path.name.startswith("._")
        )
    if TOOLS_ROOT.exists():
        files.extend(
            path
            for path in sorted(TOOLS_ROOT.rglob("predictor-index.parquet"))
            if not path.name.startswith("._")
        )
    return files


def classify_file(path: Path) -> str:
    relative = path.relative_to(ROOT).as_posix()
    is_mht = (
        "/mht-cet/maharashtra-cap/" in relative
        or "/college-predictor/maharashtra-cap/" in relative
    )
    if is_mht and relative.endswith("/cutoffs.parquet"):
        return "mht_cutoff"
    if is_mht and path.name == "seat-matrix.parquet":
        return "mht_seat_matrix"
    if is_mht and path.name == "predictor-index.parquet":
        return "mht_predictor_index"
    if relative.endswith("/cutoffs.parquet"):
        return "jee_cutoff"
    if path.name == "seat-matrix.parquet" and "/seat-matrix/" in relative:
        return "jee_seat_matrix"
    if (
        "/tools/college-predictor/" in relative
        and path.name == "predictor-index.parquet"
    ):
        return "jee_predictor_index"
    return "unknown"


def cast_string_columns(frame: pl.DataFrame) -> pl.DataFrame:
    columns = (
        "institute_id",
        "program_id",
        "quota",
        "seat_type",
        "gender",
        "rank_exam",
        "instype",
        "data_quality",
    )
    casts = [
        pl.col(column).cast(pl.String)
        for column in columns
        if column in frame.columns
    ]
    return frame.with_columns(casts) if casts else frame


def check_required_columns(frame, required, report, label: str) -> None:
    missing = [column for column in required if column not in frame.columns]
    if missing:
        report.add(f"{label}: missing columns {missing}")


def check_duplicates(frame, key_columns, report, label: str) -> None:
    available = [column for column in key_columns if column in frame.columns]
    if len(available) != len(key_columns):
        return
    duplicates = frame.group_by(available).len().filter(pl.col("len") > 1)
    if len(duplicates) > 0:
        report.add(
            f"{label}: {len(duplicates)} duplicate row groups on {available}"
        )


def check_non_negative_seats(frame, report, label: str) -> None:
    if "seats" not in frame.columns:
        return
    invalid = frame.filter(pl.col("seats") < 0)
    if len(invalid) > 0:
        report.add(f"{label}: {len(invalid)} rows with negative seats")
