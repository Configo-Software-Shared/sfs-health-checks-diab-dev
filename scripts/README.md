# Scripts

Utilities to anonymize data in the `docs/` JavaScript sources while keeping deterministic mappings across runs and files.

## Shared generator: `name_generator.py`

Functions:

- `pick_name(seed: str) -> (first: str, last: str)`: Deterministically maps a seed (e.g., username) to a realistic first/last name using SHA-256 bits. Name lists are padded to powers of two for uniform selection.
- stable_token(source: str, length: int = 10) -> str: Stable hexadecimal token derived from SHA-256 of the source.
- anon_values(seed: str) -> (username: str, display_name: str, email: str): Builds `first.last.<token>` username and `first.last.<token>@example.invalid` email from the deterministic name and short token.

Example:

```python
from scripts.name_generator import pick_name, anon_values, stable_token
first, last = pick_name("original.username@example.com")
username, display_name, email = anon_values("original.username@example.com")
```

## Anonymize users array: `anonymize_users.py`

Rewrites `username`, `name`, and `email` fields inside a JSON array embedded in a JS file like `docs/21.Permissions.js`.

- Seed for determinism: original `username` (fallback to `id`, then `email`).
- Only the array content is replaced; the rest of the file remains intact.

CLI:

```bash
python3 -m scripts.anonymize_users docs/21.Permissions.js --in-place
```

Options:

- `--in-place`: overwrite the input file
- `-o, --output PATH`: write to PATH instead of stdout (ignored if --in-place)
- `--indent N`: JSON indent for the array (default: preserve compact layout)

**CAUTION**: Only run the script in place once, otherwise stability is lost because previously generated usernames will be the new seed.

## Anonymize membership display names: `anonymize_membership_names.py`

Rewrites only the `name` property where the value looks like `Full Name (username)`, such as in `docs/50.ServiceTerritories.js` membership sections. Preserves all other content and whitespace.

- The username inside parentheses is used as the deterministic seed.
- Output format remains `First Last (first.last.<token>)`.

CLI:

```bash
python3 -m scripts.anonymize_membership_names docs/50.ServiceTerritories.js --in-place
```

Notes:

- Both scripts rely on `scripts/name_generator.py` for stable, uniform name/token generation.
- When importing these utilities elsewhere, pass the same original identifier (prefer the original username) to keep mappings consistent across files.
