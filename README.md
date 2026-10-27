# Balloonplatzer3001

Ein Low-Poly-Egoshooter im Browser: Du stehst in einer hügeligen Wiese, zielst mit dem
Gewehr und lässt 60 Sekunden lang Ballons platzen. Jede Farbe zählt anders, und nach
jeder Runde trägst du deinen Namen in die Rangliste ein.

## Starten

```bash
npm install
npm run dev
```

Dann die angezeigte Adresse öffnen (standardmäßig http://localhost:5173) und
**Runde starten** klicken.

## Rangliste

Nach jeder Runde gibst du deinen Namen ein und landest in der Bestenliste (Top 10,
jederzeit über **Rangliste** im Startmenü abrufbar). Läuft der mitgelieferte Server,
gilt die Rangliste für alle im Netz und liegt in `data/scores.json`. Ohne Server
(z. B. nur der Vite-Dev-Server ohne Backend oder statisches Hosting) wird sie lokal
im Browser gespeichert — die App erkennt das automatisch.

## Installation auf Debian 13

Ein Befehl installiert Node.js, klont das Repo, baut die App und richtet einen
systemd-Dienst ein:

```bash
curl -fsSL https://raw.githubusercontent.com/Schello805/balloonshooter/main/install.sh | bash
```

Danach läuft das Spiel auf `http://<server-ip>:8080`.

Optionen per Umgebungsvariable:

```bash
PORT=9000 TARGET=/opt/balloon-shooter bash install.sh
```

Logs: `sudo journalctl -u balloon-shooter -f` · Stoppen: `sudo systemctl stop balloon-shooter`

## Update

```bash
curl -fsSL https://raw.githubusercontent.com/Schello805/balloonshooter/main/update.sh | bash
```

Holt den neuesten Stand, installiert Abhängigkeiten, baut neu und startet den
systemd-Dienst neu (inklusive Health-Check auf der konfigurierten Port).

Anderer Installationsordner oder Dienstname:

```bash
TARGET=/opt/balloon-shooter SERVICE=balloon-shooter bash update.sh
```

## Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver mit Hot Reload (Port 5173) |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm start` | Server mit Rangliste auf Port 8080 (Standard) |

## Steuerung

| Taste | Aktion |
| --- | --- |
| `WASD` | Laufen |
| Maus | Umsehen / zielen |
| Linke Maustaste | Schießen (halten = Dauerfeuer) |
| `1` / `2` / `Q` / Mausrad | Waffe wechseln |
| Rechte Maustaste | Zoomen |
| `Shift` | Sprinten |
| `Leertaste` | Springen |
| `Esc` | Pause |

## Waffen

| Waffe | Verhalten |
| --- | --- |
| Präzisionsgewehr | Einzelschuss, starker Rückstoß, unbegrenzt Munition |
| Schnellfeuergewehr | Dauerfeuer (ca. 16 Schuss/s), 30 Schuss pro Runde, danach automatisch zurück zur ersten Waffe |

## Punkte

| Farbe | Punkte | Besonderheit |
| --- | --- | --- |
| Rot | 100 | häufigster Ballon |
| Blau | 150 | |
| Grün | 200 | |
| Gelb | 300 | schneller |
| Lila | 500 | selten |
| Gold | 750 | schnellster, leuchtet |

Alle Ballons sind gleich groß — der Unterschied ist nur die Entfernung. Sie halten
immer mindestens 21 Meter Abstand zum Schützen, auch beim Abdriften.

## Aufbau

```
index.html            HUD, Menü-, Ranglisten- und Ergebnis-Overlays
install.sh            Ein-Befehl-Installation für Debian (systemd)
update.sh             Update per CLI: pull, build, Dienst neu starten
server.js             Produktionsserver: dist/ plus Ranglisten-API
server/api.js         GET/POST /api/scores mit Validierung und Rate-Limit
server/store.js       JSON-Datei für die Rangliste
vite.config.js        Dev-Server inklusive API-Middleware
src/main.js           Spielschleife, Runden-Logik, Schussabfrage
src/world.js          Himmel, Sonne, Licht und Aufbau der Welt
src/player.js         First-Person-Bewegung, Maus-Look, Sprung
src/balloons.js       Ballon-Feld, Platzierung, Treffer, Partikel
src/weapons.js        Waffenverwaltung, Wechsel, Munition, Hülsen
src/weapon-models.js  Beide Gewehrmodelle inklusive Hände
src/terrain.js        Höhenfunktion und Hügel-Mesh
src/scenery.js        Bäume, Büsche, Felsen
src/groundcover.js    Grasbüschel und Blumen
src/ambient.js        Bergketten, Wolken, Vögel
src/leaderboard.js    Rangliste laden/eintragen (Server oder lokal)
src/ranking.js        Ranglisten- und Namens-UI
src/hud.js            Anzeigen, Popups, Bestwert (localStorage)
src/audio.js          Prozedurale Sounds über WebAudio, keine Asset-Dateien
```

Der Bestwert wird lokal im Browser gespeichert. Es gibt keine externen Assets:
Terrain, Wolken, Bäume und Ballons werden vollständig im Code erzeugt.
