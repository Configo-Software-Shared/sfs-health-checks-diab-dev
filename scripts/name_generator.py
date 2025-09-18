#!/usr/bin/env python3
import hashlib
from typing import Tuple

# Curated lists; padded to power-of-two for uniform distribution when indexing by bit slices.
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
    total_bits = len(digest) * 8
    if start_bit + num_bits > total_bits:
        extra = hashlib.sha256(digest + b"/extra").digest()
        digest = digest + extra
    value = 0
    for i in range(num_bits):
        bit_index = start_bit + i
        byte_index = bit_index // 8
        bit_in_byte = 7 - (bit_index % 8)
        bit = (digest[byte_index] >> bit_in_byte) & 1
        value = (value << 1) | bit
    return value

def pick_name(seed_username: str) -> Tuple[str, str]:
    padded_first = _pad_to_power_of_two(FIRST_NAMES)
    padded_last = _pad_to_power_of_two(LAST_NAMES)
    bits_first = (_next_power_of_two(len(padded_first)) - 1).bit_length()
    bits_last = (_next_power_of_two(len(padded_last)) - 1).bit_length()
    digest = hashlib.sha256(seed_username.encode("utf-8")).digest()
    idx_first = _get_bits_from_digest(digest, 0, bits_first)
    idx_last = _get_bits_from_digest(digest, bits_first, bits_last)
    return padded_first[idx_first], padded_last[idx_last]

def anon_values(seed: str) -> Tuple[str, str, str]:
    first, last = pick_name(seed)
    token = stable_token(seed, length=6)
    username = f"{first.lower()}.{last.lower()}.{token}"
    display_name = f"{first} {last}"
    email = f"{first.lower()}.{last.lower()}.{token}@example.invalid"
    return username, display_name, email


