import { PALETTE } from "./balloons.js";

const BEST_KEY = "balloon-shooter-best";

export class Hud {
  constructor() {
    this.root = document.getElementById("hud");
    this.scoreEl = document.getElementById("score");
    this.timerEl = document.getElementById("timer");
    this.timerPanel = document.getElementById("timer-panel");
    this.popups = document.getElementById("popups");
    this.hitmarker = document.getElementById("hitmarker");
    this.legend = document.getElementById("legend");
    this.weaponRows = [...document.querySelectorAll(".weapon-row")];
    this.rankEntry = document.getElementById("rank-entry");
    this.rankName = document.getElementById("rank-name");
    this.rankSubmit = document.getElementById("rank-submit");
    this.rankNote = document.getElementById("rank-note");
    this.rankList = document.getElementById("rank-list");
    this.rankingOverlay = document.getElementById("ranking");
    this.rankingBody = document.getElementById("ranking-body");
    this.rankingNote = document.getElementById("ranking-note");
    this.menu = document.getElementById("menu");
    this.pause = document.getElementById("pause");
    this.over = document.getElementById("over");
    this.finalScore = document.getElementById("final-score");
    this.finalPops = document.getElementById("final-pops");
    this.finalBest = document.getElementById("final-best");
    this.finalJoke = document.getElementById("final-joke");
    this.bestHint = document.getElementById("best-hint");
    this.best = Number(localStorage.getItem(BEST_KEY) || 0);
    this.displayedScore = 0;
    this.hitTimer = 0;

    this.legend.innerHTML = PALETTE.map(
      (p) => `<div class="legend-row">
        <span class="legend-dot" style="background:${p.color}"></span>
        <span>${p.name}</span><b>${p.points}</b>
      </div>`
    ).join("");

    this.renderBest();
  }

  renderBest() {
    this.bestHint.textContent = this.best > 0 ? `Dein Bestwert: ${this.best} Punkte` : "";
  }

  setScore(value) {
    this.displayedScore = value;
    this.scoreEl.textContent = value.toLocaleString("de-DE");
    this.scoreEl.animate(
      [{ transform: "scale(1.18)" }, { transform: "scale(1)" }],
      { duration: 180, easing: "ease-out" }
    );
  }

  setName(value) {
    this.rankName.value = value;
  }

  readName() {
    return this.rankName.value.trim().slice(0, 14);
  }

  renderRanking(container, scores, highlight = null) {
    if (!container) return;
    if (!scores || scores.length === 0) {
      container.innerHTML = '<p class="rank-empty">Noch keine Einträge — spiel die erste Runde.</p>';
      return;
    }
    container.innerHTML = scores
      .map((entry, index) => {
        const mine =
          highlight &&
          entry.score === highlight.score &&
          entry.name.trim().toLowerCase() === highlight.name.trim().toLowerCase();
        return `<div class="rank-row${mine ? " mine" : ""}">
          <span class="rank-pos">${index + 1}</span>
          <span class="rank-name">${escapeHtml(entry.name)}</span>
          <span class="rank-score">${Number(entry.score).toLocaleString("de-DE")}</span>
        </div>`;
      })
      .join("");
  }

  setWeapon(manager) {
    this.weaponRows.forEach((row, i) => {
      const weapon = manager.weapons[i];
      const active = i === manager.index;
      row.classList.toggle("active", active);
      row.classList.toggle("empty", Number.isFinite(weapon.ammo) && weapon.ammo === 0);
      row.querySelector(".ammo").textContent = Number.isFinite(weapon.ammo)
        ? String(weapon.ammo)
        : "∞";
    });
  }

  setTime(seconds) {
    this.timerEl.textContent = Math.max(0, Math.ceil(seconds));
    this.timerPanel.classList.toggle("warn", seconds <= 15 && seconds > 5);
    this.timerPanel.classList.toggle("crit", seconds <= 5);
  }

  popup(text, color) {
    const el = document.createElement("div");
    el.className = "popup";
    el.textContent = text;
    el.style.color = color;
    el.style.marginLeft = `${(Math.random() - 0.5) * 60}px`;
    this.popups.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  hit() {
    this.hitmarker.classList.add("on");
    clearTimeout(this.hitTimer);
    this.hitTimer = setTimeout(() => this.hitmarker.classList.remove("on"), 110);
  }

  showGame() {
    this.root.classList.remove("hidden");
    this.menu.classList.add("hidden");
    this.pause.classList.add("hidden");
    this.over.classList.add("hidden");
  }

  showMenu() {
    this.root.classList.add("hidden");
    this.menu.classList.remove("hidden");
    this.pause.classList.add("hidden");
    this.over.classList.add("hidden");
    this.renderBest();
  }

  showPause() {
    this.pause.classList.remove("hidden");
  }

  hidePause() {
    this.pause.classList.add("hidden");
  }

  resetRanking() {
    this.rankEntry.classList.add("hidden");
    this.rankNote.textContent = "";
    this.rankList.innerHTML = "";
  }

  showEnd(score, pops) {
    const isBest = score > this.best;
    if (isBest) {
      this.best = score;
      localStorage.setItem(BEST_KEY, String(score));
    }
    this.finalScore.textContent = score.toLocaleString("de-DE");
    this.finalPops.textContent = pops;
    this.finalBest.textContent = this.best.toLocaleString("de-DE");
    this.finalJoke.textContent = jokeFor(score);
    this.resetRanking();
    this.root.classList.add("hidden");
    this.over.classList.remove("hidden");
    this.pause.classList.add("hidden");
    this.renderBest();
  }
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (character) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}

function jokeFor(score) {
  if (score === 0) return "Kein einziger Ballon. Die Luft ist noch sehr voll.";
  if (score < 1000) return "Solide Runde. Die roten Ballons haben dich durchgetragen.";
  if (score < 2500) return "Gutes Auge. Jetzt die kleinen, fetten Punkte jagen.";
  if (score < 5000) return "Stark — die Goldballons kennen dich schon.";
  return "Ballon-Legende. Die Hügel sind offiziell leer geschossen.";
}
