"""Run all JEE and MHT-CET dataset validation."""

import sys

from ejam_data_validation.jee.validate_json import main as validate_json_main
from ejam_data_validation.shared.cross_dataset import validate_parquet_files


def main() -> int:
    print("=" * 60)
    print("JEE JSON")
    print("=" * 60)
    json_failed = validate_json_main() != 0

    print("\n" + "=" * 60)
    print("PARQUET")
    print("=" * 60)
    parquet_failed = validate_parquet_files() != 0

    print("\n" + "=" * 60)
    if json_failed or parquet_failed:
        print("FAIL")
        return 1
    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
