#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import sys
from typing import Tuple, Dict, Any

FIRST_NAMES = [
    "Aiden", "Amelia", "Aria", "Arthur", "Ava", "Benjamin", "Caleb", "Camila", "Charlotte",
    "Chloe", "Daniel", "David", "Eleanor", "Elijah", "Ella", "Emily", "Emma", "Ethan",
    "Evelyn", "Gabriel", "Grace", "Hannah", "Harper", "Hazel", "Henry", "Isaac", "Isabella",
    "Jack", "Jackson", "Jacob", "James", "Jasmine", "Joseph", "Layla", "Levi", "Liam",
    "Lily", "Logan", "Lucas", "Lucy", "Luna", "Madison", "Mason", "Mateo", "Mia",
    "Michael", "Mila", "Nathan", "Noah", "Nora", "Oliver", "Olivia", "Owen", "Penelope",
    "Samuel", "Scarlett", "Sebastian", "Sofia", "Sophia", "Theodore", "Victoria", "William",
    "Wyatt", "Zoe"
]

LAST_NAMES = [
    "Adams", "Allen", "Anderson", "Bailey", "Baker", "Barnes", "Bell", "Bennett", "Brooks",
    "Brown", "Bryant", "Butler", "Campbell", "Carter", "Clark", "Collins", "Cook", "Cooper",
    "Cox", "Davis", "Diaz", "Edwards", "Evans", "Fisher", "Foster", "Garcia", "Gonzalez",
    "Graham", "Gray", "Green", "Griffin", "Hall", "Harris", "Henderson", "Hernandez", "Hill",
    "Howard", "Hughes", "Jackson", "James", "Jenkins", "Johnson", "Jones", "Kelly", "King",
    "Lee", "Lewis", "Long", "Lopez", "Martinez", "Miller", "Mitchell", "Moore", "Morgan",
    "Morris", "Murphy", "Nelson", "Nguyen", "Parker", "Perez", "Perry", "Peterson", "Phillips",
    "Powell", "Price", "Ramirez", "Reed", "Reyes", "Richardson", "Rivera", "Roberts", "Robinson",
    "Rodriguez", "Rogers", "Ross", "Russell", "Sanders", "Scott", "Simmons", "Smith", "Stewart",
    "Taylor", "Thomas", "Thompson", "Torres", "Turner", "Walker", "Ward", "Washington", "Watson",
    "White", "Williams", "Wilson", "Wood", "Wright", "Young"
]

def stable_token(source: str, length: int = 10) -> str:
    return hashlib.sha256(source.encode("utf-8")).hexdigest()[:length]

def _is_power_of_two(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0

def _next_power_of_two(n: int) -> int:
    if n <= 1:
        return 1
    return 1 << (n - 1).bit_length()

def _pad_to_power_of_two(items: list) -> list:
    target = _next_power_of_two(len(items))
    if target == len(items):
        return items
    padded = list(items)
    idx = 0
    while len(padded) < target:
        padded.append(items[idx % len(items)])
        idx += 1
    return padded

def _get_bits_from_digest(digest: bytes, start_bit: int, num_bits: int) -> int:
    # Extract num_bits starting at start_bit from the digest (big-endian bit numbering)
    total_bits = len(digest) * 8
    if start_bit + num_bits > total_bits:
        # Wrap by hashing again with a domain separator
        extra = hashlib.sha256(digest + b"/extra").digest()
        digest = digest + extra
        total_bits = len(digest) * 8
    value = 0
    for i in range(num_bits):
        bit_index = start_bit + i
        byte_index = bit_index // 8
        bit_in_byte = 7 - (bit_index % 8)
        bit = (digest[byte_index] >> bit_in_byte) & 1
        value = (value << 1) | bit
    return value

def pick_name(seed_username: str) -> Tuple[str, str]:
    # Prepare padded lists for uniform index distribution across 2^k space
    padded_first = _pad_to_power_of_two(FIRST_NAMES)
    padded_last = _pad_to_power_of_two(LAST_NAMES)
    bits_first = (_next_power_of_two(len(padded_first)) - 1).bit_length()
    bits_last = (_next_power_of_two(len(padded_last)) - 1).bit_length()
    digest = hashlib.sha256(seed_username.encode("utf-8")).digest()
    idx_first = _get_bits_from_digest(digest, 0, bits_first)
    idx_last = _get_bits_from_digest(digest, bits_first, bits_last)
    first = padded_first[idx_first]
    last = padded_last[idx_last]
    return first, last

def anon_values(seed: str) -> Tuple[str, str, str]:
    first, last = pick_name(seed)
    token = stable_token(seed, length=6)
    username = f"{first.lower()}.{last.lower()}.{token}"
    display_name = f"{first} {last}"
    email = f"{first.lower()}.{last.lower()}.{token}@example.invalid"
    return username, display_name, email

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