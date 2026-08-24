#!/usr/bin/env bash
set -Eeuo pipefail

if (( EUID != 0 )); then
  echo "Run bootstrap-host.sh as root" >&2
  exit 1
fi

SOURCE_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
APP_ROOT=/opt/deetnuts
DEPLOY_USER=${DEETNUTS_DEPLOY_USER:-deetnuts-deploy}
DEPLOY_PUBLIC_KEY=${DEETNUTS_DEPLOY_PUBLIC_KEY:-}
TLS_GROUP=${DEETNUTS_TLS_GROUP:-deetnuts-tls}
TLS_GID=${DEETNUTS_TLS_GID:-1999}
POCKETBASE_GROUP=${DEETNUTS_POCKETBASE_GROUP:-deetnuts-pocketbase}
POCKETBASE_GID=${DEETNUTS_POCKETBASE_GID:-10001}

[[ "$DEPLOY_USER" =~ ^[a-z_][a-z0-9_-]{0,31}$ ]] || {
  echo "DEETNUTS_DEPLOY_USER is invalid" >&2
  exit 1
}
[[ "$TLS_GROUP" =~ ^[a-z_][a-z0-9_-]{0,31}$ ]] || {
  echo "DEETNUTS_TLS_GROUP is invalid" >&2
  exit 1
}
[[ "$POCKETBASE_GROUP" =~ ^[a-z_][a-z0-9_-]{0,31}$ ]] || {
  echo "DEETNUTS_POCKETBASE_GROUP is invalid" >&2
  exit 1
}
[[ "$TLS_GID" =~ ^[0-9]+$ && "$TLS_GID" -ge 100 && "$TLS_GID" -le 60000 ]] || {
  echo "DEETNUTS_TLS_GID must be an integer between 100 and 60000" >&2
  exit 1
}
[[ "$POCKETBASE_GID" =~ ^[0-9]+$ && "$POCKETBASE_GID" -ge 100 && "$POCKETBASE_GID" -le 60000 ]] || {
  echo "DEETNUTS_POCKETBASE_GID must be an integer between 100 and 60000" >&2
  exit 1
}
if [[ -e "$APP_ROOT" && ( ! -d "$APP_ROOT" || -L "$APP_ROOT" ) ]]; then
  echo "$APP_ROOT must be a real directory, not a file or symlink" >&2
  exit 1
fi
if systemctl is-active --quiet deetnuts.service 2>/dev/null; then
  echo "Stop deetnuts.service before updating host files with bootstrap-host.sh" >&2
  exit 1
fi

# This file is provided by the validated Ubuntu host.
# shellcheck disable=SC1091
source /etc/os-release
if [[ ${ID:-} != ubuntu || ${VERSION_ID:-} != 24.04 ]]; then
  echo "This bootstrap is intentionally limited to Ubuntu 24.04" >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl jq openssl sudo unattended-upgrades unzip util-linux
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

install -d -o root -g root -m 0755 /etc/docker
daemon_config=$(mktemp)
if [[ -f /etc/docker/daemon.json ]]; then
  jq '. + {"live-restore": true, "no-new-privileges": true, "userland-proxy": false}' \
    /etc/docker/daemon.json > "$daemon_config"
else
  jq -n '{"live-restore": true, "no-new-privileges": true, "userland-proxy": false}' \
    > "$daemon_config"
fi
install -o root -g root -m 0644 "$daemon_config" /etc/docker/daemon.json
rm -f "$daemon_config"
dockerd --validate --config-file=/etc/docker/daemon.json
systemctl restart docker

cat > /etc/apt/apt.conf.d/52deetnuts-unattended-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
systemctl enable --now unattended-upgrades

install -d -o root -g root -m 0755 /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/60-deetnuts-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitEmptyPasswords no
PermitRootLogin prohibit-password
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
PermitTunnel no
MaxAuthTries 3
LoginGraceTime 30
EOF
sshd -t
sshd_effective=$(sshd -T)
grep -qx 'passwordauthentication no' <<<"$sshd_effective"
grep -qx 'kbdinteractiveauthentication no' <<<"$sshd_effective"
grep -qx 'allowagentforwarding no' <<<"$sshd_effective"
grep -qx 'allowtcpforwarding no' <<<"$sshd_effective"
grep -qx 'permittunnel no' <<<"$sshd_effective"
systemctl reload ssh

if ! swapon --show=NAME --noheadings | grep -q .; then
  fallocate -l 1G /swapfile
  chmod 0600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -Fq '/swapfile none swap sw 0 0' /etc/fstab || \
    printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
fi
printf 'vm.swappiness=10\n' > /etc/sysctl.d/60-deetnuts-memory.conf
sysctl --system >/dev/null

install -d -m 0755 /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/deetnuts-retention.conf <<'EOF'
[Journal]
Storage=persistent
MaxRetentionSec=14day
SystemMaxUse=512M
MaxFileSec=1day
Compress=yes
EOF
systemctl restart systemd-journald

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi

if getent group "$TLS_GROUP" >/dev/null; then
  [[ $(getent group "$TLS_GROUP" | cut -d: -f3) == "$TLS_GID" ]] || {
    echo "$TLS_GROUP already exists with a different GID" >&2
    exit 1
  }
elif getent group "$TLS_GID" >/dev/null; then
  echo "GID $TLS_GID is already assigned to another group" >&2
  exit 1
else
  groupadd --system --gid "$TLS_GID" "$TLS_GROUP"
fi

if getent group "$POCKETBASE_GROUP" >/dev/null; then
  [[ $(getent group "$POCKETBASE_GROUP" | cut -d: -f3) == "$POCKETBASE_GID" ]] || {
    echo "$POCKETBASE_GROUP already exists with a different GID" >&2
    exit 1
  }
elif getent group "$POCKETBASE_GID" >/dev/null; then
  echo "GID $POCKETBASE_GID is already assigned to another group" >&2
  exit 1
else
  groupadd --system --gid "$POCKETBASE_GID" "$POCKETBASE_GROUP"
fi

install -d -o root -g root -m 0755 "$APP_ROOT"
install -d -o root -g root -m 0700 "$APP_ROOT/shared" "$APP_ROOT/state" "$APP_ROOT/state/releases"
install -d -o root -g root -m 0700 "$APP_ROOT/backups" "$APP_ROOT/backups/pocketbase"
install -d -o root -g "$TLS_GROUP" -m 0750 "$APP_ROOT/shared/certs"
install -d -o root -g "$POCKETBASE_GROUP" -m 0750 "$APP_ROOT/shared/pocketbase"
install -o root -g root -m 0644 "$SOURCE_ROOT/docker-compose.yml" "$APP_ROOT/docker-compose.yml"
rm -rf "$APP_ROOT/deploy"
cp -a "$SOURCE_ROOT/deploy" "$APP_ROOT/deploy"
chown -R root:root "$APP_ROOT/deploy"
find "$APP_ROOT/deploy/bin" -type f -exec chmod 0755 {} +

for cert_name in origin.pem origin-key.pem cloudflare-origin-pull-ca.pem; do
  if [[ -f "$APP_ROOT/shared/certs/$cert_name" ]]; then
    chown "root:$TLS_GROUP" "$APP_ROOT/shared/certs/$cert_name"
    chmod 0640 "$APP_ROOT/shared/certs/$cert_name"
  fi
done

install -o root -g root -m 0755 "$SOURCE_ROOT/deploy/bin/deetnuts-deploy" /usr/local/sbin/deetnuts-deploy
install -o root -g root -m 0755 "$SOURCE_ROOT/deploy/bin/deetnuts-start" /usr/local/sbin/deetnuts-start
install -o root -g root -m 0755 "$SOURCE_ROOT/deploy/bin/deetnuts-stop" /usr/local/sbin/deetnuts-stop
install -o root -g root -m 0755 "$SOURCE_ROOT/deploy/bin/deetnuts-reload" /usr/local/sbin/deetnuts-reload
install -o root -g root -m 0755 "$SOURCE_ROOT/deploy/bin/deetnuts-pocketbase-backup" /usr/local/sbin/deetnuts-pocketbase-backup
install -o root -g root -m 0755 "$SOURCE_ROOT/deploy/bin/deetnuts-pocketbase-migrate" /usr/local/sbin/deetnuts-pocketbase-migrate
install -o root -g root -m 0755 "$SOURCE_ROOT/deploy/bin/validate-pocketbase-secrets" /usr/local/sbin/validate-pocketbase-secrets
install -o root -g root -m 0755 "$SOURCE_ROOT/deploy/bin/deetnuts-command" /usr/local/bin/deetnuts-command
install -o root -g root -m 0644 "$SOURCE_ROOT/deploy/systemd/deetnuts.service" /etc/systemd/system/deetnuts.service
install -o root -g root -m 0644 "$SOURCE_ROOT/deploy/systemd/deetnuts-pocketbase-backup.service" /etc/systemd/system/deetnuts-pocketbase-backup.service
install -o root -g root -m 0644 "$SOURCE_ROOT/deploy/systemd/deetnuts-pocketbase-backup.timer" /etc/systemd/system/deetnuts-pocketbase-backup.timer

if [[ ! -f "$APP_ROOT/shared/web.env" ]]; then
  install -o root -g root -m 0600 "$SOURCE_ROOT/deploy/env/web.env.example" "$APP_ROOT/shared/web.env"
fi
if [[ ! -f "$APP_ROOT/shared/worker.env" ]]; then
  install -o root -g root -m 0600 "$SOURCE_ROOT/deploy/env/worker.env.example" "$APP_ROOT/shared/worker.env"
fi
if [[ ! -f "$APP_ROOT/shared/cloudflare.env" ]]; then
  install -o root -g root -m 0600 "$SOURCE_ROOT/deploy/env/cloudflare.env.example" "$APP_ROOT/shared/cloudflare.env"
fi
if [[ ! -f "$APP_ROOT/shared/discord-admin.env" ]]; then
  install -o root -g root -m 0600 "$SOURCE_ROOT/deploy/env/discord-admin.env.example" "$APP_ROOT/shared/discord-admin.env"
fi
if [[ ! -f "$APP_ROOT/shared/pocketbase-migration.env" ]]; then
  install -o root -g root -m 0600 \
    "$SOURCE_ROOT/deploy/env/pocketbase-migration.env.example" \
    "$APP_ROOT/shared/pocketbase-migration.env"
fi
for secret_name in \
  pocketbase_encryption_key \
  pocketbase_superuser_email \
  pocketbase_superuser_password \
  pocketbase_migration_key; do
  if [[ ! -f "$APP_ROOT/shared/pocketbase/$secret_name" ]]; then
    install -o root -g "$POCKETBASE_GROUP" -m 0440 \
      "$SOURCE_ROOT/deploy/secrets/$secret_name.example" \
      "$APP_ROOT/shared/pocketbase/$secret_name"
  fi
done
if [[ ! -f "$APP_ROOT/state/compose.env" ]]; then
  sed \
    -e "s#WEB_ENV_FILE=.*#WEB_ENV_FILE=$APP_ROOT/shared/web.env#" \
    -e "s#WORKER_ENV_FILE=.*#WORKER_ENV_FILE=$APP_ROOT/shared/worker.env#" \
    -e "s#NGINX_CONFIG_ROOT=.*#NGINX_CONFIG_ROOT=$APP_ROOT/deploy/nginx#" \
    -e "s#ORIGIN_CERT_DIR=.*#ORIGIN_CERT_DIR=$APP_ROOT/shared/certs#" \
    -e "s#POCKETBASE_ENCRYPTION_KEY_FILE=.*#POCKETBASE_ENCRYPTION_KEY_FILE=$APP_ROOT/shared/pocketbase/pocketbase_encryption_key#" \
    -e "s#POCKETBASE_SUPERUSER_EMAIL_FILE=.*#POCKETBASE_SUPERUSER_EMAIL_FILE=$APP_ROOT/shared/pocketbase/pocketbase_superuser_email#" \
    -e "s#POCKETBASE_SUPERUSER_PASSWORD_FILE=.*#POCKETBASE_SUPERUSER_PASSWORD_FILE=$APP_ROOT/shared/pocketbase/pocketbase_superuser_password#" \
    -e "s#POCKETBASE_MIGRATION_KEY_FILE=.*#POCKETBASE_MIGRATION_KEY_FILE=$APP_ROOT/shared/pocketbase/pocketbase_migration_key#" \
    -e "s#POCKETBASE_MIGRATION_ENV_FILE=.*#POCKETBASE_MIGRATION_ENV_FILE=$APP_ROOT/shared/pocketbase-migration.env#" \
    "$SOURCE_ROOT/deploy/env/compose.env.example" \
    > "$APP_ROOT/state/compose.env"
  chmod 0600 "$APP_ROOT/state/compose.env"
fi
ensure_compose_value() {
  local key=$1
  local value=$2
  if ! grep -q "^${key}=" "$APP_ROOT/state/compose.env"; then
    printf '%s=%s\n' "$key" "$value" >> "$APP_ROOT/state/compose.env"
  fi
}
ensure_compose_value POCKETBASE_IMAGE \
  "ghcr.io/kewonit/deetnuts-pocketbase@sha256:0000000000000000000000000000000000000000000000000000000000000000"
ensure_compose_value DEETNUTS_MIGRATION_MODE 0
ensure_compose_value POCKETBASE_MIGRATION_IMAGE \
  "ghcr.io/kewonit/deetnuts-pocketbase-migration@sha256:0000000000000000000000000000000000000000000000000000000000000000"
ensure_compose_value POCKETBASE_ENCRYPTION_KEY_FILE \
  "$APP_ROOT/shared/pocketbase/pocketbase_encryption_key"
ensure_compose_value POCKETBASE_SUPERUSER_EMAIL_FILE \
  "$APP_ROOT/shared/pocketbase/pocketbase_superuser_email"
ensure_compose_value POCKETBASE_SUPERUSER_PASSWORD_FILE \
  "$APP_ROOT/shared/pocketbase/pocketbase_superuser_password"
ensure_compose_value POCKETBASE_MIGRATION_KEY_FILE \
  "$APP_ROOT/shared/pocketbase/pocketbase_migration_key"
ensure_compose_value POCKETBASE_MIGRATION_ENV_FILE \
  "$APP_ROOT/shared/pocketbase-migration.env"
chown root:root "$APP_ROOT/state/compose.env"
chmod 0600 "$APP_ROOT/state/compose.env"
if [[ ! -f "$APP_ROOT/state/active-slot" ]]; then
  printf 'blue\n' > "$APP_ROOT/state/active-slot"
  chmod 0600 "$APP_ROOT/state/active-slot"
fi
active_slot=$(tr -d '[:space:]' < "$APP_ROOT/state/active-slot")
[[ "$active_slot" == blue || "$active_slot" == green ]] || {
  echo "The active deployment slot is invalid" >&2
  exit 1
}
temporary_upstream=$(mktemp "$APP_ROOT/deploy/nginx/conf.d/00-active-upstream.conf.XXXXXX")
trap 'rm -f "$temporary_upstream"' EXIT
printf 'upstream deetnuts_active {\n    zone deetnuts_active 64k;\n    server web-%s:3000 resolve;\n    keepalive 32;\n}\n' \
  "$active_slot" > "$temporary_upstream"
chown root:root "$temporary_upstream"
chmod 0644 "$temporary_upstream"
mv -f -- "$temporary_upstream" "$APP_ROOT/deploy/nginx/conf.d/00-active-upstream.conf"
trap - EXIT

install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0700 "/home/$DEPLOY_USER/.ssh"
if [[ -n "$DEPLOY_PUBLIC_KEY" ]]; then
  [[ "$DEPLOY_PUBLIC_KEY" == ssh-ed25519\ * && "$DEPLOY_PUBLIC_KEY" != *$'\n'* && "$DEPLOY_PUBLIC_KEY" != *$'\r'* ]] || {
    echo "DEETNUTS_DEPLOY_PUBLIC_KEY must be an Ed25519 public key" >&2
    exit 1
  }
  printf 'command="/usr/local/bin/deetnuts-command",no-agent-forwarding,no-port-forwarding,no-X11-forwarding,no-user-rc,no-pty %s\n' \
    "$DEPLOY_PUBLIC_KEY" \
    > "/home/$DEPLOY_USER/.ssh/authorized_keys"
  chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
  chmod 0600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
else
  echo "Deployment key was not installed; set DEETNUTS_DEPLOY_PUBLIC_KEY before production use" >&2
fi

printf '%s ALL=(root) NOPASSWD: /usr/local/sbin/deetnuts-deploy\n' "$DEPLOY_USER" \
  > "/etc/sudoers.d/$DEPLOY_USER"
chmod 0440 "/etc/sudoers.d/$DEPLOY_USER"
visudo --check --file "/etc/sudoers.d/$DEPLOY_USER"

systemctl daemon-reload
systemctl enable --now deetnuts-pocketbase-backup.timer
echo "Host files installed. Configure secrets, certificates, registry authentication, the DigitalOcean firewall, and monitoring before the first origin-only deployment."
