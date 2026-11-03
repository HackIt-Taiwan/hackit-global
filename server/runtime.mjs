import http from "node:http";
import { lstat, readdir, readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { gzip, brotliCompress, constants } from "node:zlib";
import { LOCALES, validLocale, resolveLocale } from "./locale.mjs";
import { validateSiteConfig } from "./config.mjs";

const compressGzip = promisify(gzip),
  compressBrotli = promisify(brotliCompress);
const PUBLIC_FILES = new Set([
  "app.js",
  "entry.js",
  "i18n.js",
  "masonry.js",
  "style.css",
  "entry.css",
  "favicon.ico",
]);
const MIME = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
});
const MEDIA = new Set([
  ".svg",
  ".png",
  ".webp",
  ".jpg",
  ".jpeg",
  ".ico",
  ".gif",
  ".avif",
  ".woff",
  ".woff2",
]);
const MAX_FILE_BYTES = 16 * 1024 * 1024,
  MAX_TOTAL_BYTES = 128 * 1024 * 1024;
const hash = (bytes) => createHash("sha256").update(bytes).digest("base64");
const etag = (bytes) =>
  '"' + createHash("sha256").update(bytes).digest("hex") + '"';

function contentSecurityPolicy(html = "") {
  const scriptHashes = [
    ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi),
  ]
    .filter((match) => !/\bsrc\s*=/i.test(match[1]) && match[2].trim())
    .map((match) => "'sha256-" + hash(match[2]) + "'");
  // Explicitly scoped inline style permission preserves the approved CSSOM
  // animation and masonry writes. Scripts never receive unsafe-inline/eval.
  return [
    "default-src 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "script-src 'self' " + [...new Set(scriptHashes)].join(" "),
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'none'",
    "worker-src 'none'",
    "manifest-src 'none'",
  ].join("; ");
}

async function loadAssets(publicDir) {
  const root = resolve(publicDir);
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink())
    throw new Error("The public root must be a real directory.");
  const assets = new Map();
  let total = 0;
  async function add(relative) {
    const file = resolve(root, relative),
      stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw new Error("Public files must be regular files without symlinks.");
    if (stat.size > MAX_FILE_BYTES || total + stat.size > MAX_TOTAL_BYTES)
      throw new Error("The public asset size budget was exceeded.");
    const bytes = await readFile(file);
    total += bytes.length;
    const mime = MIME[extname(file)];
    const representations = new Map([
      ["identity", { bytes, etag: etag(bytes) }],
    ]);
    if (/^(?:text\/|image\/svg\+xml)/.test(mime) && bytes.length >= 256) {
      const gzipBytes = await compressGzip(bytes, { level: 6 });
      const brBytes = await compressBrotli(bytes, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
      });
      if (gzipBytes.length < bytes.length)
        representations.set("gzip", {
          bytes: gzipBytes,
          etag: etag(gzipBytes),
        });
      if (brBytes.length < bytes.length)
        representations.set("br", { bytes: brBytes, etag: etag(brBytes) });
    }
    const html = mime.startsWith("text/html") ? bytes.toString("utf8") : "";
    if (
      html &&
      /\son(?:load|error|click|change|submit|focus|blur|keydown|keyup)\s*=/i.test(
        html,
      )
    ) {
      throw new Error(
        "Inline event handlers must be externalized before starting the production server.",
      );
    }
    const fingerprint = relative.match(/\.([a-f0-9]{12})\.[^.]+$/)?.[1];
    const immutable =
      !!fingerprint &&
      createHash("sha256").update(bytes).digest("hex").startsWith(fingerprint);
    assets.set("/" + relative, {
      mime,
      representations,
      immutable,
      modified: new Date(Math.floor(stat.mtimeMs / 1000) * 1000),
      csp: contentSecurityPolicy(html),
    });
  }
  for (const file of await readdir(root)) {
    const original = file.replace(/\.[a-f0-9]{12}(?=\.[^.]+$)/, "");
    if (PUBLIC_FILES.has(original)) await add(file);
  }
  for (const locale of LOCALES) {
    const localeDir = await lstat(resolve(root, locale));
    if (!localeDir.isDirectory() || localeDir.isSymbolicLink())
      throw new Error("Locale directories cannot be symlinks.");
    await add(locale + "/index.html");
  }
  async function mediaDirectory(relative) {
    const directory = resolve(root, relative),
      stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error("Asset directories cannot be symlinks.");
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!/^[A-Za-z0-9][A-Za-z0-9_.()-]*$/.test(entry.name)) continue;
      const child = relative + "/" + entry.name;
      if (entry.isSymbolicLink())
        throw new Error("Asset symlinks are forbidden.");
      if (entry.isDirectory()) await mediaDirectory(child);
      else if (entry.isFile() && MEDIA.has(extname(entry.name)))
        await add(child);
    }
  }
  await mediaDirectory("assets");
  return assets;
}

function chooseEncoding(value, representations) {
  const accepted = new Map();
  for (const part of String(value || "").split(",")) {
    const [name, ...parameters] = part.trim().toLowerCase().split(";");
    if (!name) continue;
    const quality = parameters.find((parameter) => /^\s*q=/.test(parameter));
    const raw = quality?.trim().slice(2);
    const q =
      raw === undefined
        ? 1
        : /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(raw)
          ? Number(raw)
          : 0;
    accepted.set(name, q);
  }
  const wildcard = accepted.get("*");
  const quality = (name) =>
    accepted.get(name) ??
    (name === "identity" ? (wildcard === 0 ? 0 : 1) : (wildcard ?? 0));
  return (
    ["br", "gzip", "identity"]
      .filter((name) => representations.has(name) && quality(name) > 0)
      .sort((a, b) => quality(b) - quality(a))[0] ?? null
  );
}

function parseTarget(target) {
  if (typeof target !== "string" || target.length > 4096)
    return { status: 414 };
  if (
    !target.startsWith("/") ||
    target.startsWith("//") ||
    /[\x00-\x20\x7f\\#]/.test(target)
  )
    return { status: 400 };
  const rawPath = target.split("?")[0];
  let path;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    return { status: 400 };
  }
  if (
    /[\\%\x00-\x20\x7f]/.test(path) ||
    path.includes("//") ||
    /%2f|%5c/i.test(rawPath)
  )
    return { status: 400 };
  if (path.split("/").some((segment) => segment.startsWith(".")))
    return { status: 404 };
  if (!/^\/[A-Za-z0-9/_.()-]*$/.test(path)) return { status: 404 };
  const url = new URL(target, "http://request.invalid");
  return { path, search: url.search, parameters: url.searchParams };
}

function matchesETag(value, current) {
  return String(value)
    .split(",")
    .some(
      (candidate) =>
        candidate.trim() === "*" ||
        candidate.trim().replace(/^W\//, "") === current,
    );
}

export async function createSiteServer({ publicDir, site: inputSite }) {
  const site = validateSiteConfig(inputSite),
    assets = await loadAssets(publicDir);
  const defaultCsp = contentSecurityPolicy();
  const baseHeaders = {
    "Content-Security-Policy": defaultCsp,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-DNS-Prefetch-Control": "off",
    "Origin-Agent-Cluster": "?1",
    ...(site.indexing ? {} : { "X-Robots-Tag": "noindex, nofollow" }),
  };
  function send(req, res, status, body = "", headers = {}) {
    const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
    res.writeHead(status, {
      ...baseHeaders,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...(status !== 304 ? { "Content-Length": bytes.length } : {}),
      ...headers,
    });
    res.end(req.method === "HEAD" || status === 304 ? undefined : bytes);
  }
  const server = http.createServer(
    {
      maxHeaderSize: 8192,
      requireHostHeader: true,
      rejectNonStandardBodyWrites: true,
    },
    (req, res) => {
      try {
        if (!["GET", "HEAD"].includes(req.method))
          return send(req, res, 405, "Method not allowed\n", {
            Allow: "GET, HEAD",
            Connection: "close",
          });
        if (
          req.headers["transfer-encoding"] ||
          (req.headers["content-length"] &&
            req.headers["content-length"] !== "0")
        ) {
          return send(req, res, 413, "Request body not allowed\n", {
            Connection: "close",
          });
        }
        const target = parseTarget(req.url);
        if (target.status)
          return send(
            req,
            res,
            target.status,
            target.status === 404 ? "Not found\n" : "Invalid request target\n",
          );
        const { path, parameters } = target;
        if (path === "/healthz") return send(req, res, 200, "ok\n");
        // Coolify terminates TLS. No forwarded host/protocol/IP/country header is
        // trusted here; HTTPS redirection and HSTS belong at its verified edge.
        const host = String(req.headers.host || "").toLowerCase();
        if (
          site.visibility === "public" &&
          /^hackit\.global(?::\d+)?$/.test(host)
        ) {
          return send(req, res, 308, "", {
            Location: site.origin + path + target.search,
          });
        }
        if (path === "/api/locale")
          return send(req, res, 200, '{"country":null}', {
            "Content-Type": "application/json; charset=utf-8",
          });
        if (path === "/robots.txt") {
          const body = site.indexing
            ? "User-agent: *\nAllow: /\nSitemap: " +
              site.origin +
              "/sitemap.xml\n"
            : "User-agent: *\nDisallow: /\n";
          return send(req, res, 200, body);
        }
        if (path === "/sitemap.xml") {
          if (!site.indexing) return send(req, res, 404, "Not found\n");
          const body =
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
            LOCALES.map(
              (locale) =>
                "<url><loc>" + site.origin + "/" + locale + "/</loc></url>",
            ).join("") +
            "</urlset>\n";
          return send(req, res, 200, body, {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=300",
          });
        }
        const match = path.match(/^\/([^/]+)(?:\/|\/index\.html)?$/);
        const direct = match ? validLocale(match[1]) : null;
        if (path === "/" || path === "/index.html" || direct) {
          const query = validLocale(parameters.get("lang"));
          const locale = resolveLocale({
            query,
            path: direct,
            cookie: req.headers.cookie,
            acceptLanguage: req.headers["accept-language"],
          });
          const canonicalPath = "/" + locale + "/";
          if (path !== canonicalPath || query) {
            parameters.delete("lang");
            const search = parameters.toString();
            return send(req, res, query || !direct ? 302 : 308, "", {
              Location: canonicalPath + (search ? "?" + search : ""),
              Vary: "Cookie, Accept-Language",
            });
          }
        }
        const asset = assets.get(direct ? "/" + direct + "/index.html" : path);
        if (!asset) return send(req, res, 404, "Not found\n");
        const encoding = chooseEncoding(
          req.headers["accept-encoding"],
          asset.representations,
        );
        if (!encoding)
          return send(req, res, 406, "No acceptable encoding\n", {
            Vary: "Accept-Encoding",
          });
        const representation = asset.representations.get(encoding);
        const headers = {
          "Content-Type": asset.mime,
          ETag: representation.etag,
          "Last-Modified": asset.modified.toUTCString(),
          "Content-Security-Policy": asset.csp,
          Vary: "Accept-Encoding",
          "Cache-Control":
            site.visibility === "private"
              ? "private, max-age=0, must-revalidate"
              : asset.mime.startsWith("text/html")
                ? "public, max-age=0, must-revalidate"
                : asset.immutable
                  ? "public, max-age=31536000, immutable"
                  : "public, max-age=3600, must-revalidate",
          ...(encoding === "identity" ? {} : { "Content-Encoding": encoding }),
        };
        const noneMatch = req.headers["if-none-match"];
        const modifiedSince = req.headers["if-modified-since"];
        if (
          noneMatch !== undefined
            ? matchesETag(noneMatch, representation.etag)
            : modifiedSince &&
              Date.parse(modifiedSince) >= asset.modified.getTime()
        ) {
          return send(req, res, 304, "", headers);
        }
        return send(req, res, 200, representation.bytes, headers);
      } catch {
        if (!res.headersSent)
          send(req, res, 500, "Internal server error\n", {
            Connection: "close",
          });
        else res.destroy();
      }
    },
  );
  server.maxConnections = 512;
  server.maxHeadersCount = 64;
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.timeout = 15_000;
  server.maxRequestsPerSocket = 100;
  server.on("timeout", (socket) => socket.destroy());
  server.on("checkContinue", (req, res) =>
    send(req, res, 417, "Expectation not supported\n", { Connection: "close" }),
  );
  server.on("checkExpectation", (req, res) =>
    send(req, res, 417, "Expectation not supported\n", { Connection: "close" }),
  );
  server.on("upgrade", (_req, socket) =>
    socket.end(
      "HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
    ),
  );
  server.on("clientError", (error, socket) => {
    if (socket.writable)
      socket.end(
        "HTTP/1.1 " +
          (error.code === "HPE_HEADER_OVERFLOW"
            ? "431 Request Header Fields Too Large"
            : "400 Bad Request") +
          "\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
      );
  });
  return server;
}
