import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStore } from "./server/store.js";
import { createApi } from "./server/api.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const port = Number(process.env.PORT || 8080);
const dataFile = process.env.DATA_FILE || path.join(root, "data", "scores.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const api = createApi(createStore(dataFile));

const server = http.createServer(async (req, res) => {
  try {
    if (await api(req, res)) return;
    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Interner Fehler");
    }
  }
});

async function sendFile(res, filePath, body) {
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
  res.setHeader("Cache-Control", path.basename(filePath) === "index.html" ? "no-cache" : "public, max-age=31536000, immutable");
  res.setHeader("Content-Length", body.length);
  res.end(body);
}

async function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";

  const target = path.join(dist, pathname);
  if (target !== dist && !target.startsWith(dist + path.sep)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  try {
    const body = await fs.readFile(target);
    await sendFile(res, target, body);
  } catch {
    try {
      const html = await fs.readFile(path.join(dist, "index.html"));
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Content-Length", html.length);
      res.end(html);
    } catch {
      res.statusCode = 500;
      res.end("dist/ fehlt - bitte zuerst `npm run build` ausfuehren.");
    }
  }
}

server.listen(port, () => {
  console.log(`Balloon Shooter laeuft auf http://0.0.0.0:${port}`);
  console.log(`Rangliste: ${dataFile}`);
});
