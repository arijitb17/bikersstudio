#!/usr/bin/env bash
# scripts/backup-images.sh
#
# Weekly uploads/images backup → Terabox
#
# SETUP (run once on the server):
#   1. Install rclone:       curl https://rclone.org/install.sh | sudo bash
#   2. Configure Terabox:    rclone config
#      - Choose "WebDAV" as the storage type
#      - URL: https://d.terabox.com/dav  (or your Terabox WebDAV URL)
#      - Name the remote "terabox"
#   3. Install this script:  sudo cp scripts/backup-images.sh /usr/local/bin/backup-images
#                            sudo chmod +x /usr/local/bin/backup-images
#   4. Schedule weekly (Sunday 3am): crontab -e
#      0 3 * * 0 /usr/local/bin/backup-images >> /var/log/motostore-backup-images.log 2>&1
#
# ENVIRONMENT:
#   TERABOX_REMOTE    — rclone remote name (default: terabox)
#   TERABOX_FOLDER    — destination folder (default: motostore/images)
#   UPLOADS_DIR       — local path to uploads (default: /var/lib/docker/volumes/motostore_uploads_data/_data)

set -euo pipefail

TERABOX_REMOTE="${TERABOX_REMOTE:-terabox}"
TERABOX_FOLDER="${TERABOX_FOLDER:-motostore/images}"
# Docker named volume path — adjust if you changed the project name
UPLOADS_DIR="${UPLOADS_DIR:-/var/lib/docker/volumes/motostore-production_uploads_data/_data}"

echo "[$(date)] Starting image backup to ${TERABOX_REMOTE}:${TERABOX_FOLDER}"

if [ ! -d "${UPLOADS_DIR}" ]; then
  echo "[$(date)] ERROR: uploads directory not found at ${UPLOADS_DIR}"
  echo "  Hint: run 'docker volume inspect motostore-production_uploads_data' to find the real path."
  exit 1
fi

# Sync (only uploads new/changed files, deletes removed ones on the remote too)
rclone sync "${UPLOADS_DIR}" "${TERABOX_REMOTE}:${TERABOX_FOLDER}" \
  --transfers=4 \
  --retries=3 \
  --log-level INFO \
  --stats 30s

echo "[$(date)] Image backup finished. Remote: ${TERABOX_REMOTE}:${TERABOX_FOLDER}"
