const API_URL = "/api/scores";
const LOCAL_KEY = "balloon-shooter-scores";
const NAME_KEY = "balloon-shooter-name";
const LIMIT = 10;

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(list) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* storage unavailable */
  }
}

export function sortScores(list) {
  return [...list].sort(
    (a, b) => b.score - a.score || (b.pops || 0) - (a.pops || 0) || (a.time || 0) - (b.time || 0)
  );
}

export function loadName() {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
}

export function saveName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* storage unavailable */
  }
}

async function request(path, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2200);
  try {
    const response = await fetch(path, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadScores() {
  try {
    const data = await request(API_URL);
    return { scores: sortScores(data.scores || []).slice(0, LIMIT), shared: Boolean(data.shared) };
  } catch {
    return { scores: sortScores(readLocal()).slice(0, LIMIT), shared: false };
  }
}

export async function submitScore(name, score, pops) {
  const entry = { name, score, pops, time: Date.now() };
  const local = sortScores([...readLocal(), entry]).slice(0, 50);
  writeLocal(local);

  try {
    const data = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score, pops }),
    });
    return { scores: sortScores(data.scores || []).slice(0, LIMIT), shared: Boolean(data.shared) };
  } catch {
    return { scores: local.slice(0, LIMIT), shared: false };
  }
}
