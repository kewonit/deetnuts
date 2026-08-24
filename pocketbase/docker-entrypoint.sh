#!/bin/sh
set -eu

read_secret() {
  secret_file=$1
  [ -f "$secret_file" ] && [ ! -L "$secret_file" ] || {
    echo "Required PocketBase secret file is missing or unsafe" >&2
    exit 1
  }
  secret_value=$(cat "$secret_file")
  [ -n "$secret_value" ] || {
    echo "Required PocketBase secret is empty" >&2
    exit 1
  }
  printf '%s' "$secret_value"
}

POCKETBASE_ENCRYPTION_KEY=$(read_secret /run/secrets/pocketbase_encryption_key)
POCKETBASE_SUPERUSER_EMAIL=$(read_secret /run/secrets/pocketbase_superuser_email)
POCKETBASE_SUPERUSER_PASSWORD=$(read_secret /run/secrets/pocketbase_superuser_password)
export POCKETBASE_ENCRYPTION_KEY

if [ "${DEETNUTS_MIGRATION_MODE:-0}" = "1" ]; then
  DEETNUTS_MIGRATION_KEY=$(read_secret /run/secrets/pocketbase_migration_key)
  [ "${#DEETNUTS_MIGRATION_KEY}" -ge 32 ] || {
    echo "PocketBase migration key must contain at least 32 characters" >&2
    exit 1
  }
  export DEETNUTS_MIGRATION_KEY
else
  unset DEETNUTS_MIGRATION_KEY
fi

[ "${#POCKETBASE_ENCRYPTION_KEY}" -eq 32 ] || {
  echo "PocketBase encryption key must contain exactly 32 characters" >&2
  exit 1
}
[ "${#POCKETBASE_SUPERUSER_PASSWORD}" -ge 32 ] && [ "${#POCKETBASE_SUPERUSER_PASSWORD}" -le 72 ] || {
  echo "PocketBase superuser password must contain between 32 and 72 characters" >&2
  exit 1
}

/usr/local/bin/pocketbase superuser upsert \
  "$POCKETBASE_SUPERUSER_EMAIL" \
  "$POCKETBASE_SUPERUSER_PASSWORD" \
  --dir=/pb/pb_data \
  --hooksDir=/pb/pb_hooks \
  --migrationsDir=/pb/pb_migrations \
  --encryptionEnv=POCKETBASE_ENCRYPTION_KEY \
  --hooksWatch=false >/dev/null

unset POCKETBASE_SUPERUSER_EMAIL POCKETBASE_SUPERUSER_PASSWORD

exec /usr/local/bin/pocketbase serve \
  --http=0.0.0.0:8090 \
  --origins=https://www.deetnuts.com,https://deetnuts.com \
  --dir=/pb/pb_data \
  --hooksDir=/pb/pb_hooks \
  --hooksPool=4 \
  --hooksWatch=false \
  --migrationsDir=/pb/pb_migrations \
  --encryptionEnv=POCKETBASE_ENCRYPTION_KEY \
  --queryTimeout=20
