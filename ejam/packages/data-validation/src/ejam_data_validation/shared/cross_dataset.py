import polars as pl

from ejam_data_validation.jee.validate_parquet import (
    DUAL_CLASS_OK,
    load_registry_ids,
    new_slug_instype_map,
    validate_jee_file,
)
from ejam_data_validation.mht_cet.validate_parquet import validate_mht_file
from ejam_data_validation.shared.parquet import (
    ROOT,
    cast_string_columns,
    classify_file,
    discover_parquet_files,
)
from ejam_data_validation.shared.reporting import Report


def validate_parquet_files() -> int:
    report = Report()
    files = discover_parquet_files()
    if not files:
        print("no parquet files found under data/datasets or data/tools")
        return 0

    institute_ids = load_registry_ids()
    slug_instypes = new_slug_instype_map()
    print(f"validating {len(files)} parquet files")
    for path in files:
        kind = classify_file(path)
        label = path.relative_to(ROOT).as_posix()
        print(f"\n{label} [{kind}]")
        frame = cast_string_columns(pl.read_parquet(path))
        handled = validate_mht_file(frame, kind, report, label)
        if not handled:
            handled = validate_jee_file(
                frame, kind, institute_ids, slug_instypes, report, label
            )
        if not handled:
            report.add(f"{label}: unknown parquet kind")

    inconsistent = {
        slug: types
        for slug, types in slug_instypes.items()
        if len(types) > 1 and slug not in DUAL_CLASS_OK
    }
    if inconsistent:
        report.add(f"cross-file instype inconsistency: {inconsistent}")

    print("\n" + "=" * 60)
    if report.issues:
        print(f"FAIL — {len(report.issues)} issue(s)")
        return 1
    print("ALL CHECKS PASSED")
    return 0
