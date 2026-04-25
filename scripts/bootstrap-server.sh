#!/usr/bin/env bash
# scripts/bootstrap-server.sh
#
# Run ONCE on a fresh Ubuntu 22.04 / 24.04 EC2 instance to prepare it for
# production deployments.
#
# Usage:
#   chmod +x bootstrap-server.sh
#   sudo ./bootstrap-server.sh
#
# After this script finishes:
#   1. Log out and back in (docker group takes effect)
#   2. Run: rclone config   to set up gdrive and terabox remotes
#   3. Set BACKUP_DB_URL in /etc/environment
#   4. Add cron jobs (see backup scripts for the exact lines)

set -euo pipefail

echo "==> Updating system packages"
apt-get update -qq
apt-get upgrade -y -qq

echo "==> Installing dependencies"
apt-get install -y -qq \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  postgresql-client \
  unzip \
  htop \
  ufw

echo "==> Installing Docker"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable docker
systemctl start docker

# Add the deploy user to the docker group (avoids sudo for docker commands)
DEPLOY_USER="${SUDO_USER:-ubuntu}"
usermod -aG docker "${DEPLOY_USER}"
echo "==> Added ${DEPLOY_USER} to docker group"

echo "==> Installing rclone"
curl -fsSL https://rclone.org/install.sh | bash

echo "==> Configuring UFW firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "==> UFW enabled: SSH + 80 + 443 open"

echo "==> Creating app directories"
mkdir -p /home/${DEPLOY_USER}/motostore-production/nginx/ssl
mkdir -p /home/${DEPLOY_USER}/motostore-staging/nginx/ssl
mkdir -p /var/backups/motostore/db
mkdir -p /var/log
chown -R ${DEPLOY_USER}:${DEPLOY_USER} /home/${DEPLOY_USER}/motostore-production
chown -R ${DEPLOY_USER}:${DEPLOY_USER} /home/${DEPLOY_USER}/motostore-staging
chown -R ${DEPLOY_USER}:${DEPLOY_USER} /var/backups/motostore

echo "==> Installing backup scripts"
cp "$(dirname "$0")/backup-db.sh"     /usr/local/bin/backup-db
cp "$(dirname "$0")/backup-images.sh" /usr/local/bin/backup-images
chmod +x /usr/local/bin/backup-db /usr/local/bin/backup-images

echo ""
echo "=========================================================="
echo " Bootstrap complete. Next steps:"
echo ""
echo "  1. Log out and back in so docker group takes effect."
echo "  2. Place your nginx SSL certs in:"
echo "       ~/motostore-production/nginx/ssl/fullchain.pem"
echo "       ~/motostore-production/nginx/ssl/privkey.pem"
echo "     (Use certbot: sudo apt install certbot && certbot certonly)"
echo "  3. Place nginx.conf in:"
echo "       ~/motostore-production/nginx/nginx.conf"
echo "  4. Configure rclone remotes:"
echo "       rclone config   # add 'gdrive' and 'terabox'"
echo "  5. Set backup env var:"
echo "       echo 'BACKUP_DB_URL=postgresql://...' >> /etc/environment"
echo "  6. Add cron jobs (as ${DEPLOY_USER}, not root):"
echo "       crontab -e"
echo "       0 2 * * *   /usr/local/bin/backup-db >> /var/log/motostore-backup-db.log 2>&1"
echo "       0 3 * * 0   /usr/local/bin/backup-images >> /var/log/motostore-backup-images.log 2>&1"
echo "=========================================================="
