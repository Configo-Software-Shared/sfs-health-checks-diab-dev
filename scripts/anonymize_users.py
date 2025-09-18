#!/usr/bin/env python3
import argparse
import json
import re
import sys
from typing import Tuple, Dict, Any
from .name_generator import anon_values

def extract_array_block(text: str) -> Tuple[int, int]:
    # Find the first '[' after an '=' (to target "const usersData = [ ... ];")
    m = re.search(r"=\s*\[", text)
    if not m:
        # Fallback: first '[' in file
        start = text.find("[")
        if start == -1:
            raise ValueError("Could not find array start '[' in file.")
    else:
        start = m.start()
        start = text.find("[", start)
    # Match the closing bracket of this array using a simple bracket counter
    depth = 0
    for i in range(start, len(text)):
        c = text[i]
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                end = i  # inclusive index of closing ']'
                return start, end
    raise ValueError("Could not find matching ']' for array.")

def load_json_array_from_js(text: str) -> Tuple[Any, int, int]:
    s, e = extract_array_block(text)
    arr_text = text[s : e + 1]
    try:
        data = json.loads(arr_text)
    except json.JSONDecodeError as ex:
        raise ValueError(f"Embedded array is not valid JSON: {ex}") from ex
    if not isinstance(data, list):
        raise ValueError("Embedded structure is not a JSON array.")
    return data, s, e

def anonymize_users(arr: list) -> list:
    cache: Dict[str, Tuple[str, str, str]] = {}
    for obj in arr:
        if not isinstance(obj, dict):
            continue
        # Use the original username as the stable seed for name generation,
        # fall back to id, then email, then the object itself
        seed = obj.get("username") or obj.get("id") or obj.get("email") or json.dumps(obj, sort_keys=True)
        if seed not in cache:
            cache[seed] = anon_values(seed)
        u, n, e = cache[seed]
        if "username" in obj:
            obj["username"] = u
        if "name" in obj:
            obj["name"] = n
        if "email" in obj:
            obj["email"] = e
    return arr

def main():
    ap = argparse.ArgumentParser(description="Anonymize username, name, and email in a JS file containing a user array.")
    ap.add_argument("input", help="Path to JS file (e.g., docs/21.Permissions.js)")
    ap.add_argument("-i", "--in-place", action="store_true", help="Overwrite the input file")
    ap.add_argument("-o", "--output", help="Write result to this file (default: stdout unless --in-place)")
    ap.add_argument("--indent", type=int, default=None, help="Indent for JSON reserialization (default: 2)")
    args = ap.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        text = f.read()

    arr, s, e = load_json_array_from_js(text)
    arr = anonymize_users(arr)

    # Re-serialize the array; keep the rest of the file (const, semicolons, etc.) intact.
    arr_json = json.dumps(arr, ensure_ascii=False, indent=args.indent)
    if args.indent is None:
        arr_json = re.sub(r' *\{"username":', r'\n  {"username":', arr_json)
        # The semicolon is in the source file but not in arr_json
        arr_json = re.sub(r'(\]\s*\})\s*(\])', r'\1\n\2', arr_json)
    out_text = text[:s] + arr_json + text[e + 1 :]

    if args.in_place:
        with open(args.input, "w", encoding="utf-8") as f:
            f.write(out_text)
    else:
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(out_text)
        else:
            sys.stdout.write(out_text)

if __name__ == "__main__":
    main()