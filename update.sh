#!/usr/bin/env bash
set -euo pipefail

TARGET="${TARGET:-$HOME/balloon-shooter}"
SERVICE="${SERVICE:-balloon-shooter}"

log() { printf '\033[1;33m▸\033[0m %s\n' "$*"; }
fail() {
  printf '\033[1;31m✖\033[0m %s\n' "$*" >&2
  exit 1
}

if [ ! -d "$TARGET/.git" ]; then
  fail "Kein Git-Repo in $TARGET. Erst installieren:
  curl -fsSL https://raw.githubusercontent.com/Schello805/balloonshooter/main/install.sh | bash"
fi

cd "$TARGET"

log "Hole Updates aus $(git remote get-url origin)"
BEFORE="$(git rev-parse --short HEAD)"
if ! git pull --ff-only; then
  fail "git pull fehlgeschlagen — gibt es lokale Änderungen? Prüfe 'git status' in $TARGET."
fi
AFTER="$(git rev-parse --short HEAD)"

if [ "$BEFORE" = "$AFTER" ]; then
  log "Bereits auf dem neuesten Stand ($AFTER)"
else
  log "Aktualisiert: $BEFORE → $AFTER"
fi

log "Installiere Abhängigkeiten"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

log "Baue die App"
npm run build

SUDO=""
if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi

if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "$SERVICE.service" >/dev/null 2>&1; then
  log "Starte $SERVICE neu"
  $SUDO systemctl restart "$SERVICE"
  sleep 1

  if ! systemctl is-active --quiet "$SERVICE"; then
    fail "Dienst läuft nicht. Logs: sudo journalctl -u $SERVICE -n 80"
  fi

  PORT="${PORT:-$(systemctl show -p Environment "$SERVICE" 2>/dev/null | sed -n 's/.*PORT=\([0-9]\+\).*/\1/p')}"
  PORT="${PORT:-8080}"

  if curl -fsS -o /dev/null --max-time 4 "http://127.0.0.1:$PORT/"; then
    echo
    echo "Update fertig — HTTP OK auf Port $PORT (Commit $AFTER)"
  else
    fail "Dienst läuft, antwortet aber nicht auf Port $PORT. Logs: sudo journalctl -u $SERVICE -n 80"
  fi
else
  echo
  echo "Update fertig (Commit $AFTER)."
  echo "Kein systemd-Dienst '$SERVICE' gefunden — manuell starten mit: npm start"
fi
