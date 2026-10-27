import { loadScores, submitScore, loadName, saveName } from "./leaderboard.js";

export function createRanking(hud, getRun) {
  let token = 0;
  let submitting = false;

  hud.setName(loadName());

  async function refreshAfterRound() {
    const run = getRun();
    const myToken = ++token;
    const result = await loadScores();
    if (myToken !== token || !getRun().active) return;
    hud.renderRanking(hud.rankList, result.scores);
    hud.rankEntry.classList.toggle("hidden", run.score <= 0);
    hud.rankNote.textContent = result.shared ? "" : "Offline — Rangliste nur auf diesem Gerät.";
  }

  async function submit() {
    const run = getRun();
    if (submitting || run.score <= 0) return;

    const name = hud.readName();
    if (!name) {
      hud.rankNote.textContent = "Bitte zuerst einen Namen eintragen.";
      hud.rankName.focus();
      return;
    }

    submitting = true;
    hud.rankSubmit.disabled = true;
    saveName(name);
    const result = await submitScore(name, run.score, run.pops);
    submitting = false;
    hud.rankSubmit.disabled = false;
    hud.rankEntry.classList.add("hidden");
    hud.renderRanking(hud.rankList, result.scores, { name, score: run.score });
    hud.rankNote.textContent = result.shared
      ? "Eingetragen."
      : "Eingetragen — nur lokal gespeichert (Server offline).";
  }

  async function openList() {
    hud.menu.classList.add("hidden");
    hud.rankingOverlay.classList.remove("hidden");
    hud.rankingNote.textContent = "";
    const result = await loadScores();
    hud.renderRanking(hud.rankingBody, result.scores);
    hud.rankingNote.textContent = result.shared
      ? ""
      : "Offline — Rangliste nur auf diesem Gerät.";
  }

  function closeList() {
    hud.rankingOverlay.classList.add("hidden");
    hud.showMenu();
  }

  document.getElementById("rank-submit").addEventListener("click", submit);
  hud.rankName.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopPropagation();
    submit();
  });
  document.getElementById("ranking-btn").addEventListener("click", openList);
  document.getElementById("ranking-close").addEventListener("click", closeList);

  return {
    refreshAfterRound,
    submit,
    openList,
    closeList,
    invalidate() {
      token += 1;
    },
  };
}
