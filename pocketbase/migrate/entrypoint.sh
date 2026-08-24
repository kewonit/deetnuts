#!/bin/sh
set -eu

read_secret() {
  secret_file=$1
  [ -f "$secret_file" ] && [ ! -L "$secret_file" ] || {
    echo "Required migration secret file is missing or unsafe" >&2
    exit 1
  }
  secret_value=$(cat "$secret_file")
  [ -n "$secret_value" ] || {
    echo "Required migration secret is empty" >&2
    exit 1
  }
  printf '%s' "$secret_value"
}

POCKETBASE_SUPERUSER_EMAIL=$(read_secret /run/secrets/pocketbase_superuser_email)
POCKETBASE_SUPERUSER_PASSWORD=$(read_secret /run/secrets/pocketbase_superuser_password)
DEETNUTS_MIGRATION_KEY=$(read_secret /run/secrets/pocketbase_migration_key)
[ "${#POCKETBASE_SUPERUSER_PASSWORD}" -ge 32 ] && [ "${#POCKETBASE_SUPERUSER_PASSWORD}" -le 72 ] || {
  echo "PocketBase superuser password must contain between 32 and 72 characters" >&2
  exit 1
}
export POCKETBASE_SUPERUSER_EMAIL POCKETBASE_SUPERUSER_PASSWORD DEETNUTS_MIGRATION_KEY

exec node --import tsx /migration/scripts/migrate-supabase-to-pocketbase.ts --execute
