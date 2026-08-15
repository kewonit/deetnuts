from __future__ import annotations

import json
from pathlib import Path
from typing import Protocol

import polars as pl

from ejam_data_validation.mht_cet.schema import (
    MHT_CUTOFF_COLUMNS,
    MHT_DATA_QUALITY_VALUES,
    MHT_PREDICTOR_INDEX_COLUMNS,
    MHT_SEAT_MATRIX_COLUMNS,
)

MHT_EXPECTED_CUTOFF_ROWS = {
    (2024, 1): 31_781,
    (2024, 2): 30_834,
    (2024, 3): 16_734,
    (2025, 1): 34_433,
    (2025, 2): 33_463,
    (2025, 3): 17_983,
    (2025, 4): 13_744,
    (2026, 1): 36_053,
}

MHT_STAGE_SEMANTICS = {
    "I": "standard",
    "II": "ladies-to-male-same-category",
    "I-Non PWD": "pwd-released-to-base-category",
    "I-Non Defence": "defence-released-to-base-category",
    "MH": "minority-to-maharashtra",
    "VII": "unrestricted-maharashtra-merit",
}

MHT_SOURCE_SCOPES = {
    "HOME_TO_HOME": "home-university",
    "HOME_TO_OTHER": "home-university",
    "OTHER_TO_HOME": "other-university",
    "OTHER_TO_OTHER": "other-university",
    "STATE_LEVEL": "state-level",
    "MAHARASHTRA_STATE": "maharashtra-state",
}

MHT_EFFECTIVE_SCOPES = {
    "HOME_TO_HOME": "home-university",
    "HOME_TO_OTHER": "other-university",
    "OTHER_TO_HOME": "home-university",
    "OTHER_TO_OTHER": "other-university",
    "STATE_LEVEL": "state-level",
    "MAHARASHTRA_STATE": "maharashtra-state",
}


class IssueReporter(Protocol):
    def add(self, msg: str) -> None: ...


def check_mht_codes(
    df: pl.DataFrame,
    rep: IssueReporter,
    label: str,
) -> None:
    if "institute_code" in df.columns:
        bad = df.filter(
            ~pl.col("institute_code")
            .cast(pl.String)
            .str.contains(r"^\d{5}$")
        )
        if len(bad) > 0:
            rep.add(
                f"{label}: {len(bad)} rows with invalid five-digit institute_code"
            )
    if "choice_code" in df.columns:
        bad = df.filter(
            ~pl.col("choice_code")
            .cast(pl.String)
            .str.contains(r"^\d{10}[A-Z]{0,2}$")
        )
        if len(bad) > 0:
            rep.add(f"{label}: {len(bad)} rows with invalid choice_code")


def check_mht_cutoff_rows(
    df: pl.DataFrame,
    rep: IssueReporter,
    label: str,
) -> None:
    check_mht_codes(df, rep, label)
    if "year" in df.columns and "round" in df.columns and len(df) > 0:
        years = df.select("year").unique().to_series().to_list()
        rounds = df.select("round").unique().to_series().to_list()
        if len(years) == 1 and len(rounds) == 1:
            expected = MHT_EXPECTED_CUTOFF_ROWS.get((years[0], rounds[0]))
            if expected is not None and len(df) != expected:
                rep.add(
                    f"{label}: expected {expected} official rows, found {len(df)}"
                )
    if "schema_version" in df.columns:
        invalid_schema = df.filter(pl.col("schema_version") != 3)
        if len(invalid_schema) > 0:
            rep.add(
                f"{label}: {len(invalid_schema)} rows outside MHT cutoff schema v3"
            )
    identity = [
        "year",
        "round",
        "institute_code",
        "choice_code",
        "seat_pool_id",
        "source_allocation_section",
        "source_stage_label",
        "source_stage_sequence",
    ]
    if set(identity).issubset(df.columns):
        duplicates = df.group_by(identity).len().filter(pl.col("len") > 1)
        if len(duplicates) > 0:
            rep.add(
                f"{label}: {len(duplicates)} duplicate official stage-cell identities"
            )
    if {"source_stage_label", "stage_semantics_id"}.issubset(df.columns):
        invalid_stages = df.filter(
            ~pl.struct(["source_stage_label", "stage_semantics_id"])
            .map_elements(
                lambda row: MHT_STAGE_SEMANTICS.get(
                    row["source_stage_label"]
                )
                == row["stage_semantics_id"],
                return_dtype=pl.Boolean,
            )
        )
        if len(invalid_stages) > 0:
            rep.add(
                f"{label}: {len(invalid_stages)} unknown or mismatched stage semantics"
            )
    if {
        "source_allocation_section",
        "source_seat_scope_id",
        "effective_allocation_scope_id",
    }.issubset(df.columns):
        invalid_scopes = df.filter(
            ~pl.struct(
                [
                    "source_allocation_section",
                    "source_seat_scope_id",
                    "effective_allocation_scope_id",
                ]
            ).map_elements(
                lambda row: (
                    MHT_SOURCE_SCOPES.get(row["source_allocation_section"])
                    == row["source_seat_scope_id"]
                    and MHT_EFFECTIVE_SCOPES.get(
                        row["source_allocation_section"]
                    )
                    == row["effective_allocation_scope_id"]
                ),
                return_dtype=pl.Boolean,
            )
        )
        if len(invalid_scopes) > 0:
            rep.add(
                f"{label}: {len(invalid_scopes)} rows with inconsistent source/effective scope"
            )
    if "closing_rank" in df.columns:
        bad = df.filter(
            pl.col("closing_rank").is_not_null()
            & (pl.col("closing_rank") <= 0)
        )
        if len(bad) > 0:
            rep.add(
                f"{label}: {len(bad)} rows with non-positive non-null closing_rank"
            )
    if "closing_percentile" in df.columns:
        bad = df.filter(
            pl.col("closing_percentile").is_not_null()
            & (
                (pl.col("closing_percentile") < 0)
                | (pl.col("closing_percentile") > 100)
            )
        )
        if len(bad) > 0:
            rep.add(
                f"{label}: {len(bad)} rows with percentile outside 0..100"
            )
        missing = df.filter(pl.col("closing_percentile").is_null())
        if len(missing) > 0:
            rep.add(
                f"{label}: {len(missing)} rows without historical percentile"
            )


def check_mht_predictor_rows(
    df: pl.DataFrame,
    rep: IssueReporter,
    label: str,
    reference_root: Path,
) -> None:
    check_mht_codes(df, rep, label)
    if "schema_version" in df.columns:
        invalid_schema = df.filter(pl.col("schema_version") != 3)
        if len(invalid_schema) > 0:
            rep.add(
                f"{label}: {len(invalid_schema)} rows outside MHT predictor schema v3"
            )
    if "data_quality" in df.columns:
        bad = df.filter(
            ~pl.col("data_quality").is_in(list(MHT_DATA_QUALITY_VALUES))
        )
        if len(bad) > 0:
            rep.add(f"{label}: {len(bad)} rows with invalid MHT data_quality")
    if {"years_of_data", "data_quality"}.issubset(df.columns):
        inconsistent = df.filter(
            (pl.col("years_of_data") == 2)
            != (pl.col("data_quality") == "inferred")
        )
        if len(inconsistent) > 0:
            rep.add(
                f"{label}: {len(inconsistent)} rows with inconsistent years/data quality"
            )

    reference_rows = []
    for year in (2024, 2025, 2026):
        reference_path = (
            reference_root
            / "engineering"
            / "mht-cet"
            / f"institutes-{year}.json"
        )
        if reference_path.exists():
            reference_rows.extend(json.loads(reference_path.read_text()))
    home_universities = {
        row["home_university_id"] for row in reference_rows
    }
    minority_communities = {
        row["minority_community_id"]
        for row in reference_rows
        if row["minority_community_id"] is not None
    }
    if "home_university_id" in df.columns and home_universities:
        unknown = df.filter(
            ~pl.col("home_university_id").is_in(list(home_universities))
        )
        if len(unknown) > 0:
            rep.add(
                f"{label}: {len(unknown)} rows with unknown home university"
            )
    if "minority_community_id" in df.columns and minority_communities:
        unknown = df.filter(
            pl.col("minority_community_id").is_not_null()
            & ~pl.col("minority_community_id").is_in(
                list(minority_communities)
            )
        )
        if len(unknown) > 0:
            rep.add(
                f"{label}: {len(unknown)} rows with unknown minority community"
            )

    status_columns = [
        f"round{round_number}_status" for round_number in range(1, 5)
    ]
    if all(column in df.columns for column in status_columns):
        no_published_round = df.filter(
            pl.all_horizontal(
                [pl.col(column) == "not-published" for column in status_columns]
            )
        )
        if len(no_published_round) > 0:
            rep.add(
                f"{label}: {len(no_published_round)} rows without a published round"
            )
    for round_number in range(1, 5):
        column = f"round{round_number}_rank"
        if column in df.columns:
            bad = df.filter(
                pl.col(column).is_not_null() & (pl.col(column) <= 0)
            )
            if len(bad) > 0:
                rep.add(
                    f"{label}: {len(bad)} rows with non-positive {column}"
                )

    for round_number in range(1, 5):
        rank_column = f"round{round_number}_rank"
        residual_column = f"round{round_number}_relative_residuals"
        uncertainty_column = f"round{round_number}_uncertainty_source"
        quality_column = f"round{round_number}_data_quality"
        percentile_column = f"round{round_number}_percentile"
        status_column = f"round{round_number}_status"
        round_columns = [
            rank_column,
            residual_column,
            uncertainty_column,
            quality_column,
            percentile_column,
            status_column,
        ]
        if not all(column in df.columns for column in round_columns):
            continue
        inconsistent = df.filter(
            (
                (pl.col(status_column) == "rank")
                & (
                    pl.col(rank_column).is_null()
                    | pl.col(residual_column).is_null()
                    | pl.col(uncertainty_column).is_null()
                    | pl.col(quality_column).is_null()
                )
            )
            | (
                (pl.col(status_column) != "rank")
                & (
                    pl.col(rank_column).is_not_null()
                    | pl.col(residual_column).is_not_null()
                    | pl.col(uncertainty_column).is_not_null()
                    | pl.col(quality_column).is_not_null()
                )
            )
            | (
                (pl.col(status_column) == "percentile-only")
                & pl.col(percentile_column).is_null()
            )
            | (
                (pl.col(status_column) == "not-published")
                & pl.col(percentile_column).is_not_null()
            )
        )
        if len(inconsistent) > 0:
            rep.add(
                f"{label}: {len(inconsistent)} rows with inconsistent "
                f"round {round_number} model fields"
            )
        invalid_quality = df.filter(
            pl.col(quality_column).is_not_null()
            & ~pl.col(quality_column).is_in(
                list(MHT_DATA_QUALITY_VALUES)
            )
        )
        if len(invalid_quality) > 0:
            rep.add(
                f"{label}: {len(invalid_quality)} rows with invalid "
                f"{quality_column}"
            )
        if round_number == 4:
            invalid_round_four = df.filter(
                pl.col(quality_column).is_not_null()
                & (pl.col(quality_column) != "pooled")
            )
            if len(invalid_round_four) > 0:
                rep.add(
                    f"{label}: {len(invalid_round_four)} "
                    "round-four rows not pooled"
                )
