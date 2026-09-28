#!/usr/bin/env bash
set -euo pipefail
: "${BACKUP_RCLONE_CONFIG:?Missing private Google Drive configuration}"
command -v rclone >/dev/null
task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="$task_root/backups"
shopt -s nullglob
encrypted_files=("$backup_dir"/masuk-saku-*.dump.age "$backup_dir"/masuk-saku-*.storage.tar.age)
if (( ${#encrypted_files[@]} == 0 )); then
  echo 'No encrypted database backup found.' >&2
  exit 1
fi
for encrypted_file in "${encrypted_files[@]}"; do
  [[ -s "$encrypted_file" ]] || { echo 'Empty encrypted backup refused.' >&2; exit 1; }
  IFS= read -r encryption_header < "$encrypted_file" || true
  [[ "$encryption_header" == 'age-encryption.org/v1' ]] || { echo 'Expected age-encrypted backup; upload refused.' >&2; exit 1; }
done
# OAuth configuration never enters the checkout, command arguments or logs.
umask 077
private_dir="$(mktemp -d)"
trap 'rm -f -- "$private_dir/rclone.conf"; rmdir -- "$private_dir"' EXIT
printf '%s\n' "$BACKUP_RCLONE_CONFIG" > "$private_dir/rclone.conf"
unset BACKUP_RCLONE_CONFIG
rclone copy "$backup_dir" 'drivebackup:MasukSaku-Backups' \
  --config "$private_dir/rclone.conf" --include '/masuk-saku-*.dump.age' --include '/masuk-saku-*.storage.tar.age' \
  --checksum --immutable --retries 3
rclone check "$backup_dir" 'drivebackup:MasukSaku-Backups' \
  --config "$private_dir/rclone.conf" --include '/masuk-saku-*.dump.age' --include '/masuk-saku-*.storage.tar.age' \
  --one-way --checksum
echo 'Encrypted backup uploaded to Google Drive and checksum checked.'
