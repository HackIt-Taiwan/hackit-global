import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
  symlink,
  access,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { gunzipSync, brotliDecompressSync } from "node:zlib";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { createSiteServer } from "../server/runtime.mjs";
import { validateSiteConfig, loadConfiguration } from "../server/config.mjs";
import {
  browserLocale,
  savedLocale,
  resolveLocale,
} from "../server/locale.mjs";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = await mkdtemp(resolve(tmpdir(), "hackit-server-"));
const site = {
  origin: "https://www.hackit.global",
  visibility: "public",
  indexing: true,
};
const servers = new Set();
let assertions = 0;
function equal(actual, expected, label) {
  assertions++;
  assert.deepEqual(actual, expected, label);
}
function ok(value, label) {
  assertions++;
  assert.ok(value, label);
}
async function listen(options) {
  const server = await createSiteServer(options);
  servers.add(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server;
}
function request(
  serverOrPort,
  path = "/",
  { method = "GET", headers = {}, body } = {},
) {
  const port =
    typeof serverOrPort === "number"
      ? serverOrPort
      : serverOrPort.address().port;
  return new Promise((resolveRequest, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method, headers, agent: false },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolveRequest({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          }),
        );
        res.on("error", reject);
      },
    );
    req.setTimeout(3000, () => req.destroy(new Error("Test HTTP timeout")));
    req.on("error", reject);
    req.end(body);
  });
}
async function raw(server, data) {
  return new Promise((resolveRaw, reject) => {
    const socket = net.connect(server.address().port, "127.0.0.1", () =>
      socket.end(data),
    );
    let output = "";
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      output += chunk;
    });
    socket.setTimeout(3000, () =>
      socket.destroy(new Error("Raw HTTP timeout")),
    );
    socket.on("end", () => resolveRaw(output));
    socket.on("error", reject);
  });
}

try {
  await mkdir(resolve(fixture, "assets"));
  const inline = 'document.documentElement.dataset.test="ready";';
  for (const locale of ["zh-TW", "zh-HK", "zh-CN", "en"]) {
    await mkdir(resolve(fixture, locale));
    await writeFile(
      resolve(fixture, locale, "index.html"),
      '<!doctype html><html lang="' +
        locale +
        '"><head>' +
        '<base href="/"><link rel="canonical" href="' +
        site.origin +
        "/" +
        locale +
        '/"><meta name="robots" content="index,follow">' +
        "<style>body{background:#fff}</style><script>" +
        inline +
        "</script></head><body>" +
        locale.repeat(500) +
        "</body></html>",
    );
  }
  const script = Buffer.from(
    "/* Existing animation script fixture. */\n".repeat(1000),
  );
  const fingerprint = createHash("sha256")
    .update(script)
    .digest("hex")
    .slice(0, 12);
  await writeFile(resolve(fixture, "app.js"), script);
  await writeFile(resolve(fixture, "app." + fingerprint + ".js"), script);
  await writeFile(resolve(fixture, "entry.css"), "html{background:#fff}");
  await writeFile(
    resolve(fixture, "foreign.js"),
    "This unapproved root file must never be served.",
  );
  await writeFile(resolve(fixture, ".env"), "PRIVATE_FIXTURE_MARKER");
  await writeFile(
    resolve(fixture, "site-config.json"),
    "PRIVATE_FIXTURE_MARKER",
  );
  await writeFile(
    resolve(fixture, "assets/photo.webp"),
    Buffer.from([0x52, 0x49, 0x46, 0x46]),
  );
  await writeFile(
    resolve(fixture, "assets/notes.json"),
    "PRIVATE_FIXTURE_MARKER",
  );
  await writeFile(
    resolve(fixture, "assets/.hidden.png"),
    "PRIVATE_FIXTURE_MARKER",
  );
  const server = await listen({ publicDir: fixture, site });
  equal(server.requestTimeout, 10_000);
  equal(server.headersTimeout, 10_000);
  equal(server.maxConnections, 512);

  for (const [headers, path, expected] of [
    [{}, "/", "/zh-TW/"],
    [{ "Accept-Language": "en-US,en;q=0.9" }, "/", "/en/"],
    [{ "Accept-Language": "zh-HK;q=0.3,en;q=0.9" }, "/", "/en/"],
    [{ "Accept-Language": "zh-Hant-HK,zh;q=0.8" }, "/", "/zh-HK/"],
    [{ "Accept-Language": "zh-Hant;q=0.8,en;q=0" }, "/", "/zh-TW/"],
    [{ "Accept-Language": "zh-Hans-CN" }, "/", "/zh-CN/"],
    [
      { Cookie: "hackit-locale=zh-HK", "Accept-Language": "en" },
      "/",
      "/zh-HK/",
    ],
    [
      { Cookie: "hackit-locale=zh-CN", "Accept-Language": "en" },
      "/?lang=zh-TW&ref=fixture",
      "/zh-TW/?ref=fixture",
    ],
    [{ Cookie: "hackit-locale=zh-HK" }, "/en/?lang=zh-CN", "/zh-CN/"],
    [
      { Cookie: "hackit-locale=%E0%A4%A", "Accept-Language": "en" },
      "/",
      "/en/",
    ],
    [
      {
        Cookie: "hackit-locale=zh-HK; hackit-locale=en",
        "Accept-Language": "zh-CN",
      },
      "/",
      "/zh-CN/",
    ],
    [
      {
        "CF-IPCountry": "HK",
        "X-Country-Code": "HK",
        "X-Forwarded-For": "1.2.3.4",
      },
      "/",
      "/zh-TW/",
    ],
    [
      {
        Host: "attacker.invalid",
        "X-Forwarded-Host": "attacker.invalid",
        "X-Forwarded-Proto": "https",
      },
      "/?lang=en",
      "/en/",
    ],
  ]) {
    const response = await request(server, path, { headers });
    equal(response.status, 302, path);
    equal(response.headers.location, expected, path);
    equal(response.headers["cache-control"], "no-store");
    equal(response.headers.vary, "Cookie, Accept-Language");
  }
  for (const path of ["/EN", "/en", "/en/index.html", "/en/"]) {
    const response = await request(server, path, {
      headers: { Cookie: "hackit-locale=zh-HK" },
    });
    equal(response.status, path === "/en/" ? 200 : 308, path);
    if (response.status === 200)
      ok(response.body.includes('lang="en"'), "Explicit route wins cookie");
    else equal(response.headers.location, "/en/");
  }
  const apex = await request(server, "/en/?ref=x", {
    headers: { Host: "hackit.global" },
  });
  equal(apex.status, 308);
  equal(apex.headers.location, "https://www.hackit.global/en/?ref=x");
  equal(apex.headers["strict-transport-security"], "max-age=86400");
  const localeApi = await request(server, "/api/locale", {
    headers: { "CF-IPCountry": "TW", "X-Geo-Country": "CN" },
  });
  equal(localeApi.body.toString(), '{"country":null}');
  equal(localeApi.headers["cache-control"], "no-store");
  equal((await request(server, "/healthz")).body.toString(), "ok\n");
  equal(
    (await request(server, "/healthz", { headers: { Host: "hackit.global" } }))
      .status,
    200,
    "Health bypasses hostname redirect",
  );

  for (const path of [
    "/.env",
    "/.git/config",
    "/source/site-config.json",
    "/server/index.mjs",
    "/package.json",
    "/site-config.json",
    "/assets/notes.json",
    "/assets/.hidden.png",
    "/foreign.js",
    "/assets/",
    "/missing",
    "/toString",
    "/constructor",
    "/__proto__",
    "/assets/../app.js",
    "/%2eenv",
    "/%2e%2e/app.js",
    "/en/../../.env",
    "/en/.hidden",
    "/assets/photo.webp/extra",
  ]) {
    const response = await request(server, path);
    equal(response.status, 404, path);
    ok(!response.body.includes("PRIVATE_FIXTURE_MARKER"), path);
  }
  for (const path of [
    "/%",
    "/%C0%AF",
    "/%00",
    "/%2f.env",
    "/%5c.env",
    "/%252e%252e/app.js",
    "//attacker.invalid/en/",
    "/assets//photo.webp",
    "/a\\b",
    "http://attacker.invalid/en/",
  ]) {
    equal((await request(server, path)).status, 400, path);
  }
  equal((await request(server, "/" + "a".repeat(5000))).status, 414);
  const oversizedHeaders = await request(server, "/", {
    headers: { "X-Large": "a".repeat(9000) },
  });
  equal(oversizedHeaders.status, 431);
  equal(oversizedHeaders.headers["strict-transport-security"], "max-age=86400");
  const post = await request(server, "/", { method: "POST" });
  equal(post.status, 405);
  equal(post.headers.allow, "GET, HEAD");
  equal(
    (
      await request(server, "/en/", {
        headers: { "Content-Length": "1" },
        body: "x",
      })
    ).status,
    413,
  );
  equal(
    (await request(server, "/en/", { headers: { Expect: "100-continue" } }))
      .status,
    417,
  );
  ok(
    (
      await raw(server, "GET / HTTP/1.1\r\nConnection: close\r\n\r\n")
    ).startsWith("HTTP/1.1 400"),
  );
  const upgrade = await raw(
    server,
    "GET /en/ HTTP/1.1\r\nHost: www.hackit.global\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n",
  );
  ok(upgrade.startsWith("HTTP/1.1 400"));
  ok(upgrade.includes("Strict-Transport-Security: max-age=86400\r\n"));

  const identity = await request(server, "/app.js");
  equal(identity.status, 200);
  equal(identity.body, script);
  equal(identity.headers["content-type"], "text/javascript; charset=utf-8");
  equal(
    identity.headers["cache-control"],
    "public, max-age=3600, must-revalidate",
  );
  equal(identity.headers["content-encoding"], undefined);
  const immutable = await request(server, "/app." + fingerprint + ".js");
  equal(immutable.status, 200);
  equal(
    immutable.headers["cache-control"],
    "public, max-age=31536000, immutable",
  );
  equal(
    (await request(server, "/entry.css")).headers["content-type"],
    "text/css; charset=utf-8",
  );
  equal(
    (await request(server, "/assets/photo.webp")).headers["content-type"],
    "image/webp",
  );
  for (const encoding of ["gzip", "br"]) {
    const response = await request(server, "/app.js", {
      headers: { "Accept-Encoding": encoding },
    });
    equal(response.headers["content-encoding"], encoding);
    equal(response.headers.vary, "Accept-Encoding");
    ok(response.body.length < script.length / 5);
    equal(
      encoding === "gzip"
        ? gunzipSync(response.body)
        : brotliDecompressSync(response.body),
      script,
    );
    ok(
      response.headers.etag !== identity.headers.etag,
      "Strong validators differ per encoded representation",
    );
    const head = await request(server, "/app.js", {
      method: "HEAD",
      headers: { "Accept-Encoding": encoding },
    });
    equal(head.status, 200);
    equal(head.body.length, 0);
    equal(head.headers["content-length"], String(response.body.length));
    equal(head.headers.etag, response.headers.etag);
    const cached = await request(server, "/app.js", {
      headers: {
        "Accept-Encoding": encoding,
        "If-None-Match": '"other", W/' + response.headers.etag,
      },
    });
    equal(cached.status, 304);
    equal(cached.body.length, 0);
    equal(cached.headers["content-length"], undefined);
  }
  equal(
    (
      await request(server, "/app.js", {
        headers: { "Accept-Encoding": "br;q=0, gzip;q=1" },
      })
    ).headers["content-encoding"],
    "gzip",
  );
  equal(
    (
      await request(server, "/app.js", {
        headers: { "Accept-Encoding": "br;q=0.5" },
      })
    ).headers["content-encoding"],
    undefined,
  );
  equal(
    (
      await request(server, "/app.js", {
        headers: { "Accept-Encoding": "*;q=0" },
      })
    ).status,
    406,
  );
  equal(
    (await request(server, "/app.js", { headers: { "If-None-Match": "*" } }))
      .status,
    304,
  );
  equal(
    (
      await request(server, "/app.js", {
        headers: { "If-Modified-Since": identity.headers["last-modified"] },
      })
    ).status,
    304,
  );
  equal(
    (
      await request(server, "/app.js", {
        headers: {
          "If-None-Match": '"other"',
          "If-Modified-Since": "Wed, 01 Jan 2098 00:00:00 GMT",
        },
      })
    ).status,
    200,
  );
  equal(
    (await request(server, "/app.js", { headers: { Range: "bytes=0-5" } }))
      .body,
    script,
  );

  const document = await request(server, "/en/");
  equal(
    document.headers["cache-control"],
    "public, max-age=0, must-revalidate, no-transform",
  );
  equal(document.headers["strict-transport-security"], "max-age=86400");
  for (const encoding of ["identity", "gzip", "br"]) {
    const headers = { "Accept-Encoding": encoding };
    const html = await request(server, "/en/", { headers });
    equal(html.headers["cache-control"], document.headers["cache-control"]);
    equal(html.headers["strict-transport-security"], "max-age=86400");
    const decoded =
      encoding === "gzip"
        ? gunzipSync(html.body)
        : encoding === "br"
          ? brotliDecompressSync(html.body)
          : html.body;
    equal(decoded, document.body, "HTML bytes survive compression unchanged");
    const cached = await request(server, "/en/", {
      headers: { ...headers, "If-None-Match": html.headers.etag },
    });
    equal(cached.status, 304);
    equal(cached.headers["cache-control"], document.headers["cache-control"]);
    equal(cached.headers["strict-transport-security"], "max-age=86400");
  }
  equal(
    (
      await request(server, "/en/", {
        headers: { "X-Forwarded-Proto": "http", Forwarded: "proto=http" },
      })
    ).headers["strict-transport-security"],
    "max-age=86400",
    "Public HSTS does not depend on untrusted forwarding headers",
  );
  equal(document.headers["x-robots-tag"], undefined);
  const csp = document.headers["content-security-policy"];
  const scriptDirective = csp
    .split(";")
    .find((value) => value.trim().startsWith("script-src "));
  ok(
    scriptDirective.includes(
      "'sha256-" + createHash("sha256").update(inline).digest("base64") + "'",
    ),
  );
  ok(!scriptDirective.includes("unsafe-inline"));
  ok(!scriptDirective.includes("unsafe-eval"));
  for (const directive of [
    "default-src 'none'",
    "base-uri 'self'",
    "script-src-attr 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "worker-src 'none'",
    "style-src 'self' 'unsafe-inline'",
  ])
    ok(csp.includes(directive), directive);
  equal(document.headers["x-frame-options"], "DENY");
  equal(document.headers["x-content-type-options"], "nosniff");
  equal(document.headers["referrer-policy"], "strict-origin-when-cross-origin");
  equal(document.headers["cross-origin-opener-policy"], "same-origin");
  equal(document.headers["cross-origin-resource-policy"], "same-origin");
  ok(document.headers["permissions-policy"].includes("geolocation=()"));
  equal(document.headers["x-powered-by"], undefined);
  for (const path of [
    "/en/",
    "/healthz",
    "/api/locale",
    "/robots.txt",
    "/missing",
    "/?lang=en",
  ]) {
    const head = await request(server, path, { method: "HEAD" });
    equal(head.body.length, 0, path);
    equal(head.headers["strict-transport-security"], "max-age=86400", path);
    if (path === "/en/")
      equal(head.headers["cache-control"], document.headers["cache-control"]);
    equal(
      (await request(server, path)).headers["strict-transport-security"],
      "max-age=86400",
      path,
    );
  }
  equal(post.headers["strict-transport-security"], "max-age=86400");
  ok(
    (await request(server, "/robots.txt")).body.includes(
      "Sitemap: https://www.hackit.global/sitemap.xml",
    ),
  );
  const sitemap = await request(server, "/sitemap.xml");
  equal(sitemap.status, 200);
  equal(sitemap.headers["content-type"], "application/xml; charset=utf-8");
  equal((sitemap.body.toString().match(/<loc>/g) || []).length, 4);
  const privateServer = await listen({
    publicDir: fixture,
    site: {
      origin: "https://example.invalid",
      visibility: "private",
      indexing: false,
    },
  });
  equal(
    (await request(privateServer, "/en/")).headers["x-robots-tag"],
    "noindex, nofollow",
  );
  equal(
    (await request(privateServer, "/app.js")).headers["cache-control"],
    "private, max-age=0, must-revalidate",
  );
  const privateHtml = await request(privateServer, "/en/", {
    headers: { "X-Forwarded-Proto": "https", Forwarded: "proto=https" },
  });
  equal(
    privateHtml.headers["cache-control"],
    "private, max-age=0, must-revalidate, no-transform",
  );
  for (const path of ["/en/", "/app.js", "/missing", "/?lang=en", "/healthz"]) {
    equal(
      (
        await request(privateServer, path, {
          headers: { "X-Forwarded-Proto": "https" },
        })
      ).headers["strict-transport-security"],
      undefined,
      "Private builds omit HSTS even with spoofed HTTPS headers: " + path,
    );
  }
  equal(
    (await request(privateServer, "/robots.txt")).body.toString(),
    "User-agent: *\nDisallow: /\n",
  );
  equal((await request(privateServer, "/sitemap.xml")).status, 404);
  const privateOversizedHeaders = await request(privateServer, "/", {
    headers: { "X-Large": "a".repeat(9000) },
  });
  equal(privateOversizedHeaders.status, 431);
  equal(
    privateOversizedHeaders.headers["strict-transport-security"],
    undefined,
  );

  equal(savedLocale("hackit-locale=ZH-hk"), "zh-HK");
  equal(browserLocale("en;q=no,zh-CN;q=0.8"), "zh-CN");
  equal(
    resolveLocale({
      query: "zh-CN",
      path: "en",
      cookie: "hackit-locale=zh-HK",
      acceptLanguage: "zh-TW",
    }),
    "zh-CN",
  );
  assert.throws(() =>
    validateSiteConfig({ ...site, origin: "https://hackit.global" }),
  );
  assertions++;
  assert.throws(() =>
    validateSiteConfig({ ...site, origin: "https://www.hackit.global/path" }),
  );
  assertions++;
  assert.throws(() => validateSiteConfig({ ...site, visibility: "private" }));
  assertions++;
  assert.throws(() =>
    validateSiteConfig({ ...site, origin: "javascript:alert(1)" }),
  );
  assertions++;
  await symlink(resolve(fixture, ".env"), resolve(fixture, "assets/link.png"));
  await assert.rejects(
    createSiteServer({ publicDir: fixture, site }),
    /symlink/i,
  );
  assertions++;
  await rm(resolve(fixture, "assets/link.png"));
  await writeFile(
    resolve(fixture, "en/index.html"),
    '<html><script onload="alert(1)"></script></html>',
  );
  await assert.rejects(
    createSiteServer({ publicDir: fixture, site }),
    /Inline event handlers/,
  );
  assertions++;

  // Exercise the actual generated production tree as well as isolated attack
  // fixtures. npm run build must have completed before this regression command.
  await access(resolve(project, "dist/public/en/index.html"));
  const configuration = await loadConfiguration({
    PORT: "3000",
    HOST: "127.0.0.1",
  });
  equal(configuration.publicDir, resolve(project, "dist/public"));
  const actual = await listen(configuration);
  const actualRoot = configuration.publicDir;
  for (const locale of ["zh-TW", "zh-HK", "zh-CN", "en"]) {
    const response = await request(actual, "/" + locale + "/");
    equal(response.status, 200);
    ok(response.body.includes('lang="' + locale + '"'));
    ok(response.body.includes("https://www.hackit.global/" + locale + "/"));
    equal(response.headers["x-robots-tag"], undefined);
    equal(
      response.headers["cache-control"],
      "public, max-age=0, must-revalidate, no-transform",
    );
    equal(response.headers["strict-transport-security"], "max-age=86400");
    ok(response.body.includes('href="mailto:hello@hackit.one"'));
    ok(!response.body.includes("/cdn-cgi/l/email-protection"));
  }
  const actualHtml = (await request(actual, "/en/")).body.toString();
  for (const match of actualHtml.matchAll(
    /(?:src|href)="\/?([^"?#]+\.(?:js|css|webp|png|svg))"/g,
  ))
    equal((await request(actual, "/" + match[1])).status, 200, match[1]);
  for (const filename of await readdir(resolve(actualRoot, "assets"))) {
    if (/\.(?:webp|png|svg)$/.test(filename))
      equal(
        (await request(actual, "/assets/" + filename)).status,
        200,
        filename,
      );
  }
  // Verify actual CLI startup and SIGTERM, including a URL/cookie marker that
  // must never appear in process logs.
  const portProbe = net.createServer();
  portProbe.listen(0, "127.0.0.1");
  await once(portProbe, "listening");
  const cliPort = portProbe.address().port;
  await new Promise((resolveClose) => portProbe.close(resolveClose));
  const child = spawn(
    process.execPath,
    ["--disable-proto=throw", "server/index.mjs"],
    {
      cwd: project,
      env: { ...process.env, PORT: String(cliPort), HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let logs = "";
  child.stdout.on("data", (chunk) => {
    logs += chunk;
  });
  child.stderr.on("data", (chunk) => {
    logs += chunk;
  });
  try {
    await Promise.race([
      new Promise((resolveReady, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("CLI startup timed out: " + logs)),
          8000,
        );
        child.stdout.on("data", () => {
          if (logs.includes("listening")) {
            clearTimeout(timeout);
            resolveReady();
          }
        });
        child.once("exit", (code) => {
          clearTimeout(timeout);
          reject(new Error("CLI exited before startup: " + code + " " + logs));
        });
      }),
      once(child, "error").then(([error]) => {
        throw error;
      }),
    ]);
    equal(
      (
        await request(cliPort, "/?ref=PRIVATE_REQUEST_MARKER", {
          headers: { Cookie: "hackit-locale=en; marker=PRIVATE_COOKIE_MARKER" },
        })
      ).status,
      302,
    );
    equal((await request(cliPort, "/healthz")).status, 200);
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    const [code, signal] = await exited;
    equal(code, 0);
    equal(signal, null);
    ok(logs.includes("shutting down"));
    ok(!logs.includes("PRIVATE_REQUEST_MARKER"));
    ok(!logs.includes("PRIVATE_COOKIE_MARKER"));
  } finally {
    if (child.exitCode === null) child.kill("SIGKILL");
  }
  console.log(
    "Node runtime tests passed: " +
      assertions +
      " assertions covering production assets, locale routing, spoofed headers, traversal, symlinks, request bounds, methods, CSP/security headers, compression, validators, indexing, health, private logging, and SIGTERM.",
  );
} finally {
  for (const server of servers) {
    server.closeAllConnections();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
  await rm(fixture, { recursive: true, force: true });
}
