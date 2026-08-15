import json
from collections import defaultdict
from pathlib import Path

import polars as pl

from ejam_data_validation.shared.parquet import (
    REFERENCE_ROOT,
    check_duplicates,
    check_non_negative_seats,
    check_required_columns,
)

CUTOFF_COLUMNS = (
    "year", "round", "institute_id", "program_id", "quota", "seat_type",
    "gender", "opening_rank", "closing_rank", "rank_exam", "instype",
    "degree", "duration_years", "source", "source_id", "run_id",
    "source_locator",
)
SEAT_MATRIX_COLUMNS = (
    "year", "institute_id", "program_id", "quota", "seat_type", "gender",
    "seats", "source",
)
PREDICTOR_INDEX_COLUMNS = (
    "institute_id", "program_id", "seat_type", "quota", "gender", "instype",
    "degree", "duration_years", "weighted_mean", "weighted_std",
    "trend_slope", "sigma_base", "sigma_effective",
    "predicted_closing_rank", "data_quality", "years_of_data",
    "last_data_year", "min_closing_rank", "max_closing_rank", "fill_round",
)
DATA_QUALITY_VALUES = {"pooled", "inferred", "sufficient"}
DUAL_CLASS_OK = {"iiest-shibpur"}
INSTYPE_PREFIX_RULES = {
    "iit-": {"IIT"},
    "iiit-": {"IIIT", "3IT", "CFI"},
    "nit-": {"NIT"},
}
INSTYPE_ALIASES = {"3IT": "IIIT"}


def load_registry_ids() -> set[str]:
    path = REFERENCE_ROOT / "engineering" / "institutes.json"
    if not path.exists():
        return set()
    return {institute["id"] for institute in json.loads(path.read_text())}


def normalize_instype(instype: str) -> str:
    return INSTYPE_ALIASES.get(instype, instype)


def check_registry(frame, institute_ids, report, label: str) -> None:
    if institute_ids and "institute_id" in frame.columns:
        invalid = frame.filter(~pl.col("institute_id").is_in(list(institute_ids)))
        if len(invalid) > 0:
            report.add(f"{label}: {len(invalid)} rows with unknown institute_id")


def check_instype(frame, report, label: str) -> None:
    if "instype" not in frame.columns or "institute_id" not in frame.columns:
        return
    for prefix, allowed in INSTYPE_PREFIX_RULES.items():
        condition = pl.col("institute_id").str.starts_with(prefix)
        if prefix == "iit-":
            condition &= ~pl.col("institute_id").str.starts_with("iiit-")
        invalid = frame.filter(condition & ~pl.col("instype").is_in(list(allowed)))
        if len(invalid) > 0:
            sample = invalid.select(["institute_id", "instype"]).unique().to_dicts()[:3]
            report.add(
                f"{label}: {prefix}* slug under wrong instype "
                f"(allowed={allowed}): {sample}"
            )


def check_cutoffs(frame, report, label: str) -> None:
    if "rank_exam" in frame.columns:
        invalid = frame.filter(
            pl.col("rank_exam").is_null() | (pl.col("rank_exam") == "")
        )
        if len(invalid) > 0:
            report.add(f"{label}: {len(invalid)} rows with missing rank_exam")
    if "opening_rank" in frame.columns and "closing_rank" in frame.columns:
        negative = frame.filter(
            (pl.col("opening_rank") < 0) | (pl.col("closing_rank") < 0)
        )
        if len(negative) > 0:
            report.add(f"{label}: {len(negative)} rows with negative ranks")
        invalid = frame.filter(pl.col("opening_rank") > pl.col("closing_rank"))
        if len(invalid) > 0:
            report.add(
                f"{label}: {len(invalid)} rows where opening_rank > closing_rank"
            )


def check_predictor(frame, report, label: str) -> None:
    if "data_quality" in frame.columns:
        invalid = frame.filter(
            ~pl.col("data_quality").is_in(list(DATA_QUALITY_VALUES))
        )
        if len(invalid) > 0:
            report.add(f"{label}: {len(invalid)} rows with invalid data_quality")
    if "predicted_closing_rank" in frame.columns:
        invalid = frame.filter(pl.col("predicted_closing_rank") <= 0)
        if len(invalid) > 0:
            report.add(
                f"{label}: {len(invalid)} rows with non-positive predicted_closing_rank"
            )


def validate_jee_file(
    frame: pl.DataFrame,
    kind: str,
    institute_ids: set[str],
    slug_instypes: dict[str, set[str]],
    report,
    label: str,
) -> bool:
    if kind == "jee_cutoff":
        check_required_columns(frame, CUTOFF_COLUMNS, report, label)
        check_registry(frame, institute_ids, report, label)
        check_instype(frame, report, label)
        check_duplicates(
            frame,
            ["year", "round", "institute_id", "program_id", "quota",
             "seat_type", "gender", "degree", "duration_years"],
            report,
            label,
        )
        check_cutoffs(frame, report, label)
    elif kind == "jee_seat_matrix":
        check_required_columns(frame, SEAT_MATRIX_COLUMNS, report, label)
        check_registry(frame, institute_ids, report, label)
        check_non_negative_seats(frame, report, label)
    elif kind == "jee_predictor_index":
        check_required_columns(frame, PREDICTOR_INDEX_COLUMNS, report, label)
        check_registry(frame, institute_ids, report, label)
        check_instype(frame, report, label)
        check_duplicates(
            frame,
            ["institute_id", "program_id", "quota", "seat_type", "gender"],
            report,
            label,
        )
        check_predictor(frame, report, label)
    else:
        return False
    if "instype" in frame.columns and "institute_id" in frame.columns:
        for row in frame.select(["institute_id", "instype"]).unique().to_dicts():
            slug_instypes[row["institute_id"]].add(normalize_instype(row["instype"]))
    return True


def new_slug_instype_map() -> dict[str, set[str]]:
    return defaultdict(set)
