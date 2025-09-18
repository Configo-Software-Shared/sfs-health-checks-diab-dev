#!/usr/bin/env python3
import argparse
import re
import sys

from .name_generator import pick_name, stable_token


def anonymize_emails_in_values_block(values_block: str) -> str:
    # Replace quoted emails inside the provided values block, preserving surrounding whitespace and punctuation
    email_re = re.compile(r'"([^"\s]+@[^"\s]+)"')

    def repl(m: re.Match) -> str:
        original_email = m.group(1)
        first, last = pick_name(original_email)
        token = stable_token(original_email, length=6)
        new_email = f"{first.lower()}.{last.lower()}.{token}@example.invalid"
        return f'"{new_email}"'

    return email_re.sub(repl, values_block)


def anonymize_file_text(text: str) -> str:
    # Find each object where name == "ValidatedFromAddress" and rewrite only the emails
    pattern = re.compile(
        r'("name"\s*:\s*"ValidatedFromAddress"[\s\S]*?"values"\s*:\s*\[)'
        r'([\s\S]*?)'
        r'(\])',
        re.DOTALL,
    )

    def block_repl(m: re.Match) -> str:
        prefix = m.group(1)
        values_block = m.group(2)
        suffix = m.group(3)
        new_values_block = anonymize_emails_in_values_block(values_block)
        return f"{prefix}{new_values_block}{suffix}"

    return pattern.sub(block_repl, text)


def main():
    ap = argparse.ArgumentParser(
        description="Anonymize emails in ValidatedFromAddress picklists in-place (uses email as seed)."
    )
    ap.add_argument("input", help="Path to JS file (e.g., docs/20.ObjectSchema.js)")
    ap.add_argument("--in-place", action="store_true", help="Overwrite the input file")
    args = ap.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        text = f.read()

    out_text = anonymize_file_text(text)

    if args.in_place:
        with open(args.input, "w", encoding="utf-8") as f:
            f.write(out_text)
    else:
        sys.stdout.write(out_text)


if __name__ == "__main__":
    main()


