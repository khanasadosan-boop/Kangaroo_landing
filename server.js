// Статический сервер без зависимостей для Railway (порт берётся из $PORT).
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "public");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};
const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".svg", ".txt", ".xml", ".webmanifest"]);

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return send(res, 400, "Bad Request");
  }

  if (pathname === "/healthz") {
    return send(res, 200, "ok", { "Content-Type": "text/plain" });
  }

  // Короткие ссылки на языковые версии: /uz и /ru
  if (pathname === "/uz" || pathname === "/ru") {
    const qs = new URL(req.url, "http://localhost").searchParams;
    qs.set("lang", pathname.slice(1));
    return send(res, 302, "", { Location: "/?" + qs.toString() });
  }

  if (pathname.endsWith("/")) pathname += "index.html";
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT + path.sep)) return send(res, 403, "Forbidden");

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, fs.readFileSync(path.join(ROOT, "404.html")), {
        "Content-Type": TYPES[".html"],
      });
    }
    const ext = path.extname(file).toLowerCase();
    const type = TYPES[ext] || "application/octet-stream";
    // HTML и config.js не кэшируем надолго, чтобы правки цен/ссылок применялись сразу
    const noLongCache = ext === ".html" || path.basename(file) === "config.js";
    const headers = {
      "Content-Type": type,
      "Cache-Control": noLongCache ? "no-cache" : "public, max-age=604800",
      "Last-Modified": stat.mtime.toUTCString(),
    };

    if (req.headers["if-modified-since"] && new Date(req.headers["if-modified-since"]) >= new Date(stat.mtime.toUTCString())) {
      return send(res, 304, "", headers);
    }

    const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    if (gzip) {
      headers["Content-Encoding"] = "gzip";
      headers["Vary"] = "Accept-Encoding";
    } else {
      headers["Content-Length"] = stat.size;
    }
    res.writeHead(200, { ...SECURITY_HEADERS, ...headers });
    if (req.method === "HEAD") return res.end();
    const stream = fs.createReadStream(file);
    stream.on("error", () => res.destroy());
    (gzip ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
  });
});

server.listen(PORT, () => console.log(`Kangaroo landing on http://localhost:${PORT}`));
