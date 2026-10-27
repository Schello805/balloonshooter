#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-https://github.com/Schello805/balloonshooter.git}"
TARGET="${TARGET:-$HOME/balloon-shooter}"
PORT="${PORT:-8080}"
SERVICE="balloon-shooter"

log() { printf '\033[1;33m▸\033[0m %s\n' "$*"; }

need_apt() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Installiere $1"
    sudo apt-get update -y
    sudo apt-get install -y "$1"
  fi
}

need_apt git
need_apt curl

NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
fi

if [ "$NODE_MAJOR" -lt 20 ]; then
  log "Installiere Node.js 22 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if [ -d "$TARGET/.git" ]; then
  log "Aktualisiere $TARGET"
  git -C "$TARGET" pull --ff-only
else
  log "Klone Repository nach $TARGET"
  git clone --depth 1 "$REPO" "$TARGET"
fi

cd "$TARGET"

log "Installiere Abhängigkeiten"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

log "Baue die App"
npm run build

log "Richte systemd-Service ein"
sudo tee "/etc/systemd/system/$SERVICE.service" >/dev/null <<EOF
[Unit]
Description=Balloon Shooter
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$TARGET
Environment=PORT=$PORT
Environment=NODE_ENV=production
ExecStart=$(command -v node) server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE" >/dev/null
sudo systemctl restart "$SERVICE"

sleep 1
IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo
echo "Balloon Shooter läuft auf http://${IP:-localhost}:${PORT}"
echo "Logs:    sudo journalctl -u $SERVICE -f"
echo "Stoppen: sudo systemctl stop $SERVICE"
echo "Scores:  $TARGET/data/scores.json"
