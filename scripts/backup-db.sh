#!/usr/bin/env bash
# scripts/backup-db.sh
#
# Daily Postgres backup → Google Drive
#
# SETUP (run once on the server):
#   1. Install rclone:       curl https://rclone.org/install.sh | sudo bash
#   2. Configure GDrive:     rclone config   (name the remote "gdrive")
#   3. Install this script:  sudo cp scripts/backup-db.sh /usr/local/bin/backup-db
#                            sudo chmod +x /usr/local/bin/backup-db
#   4. Schedule daily at 2am: crontab -e
#      0 2 * * * /usr/local/bin/backup-db >> /var/log/motostore-backup-db.log 2>&1
#
# ENVIRONMENT (set in /etc/environment or prefix the cron command):
#   BACKUP_DB_URL     — Postgres connection string (same as DATABASE_URL)
#   GDRIVE_REMOTE     — rclone remote name (default: gdrive)
#   GDRIVE_FOLDER     — destination folder in Drive (default: motostore/db-backups)
#   KEEP_DAYS         — how many days of backups to keep locally (default: 7)

set -euo pipefail

# ── Config (override with env vars) ──────────────────────────────────────────
DB_URL="${BACKUP_DB_URL:-${DATABASE_URL:?Set BACKUP_DB_URL or DATABASE_URL}}"
GDRIVE_REMOTE="${GDRIVE_REMOTE:-gdrive}"
GDRIVE_FOLDER="${GDRIVE_FOLDER:-motostore/db-backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
LOCAL_DIR="/var/backups/motostore/db"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="motostore_db_${DATE}.sql.gz"

# ── Ensure local backup dir exists ───────────────────────────────────────────
mkdir -p "${LOCAL_DIR}"

echo "[$(date)] Starting DB backup → ${FILENAME}"

# ── Dump ─────────────────────────────────────────────────────────────────────
# pg_dump connects directly using the DATABASE_URL.
# We strip the schema to get host/port/dbname/user for pg_dump flags.
pg_dump "${DB_URL}" \
  --format=plain \
  --no-owner \
  --no-acl \
  | gzip > "${LOCAL_DIR}/${FILENAME}"

echo "[$(date)] Dump complete. Size: $(du -sh "${LOCAL_DIR}/${FILENAME}" | cut -f1)"

# ── Upload to Google Drive ────────────────────────────────────────────────────
rclone copy "${LOCAL_DIR}/${FILENAME}" "${GDRIVE_REMOTE}:${GDRIVE_FOLDER}" \
  --transfers=1 \
  --retries=3 \
  --log-level INFO

echo "[$(date)] Uploaded to ${GDRIVE_REMOTE}:${GDRIVE_FOLDER}/${FILENAME}"

# ── Prune old local backups ───────────────────────────────────────────────────
find "${LOCAL_DIR}" -name "motostore_db_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
echo "[$(date)] Pruned local backups older than ${KEEP_DAYS} days"

# ── Prune old Drive backups (keep 30 days on Drive) ──────────────────────────
rclone delete "${GDRIVE_REMOTE}:${GDRIVE_FOLDER}" \
  --min-age 30d \
  --include "motostore_db_*.sql.gz" \
  --log-level INFO

echo "[$(date)] DB backup finished successfully."
