import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const port = Number(process.env.PORT || 4173);
const assets = new Map([
  ["/", ["index.html", "text/html"]],
  ["/index.html", ["index.html", "text/html"]],
  ["/style.css", ["style.css", "text/css"]],
  ["/app.mjs", ["app.mjs", "text/javascript"]],
  ["/engine.mjs", ["engine.mjs", "text/javascript"]],
]);
createServer(async (request, response) => {
  const item = assets.get(request.url.split("?")[0]);
  if (!item) return response.writeHead(404).end("Not found");
  try {
    const [file, type] = item;
    const body = await readFile(new URL(`../dist/${file}`, import.meta.url));
    response.writeHead(200, {
      "Content-Type": `${type}; charset=utf-8`,
      "X-Content-Type-Options": "nosniff",
    });
    response.end(body);
  } catch {
    response.writeHead(500).end("Asset unavailable");
  }
}).listen(port, "0.0.0.0", () =>
  console.log(`ScamLens is running at http://localhost:${port}`),
);
