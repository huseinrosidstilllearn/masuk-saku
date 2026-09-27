#!/usr/bin/env bash
set -euo pipefail
: "${PGHOST:?Missing PGHOST}" "${PGUSER:?Missing PGUSER}" "${PGPASSWORD:?Missing PGPASSWORD}" "${PGDATABASE:?Missing PGDATABASE}" "${BACKUP_AGE_RECIPIENT:?Missing BACKUP_AGE_RECIPIENT}"
export PGSSLMODE="${PGSSLMODE:-require}"
export PGPORT="${PGPORT:-5432}"
task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="$task_root/backups"
mkdir -p -- "$backup_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
plain_file="$backup_dir/masuk-saku-$stamp.dump"
encrypted_file="$plain_file.age"
trap 'rm -f -- "$plain_file"' EXIT
docker run --rm -e PGHOST -e PGPORT -e PGUSER -e PGPASSWORD -e PGDATABASE -e PGSSLMODE \
  --mount "type=bind,src=$backup_dir,dst=/backups" postgres:17 \
  pg_dump --format=custom --no-owner --no-acl --schema=public --schema=auth --schema=private --schema=storage \
  --file="/backups/masuk-saku-$stamp.dump"
age --recipient "$BACKUP_AGE_RECIPIENT" --output "$encrypted_file" "$plain_file"
sha256sum -- "$encrypted_file"
