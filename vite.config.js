import { defineConfig } from "vite";
import path from "node:path";
import { createStore } from "./server/store.js";
import { createApi } from "./server/api.js";

export default defineConfig({
  plugins: [
    {
      name: "leaderboard-api",
      configureServer(server) {
        const store = createStore(path.resolve("data/scores-dev.json"));
        const api = createApi(store);
        server.middlewares.use(async (req, res, next) => {
          if (await api(req, res)) return;
          next();
        });
      },
    },
  ],
});
