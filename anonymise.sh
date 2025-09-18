#!/bin/zsh
python3 -m scripts.anonymize_users docs/21.Permissions.js --in-place
python3 -m scripts.anonymize_membership_names docs/50.ServiceTerritories.js --in-place
python3 -m scripts.anonymize_validated_from_address docs/20.ObjectSchema.js --in-place
python3 scripts/replace_diab_prefix.py docs/21.Permissions.js --in-place
