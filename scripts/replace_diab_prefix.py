#!/usr/bin/env python3
"""
Apply a sequence of regex find/replace operations to the provided file.
By default, the transformed content is written to stdout. Use --in-place to
overwrite the file with the replacements.

Usage:
  python scripts/replace_diab_prefix.py path/to/file.txt
  python scripts/replace_diab_prefix.py --in-place path/to/file.txt
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from typing import Iterable, NoReturn, Tuple


# List of (compiled_regex, replacement) tuples applied in order.
# Extend this list to add more transformations without changing script logic.
PATTERN_REPLACEMENTS: Iterable[Tuple[re.Pattern[str], str]] = (
    (re.compile(r"\bDiab_"), "Acme_"),
)


def error_and_exit(message: str, code: int = 1) -> NoReturn:
    print(message, file=sys.stderr)
    sys.exit(code)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Apply hard-coded regex replacements to the given file."
    )
    parser.add_argument(
        "file",
        help="Path to the input file to process",
    )
    parser.add_argument(
        "--in-place",
        dest="in_place",
        action="store_true",
        help="Overwrite the input file with the transformed content",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = args.file

    if not os.path.isfile(input_path):
        error_and_exit(f"File not found: {input_path}")

    try:
        with open(input_path, "r", encoding="utf-8") as f:
            original = f.read()
    except UnicodeDecodeError:
        # Fallback to default encoding if UTF-8 fails
        with open(input_path, "r") as f:
            original = f.read()

    transformed = original
    for compiled_pattern, replacement_text in PATTERN_REPLACEMENTS:
        transformed = compiled_pattern.sub(replacement_text, transformed)

    if args.in_place:
        # Only write if content changed, to avoid touching mtime unnecessarily
        if transformed != original:
            try:
                with open(input_path, "w", encoding="utf-8") as f:
                    f.write(transformed)
            except UnicodeEncodeError:
                with open(input_path, "w") as f:
                    f.write(transformed)
        return 0

    # Default: write to stdout
    sys.stdout.write(transformed)
    return 0


if __name__ == "__main__":
    sys.exit(main())


