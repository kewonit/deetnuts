import polars as pl

from ejam_data_validation.mht_cet.validate import (
    MHT_CUTOFF_COLUMNS,
    MHT_PREDICTOR_INDEX_COLUMNS,
    MHT_SEAT_MATRIX_COLUMNS,
    check_mht_codes,
    check_mht_cutoff_rows,
    check_mht_predictor_rows,
)
from ejam_data_validation.shared.parquet import (
    REFERENCE_ROOT,
    check_duplicates,
    check_non_negative_seats,
    check_required_columns,
)


def validate_mht_file(
    frame: pl.DataFrame,
    kind: str,
    report,
    label: str,
) -> bool:
    if kind == "mht_cutoff":
        check_required_columns(frame, MHT_CUTOFF_COLUMNS, report, label)
        check_duplicates(
            frame,
            ["year", "round", "institute_code", "choice_code", "seat_pool_id",
             "source_allocation_section", "source_stage_label",
             "source_stage_sequence"],
            report,
            label,
        )
        check_mht_cutoff_rows(frame, report, label)
    elif kind == "mht_seat_matrix":
        check_required_columns(frame, MHT_SEAT_MATRIX_COLUMNS, report, label)
        check_duplicates(
            frame,
            ["year", "institute_code", "choice_code", "seat_pool_id"],
            report,
            label,
        )
        check_mht_codes(frame, report, label)
        check_non_negative_seats(frame, report, label)
    elif kind == "mht_predictor_index":
        check_required_columns(frame, MHT_PREDICTOR_INDEX_COLUMNS, report, label)
        check_duplicates(
            frame,
            ["institute_code", "choice_code", "seat_pool_id",
             "source_seat_scope_id", "allocation_scope_id",
             "stage_semantics_id"],
            report,
            label,
        )
        check_mht_predictor_rows(frame, report, label, REFERENCE_ROOT)
    else:
        return False
    return True
