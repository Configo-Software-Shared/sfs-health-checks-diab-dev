#!/usr/bin/env python3
import argparse
import re
import sys

from .name_generator import pick_name, stable_token

NAME_FIELD_RE = re.compile(r'("name"\s*:\s*")([^("]+?)\s*\(([^)"]+?)\)("\s*,)')

def anonymize_line(line: str) -> str:
    def repl(match: re.Match) -> str:
        prefix, display_name, username_in_parens, suffix = match.groups()
        first, last = pick_name(username_in_parens)
        token = stable_token(username_in_parens, length=6)
        new_display = f"{first} {last} ({first.lower()}.{last.lower()}.{token})"
        return f"{prefix}{new_display}{suffix}"
    return NAME_FIELD_RE.sub(repl, line)

def main():
    ap = argparse.ArgumentParser(description="Anonymize name fields like 'Full Name (username)' in a JS file in place.")
    ap.add_argument("input", help="Path to JS file (e.g., docs/50.ServiceTerritories.js)")
    ap.add_argument("--in-place", action="store_true", help="Overwrite the input file")
    args = ap.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        lines = f.readlines()

    out_lines = [anonymize_line(line) for line in lines]

    if args.in_place:
        with open(args.input, "w", encoding="utf-8") as f:
            f.writelines(out_lines)
    else:
        sys.stdout.writelines(out_lines)

if __name__ == "__main__":
    main()


