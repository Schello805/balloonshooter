import { promises as fs } from "node:fs";
import path from "node:path";

const MAX_KEPT = 200;

function sortScores(list) {
  return list.sort((a, b) => b.score - a.score || b.pops - a.pops || a.time - b.time);
}

export function createStore(filePath) {
  let queue = Promise.resolve();

  async function readAll() {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async function list(limit = 10) {
    const all = sortScores(await readAll());
    return all.slice(0, limit);
  }

  async function add(entry) {
    queue = queue.then(async () => {
      const all = sortScores(await readAll());
      all.push(entry);
      const trimmed = all.slice(0, MAX_KEPT);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(trimmed, null, 2), "utf8");
    });
    await queue;
    return list(10);
  }

  return { list, add };
}
