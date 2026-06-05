import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const rootDir = process.env.STATIC_ROOT || "/usr/share/nginx/html";
const port = Number(process.env.PORT || 80);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolveFilePath(urlPath) {
  const normalizedPath = normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = join(rootDir, normalizedPath);

  if (existsSync(requestedPath) && statSync(requestedPath).isFile()) {
    return requestedPath;
  }

  return join(rootDir, "index.html");
}

createServer((req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const filePath = resolveFilePath(requestUrl.pathname);
  const extension = extname(filePath);

  res.statusCode = 200;
  res.setHeader("Content-Type", mimeTypes[extension] || "application/octet-stream");

  createReadStream(filePath).on("error", () => {
    res.statusCode = 500;
    res.end("Internal Server Error");
  }).pipe(res);
}).listen(port, "0.0.0.0", () => {
  console.log(`Static server listening on ${port}`);
});
