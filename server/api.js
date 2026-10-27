const MAX_BODY = 2048;
const RATE_WINDOW = 60_000;
const RATE_MAX = 12;

export function createApi(store) {
  const hits = new Map();

  function rateLimited(ip) {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > RATE_MAX;
  }

  return async function handleApi(req, res) {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith("/api/scores")) return false;

    res.setHeader("Cache-Control", "no-store");

    if (req.method === "GET") {
      send(res, 200, { scores: await store.list(10), shared: true });
      return true;
    }

    if (req.method !== "POST") {
      send(res, 405, { error: "method not allowed" });
      return true;
    }

    const ip = req.socket.remoteAddress || "unknown";
    if (rateLimited(ip)) {
      send(res, 429, { error: "zu viele Einträge, kurz warten" });
      return true;
    }

    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      send(res, 400, { error: "ungültige Anfrage" });
      return true;
    }

    const name = String(body?.name ?? "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, 14);
    const score = Math.floor(Number(body?.score));
    const pops = Math.floor(Number(body?.pops) || 0);

    if (!name) {
      send(res, 400, { error: "Name fehlt" });
      return true;
    }
    if (!Number.isFinite(score) || score < 1 || score > 200000) {
      send(res, 400, { error: "ungültiger Punktestand" });
      return true;
    }
    if (!Number.isFinite(pops) || pops < 0 || pops > 999) {
      send(res, 400, { error: "ungültige Ballonzahl" });
      return true;
    }

    const scores = await store.add({
      name,
      score,
      pops,
      time: Date.now(),
    });
    send(res, 201, { scores, shared: true });
    return true;
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}
