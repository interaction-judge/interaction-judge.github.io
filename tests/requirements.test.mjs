#!/usr/bin/env node
// Checks the page against the requirements agreed for matching
// https://arena.ai/blog/interaction-as-a-judge. No dependencies.
//
//   node tests/requirements.test.mjs              all checks
//   node tests/requirements.test.mjs --offline    skip checks that need the network
//   node tests/requirements.test.mjs --no-browser skip checks that drive headless Chrome
//
// Chrome is found at CHROME_PATH or the default macOS install location.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, createReadStream } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OFFLINE = process.argv.includes("--offline");
const NO_BROWSER = process.argv.includes("--no-browser");
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const BLOG = "https://arena.ai/blog/interaction-as-a-judge";
const SITE_ORIGIN = "https://interaction-judge.github.io/";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

/* ── What the blog says (the requirements, as data) ─────────────────────── */
const EXPECT = {
  tagline:
    "We study Interaction-as-a-Judge, a paradigm which uses computer-use agents to evaluate applications. " +
    "We find that Interaction-as-a-Judge improves both evaluation and downstream generation. " +
    "We see improvements to inference-time scaling (55.4% → 75.5%) and find that we can do " +
    "reinforcement learning with an interaction-only reward model (+50 Arena points).",
  datasets: [
    {
      name: "ArenaWebdevPreferences",
      url: "https://huggingface.co/datasets/lmarena-ai/arena-webdev-preferences",
      size: "6,390 application pairs across 7 different categories",
      mentions: 3,
    },
    {
      name: "ArenaWebdevCorrectness",
      url: "https://huggingface.co/datasets/lmarena-ai/arena-webdev-correctness",
      size: "189 game versions with 362 human-verified requirements",
      mentions: 2,
    },
  ],
  staleText: ["6,858", "222 game", "412 human", "not yet released"],
  battles: {
    reference: {
      prompt:
        "Create a fully functional, interactive Web-based Operating System (Web OS). This is a test of your " +
        "architectural intelligence, creativity, and coding logic. I am not pr…",
      winner: "Model B",
      sha1: { a: "9324d5960c04c6555e16da35cb3214c5b77c9593", b: "378c9e2900c18f3639622680a1868ae66769c745" },
    },
    brand: {
      prompt:
        "create a landing page for a music website that charts the influences of music artists and allows " +
        "users to explore the artists through pairs of music tracks that demonstrate that influence",
      winner: "Model B",
      sha1: { a: "d216c06cfa13e9a73c2b8a503e4d6524f05444c5", b: "55c80e84e5b0bb714b84450a73cf3b5fd7ef1bec" },
    },
  },
  talk: "https://www.youtube.com/embed/lu--lrbznOk",
  headerLinks: ["arXiv", "BibTeX", "Datasets"],
  arxiv: "https://arxiv.org/abs/2610.17895",
  // Already matched the blog before this update; must not drift.
  statCounts: ["65.6", "69.1", "70.8", "63.0", "71.1", "55.4", "75.5", "6.7", "35.7", "81.3", "88.5"],
  chartData: [
    "v: { code: 65.6, cs: 67.6, heur: 68.4, os: 68.3, iter: 69.1 }",
    "v: { code: 68.3, cs: 66.6, heur: 67.2, os: 67.0, iter: 67.9 }",
    "v: { code: 69.7, cs: 70.0, heur: 70.2, os: 70.2, iter: 70.8 }",
    "v: { code: 68.2, cs: 68.7, heur: 69.8, os: 70.0, iter: 70.2 }",
    "v: { heur: 67.5, os: 67.8, iter: 69.0 }",
    '{ m: "Luna", x: 0.0075, y: 51.6, dy: 22 }',
    '{ m: "Terra", x: 0.085, y: 59.6, dy: 22 }',
    '{ m: "Sol", x: 0.155, y: 63.0, dy: 22 }',
    '{ m: "Luna", x: 0.026, y: 65.2, dy: -12 }',
    '{ m: "Terra", x: 0.270, y: 68.0, dy: -12 }',
    '{ m: "Sol", x: 0.619, y: 71.1, dy: -12 }',
    "vals: [0, 49.8, 54.0, 55.0, 55.2, 55.4]",
    "vals: [0, 63.5, 72.5, 73.8, 74.6, 75.5]",
    'label: "Code reward model", color: C_GRAY, val: 6.14',
    'label: "Interaction reward model", color: C_PURPLE, val: 6.72',
  ],
  // Shown on the blog but deliberately not on the site (user chose block + copy button).
  blogOnlyLines: [/^Chi, W\., Hsu, I\.-H\./],
};

/* ── Helpers ────────────────────────────────────────────────────────────── */
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const sha = (algo, rel) => createHash(algo).update(readFileSync(path.join(ROOT, rel))).digest("hex");

const ENT = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“",
  rdquo: "”", minus: "−", mdash: "—", ndash: "–", hellip: "…", rarr: "→", middot: "·",
};
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m);

const stripHidden = (html) =>
  html
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
const BLOCK = /<\/?(p|div|h[1-6]|li|ul|ol|figcaption|figure|section|header|footer|nav|article|pre|br|iframe|button|main)\b[^>]*>/gi;
/** Visible text of an HTML fragment, one entry per block-level element. */
const textBlocks = (html) =>
  decode(stripHidden(html).replace(BLOCK, "\n").replace(/<[^>]+>/g, ""))
    .split("\n")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
const text = (html) => textBlocks(html).join(" ");
/** Comparison form: whitespace, parentheses and "·" separators are presentation, not content. */
const squash = (s) => s.replace(/[\s()·]/g, "");
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => decode(m[1]));
const between = (s, a, b) => {
  const i = s.indexOf(a);
  const j = s.indexOf(b, i + a.length);
  return i < 0 || j < 0 ? null : s.slice(i + a.length, j);
};

const results = [];
const check = (req, name, pass, detail = "") => results.push({ req, name, pass: !!pass, detail });
const skip = (req, name, why) => results.push({ req, name, pass: null, detail: why });

/* ── Static checks on the source files ──────────────────────────────────── */
const html = read("index.html");
const js = read("main.js");
const pageText = text(html);

// R1
const tagline = text(between(html, '<p class="tagline">', "</p>") ?? "");
check(1, "intro paragraph equals the blog's", squash(tagline) === squash(EXPECT.tagline), tagline);

// R2
const oldNames = [...(html + js).matchAll(/Arena(Preferences|Correctness)\b/g)].map((m) => m[0]);
check(2, "old dataset names are gone (page and script)", oldNames.length === 0, oldNames.join(", "));
for (const d of EXPECT.datasets) {
  const n = pageText.split(d.name).length - 1;
  check(2, `${d.name} named ${d.mentions}× on the page`, n === d.mentions, `found ${n}`);
}

// R3
for (const d of EXPECT.datasets) check(3, `size text: "${d.size}"`, pageText.includes(d.size));
const stale = EXPECT.staleText.filter((s) => pageText.includes(s));
check(3, "old sizes and 'not yet released' are gone", stale.length === 0, stale.join(", "));

// R4
for (const d of EXPECT.datasets)
  check(4, `${d.name} links to Hugging Face`, html.includes(`<a href="${d.url}">${d.name}</a>`));

// R5
for (const [key, b] of Object.entries(EXPECT.battles)) {
  const panel = between(html, `<div class="battle" data-battle="${key}">`, "</div>\n          </div>") ?? "";
  const prompt = text(between(panel, "<strong>User prompt</strong>", "</div>") ?? "");
  check(5, `${key}: prompt equals the blog's`, prompt === b.prompt, prompt);
  const winners = [...panel.matchAll(/<figcaption>(Model [AB]) <span class="ex-win">/g)].map((m) => m[1]);
  check(5, `${key}: ${b.winner} marked human preferred`, winners.join() === b.winner, winners.join());
  for (const side of ["a", "b"]) {
    const rel = `assets/media/arena/cat-${key}-${side}.mp4`;
    check(5, `${key}: video ${side.toUpperCase()} is the blog's file`,
      html.includes(`src="${rel}"`) && sha("sha1", rel) === b.sha1[side], rel);
  }
}

// R6
const remarks = between(html, 'aria-labelledby="remarks-title"', "</section>") ?? "";
const afterList = remarks.slice(remarks.indexOf("</ol>"));
check(6, "talk video embedded after the Ending Remarks list",
  remarks.includes("</ol>") && /<iframe[\s\S]*?src="([^"]+)"/.exec(afterList)?.[1] === EXPECT.talk);

// R7
const counts = [...html.matchAll(/data-count="([^"]+)"/g)].map((m) => m[1]);
check(7, "headline stats unchanged", counts.join() === EXPECT.statCounts.join(), counts.join());
const missingData = EXPECT.chartData.filter((line) => !js.includes(line));
check(7, "chart values unchanged", missingData.length === 0, missingData.join(" | "));
const curves = JSON.parse(read("assets/data/training_curves.json"));
check(7, "training curves present (builds + code length, 3 series each)",
  ["builds", "chars"].every((k) => Object.keys(curves[k] ?? {}).length === 3));

// R8
const headerLinks = [...(between(html, '<nav class="paper-links"', "</nav>") ?? "").matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map((m) => m[1]);
check(8, "header links are arXiv, BibTeX, Datasets", headerLinks.join() === EXPECT.headerLinks.join(), headerLinks.join());
const pdfs = hrefs(html).filter((h) => /\.pdf(\?|#|$)/i.test(h));
check(8, "no PDF link anywhere on the page", pdfs.length === 0 && !pageText.includes("Paper (PDF)"), pdfs.join());
check(8, "arXiv link present", html.includes(`<a href="${EXPECT.arxiv}">arXiv</a>`));

// R9
const bib = decode(between(html, '<pre><code id="bibtex">', "</code></pre>") ?? "");
check(9, "BibTeX block shown and equal to assets/citation.bib", bib.trim() !== "" && bib.trim() === read("assets/citation.bib").trim());
check(9, "'Copy as BibTeX' button present", /<button[^>]*id="copy-bibtex"[^>]*>Copy as BibTeX<\/button>/.test(html));

// R10
const playBits = ["repair-links", "Play broken", "Play fixed", "assets/games/"].filter((s) => (html + js).includes(s));
check(10, "no play links in page or script", playBits.length === 0, playBits.join(", "));

/* ── Live checks against the blog and linked services ───────────────────── */
async function live() {
  const get = (url) => fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });

  const res = await get(BLOG);
  const blog = stripHidden(await res.text());
  // The article runs from the byline to its last element, the "Copy as BibTeX" button.
  const article = between(blog, "Reading Time", "Copy as BibTeX");
  if (!res.ok || !article) {
    check(7, "blog article fetched", false, `HTTP ${res.status}`);
    return;
  }
  // Every line of the blog article must appear, in the same words, on the site.
  const site = squash(pageText);
  const lines = textBlocks("<p>" + article.slice(article.indexOf(">") + 1));
  const missing = lines
    .filter((l) => !EXPECT.blogOnlyLines.some((re) => re.test(l)))
    .filter((l) => !site.includes(squash(l)));
  check(7, `all ${lines.length} text blocks of the blog article appear on the site`, missing.length === 0,
    missing.map((l) => `"${l.slice(0, 90)}"`).join(" | "));
  check(1, "intro paragraph equals the live blog's", lines.some((l) => squash(l) === squash(tagline)));

  const siteHrefs = new Set(hrefs(html));
  const missingLinks = [...new Set(hrefs(article))]
    .map((h) => h.replace(SITE_ORIGIN, ""))
    .filter((h) => !siteHrefs.has(h));
  check(4, "every link in the blog article is on the site", missingLinks.length === 0, missingLinks.join(", "));

  const blogTalk = /<iframe[^>]+src="(https:\/\/www\.youtube\.com\/embed\/[^"]+)"/.exec(article)?.[1];
  check(6, "same talk video as the live blog", blogTalk === EXPECT.talk, String(blogTalk));

  for (const d of EXPECT.datasets) {
    const r = await get(d.url);
    check(4, `${d.name} link resolves`, r.ok, `HTTP ${r.status}`);
  }
  const id = EXPECT.talk.split("/").pop();
  const o = await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}`);
  check(6, "talk video exists and allows embedding", o.ok, `HTTP ${o.status}`);
}

/* ── Checks in a real browser (headless Chrome over the DevTools protocol) ─ */
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".mp4": "video/mp4", ".svg": "image/svg+xml", ".png": "image/png", ".bib": "text/plain" };

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) return res.writeHead(404).end();
    const size = statSync(file).size;
    const head = { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "accept-ranges": "bytes" };
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (!m) return createReadStream(file).pipe(res.writeHead(200, { ...head, "content-length": size }));
    const start = m[1] ? Number(m[1]) : 0;
    const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    res.writeHead(206, { ...head, "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
    createReadStream(file, { start, end }).pipe(res);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

/** Runs inside the page. Returns plain data for the assertions below. */
async function inPage() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitFor = async (fn, ms = 10000) => {
    for (const t = Date.now(); Date.now() - t < ms; await sleep(100)) if (fn()) return true;
    return false;
  };
  const out = {};

  out.headerLinks = [...document.querySelectorAll(".paper-links a")].map((a) => a.textContent.trim());
  out.pdfLinks = [...document.querySelectorAll("a[href]")].filter((a) => /\.pdf(\?|#|$)/i.test(a.getAttribute("href"))).length;

  await waitFor(() => document.querySelectorAll("#repair-grid .repair").length > 0);
  out.repairCards = document.querySelectorAll("#repair-grid .repair").length;
  out.repairLinks = document.querySelectorAll("#repair-grid a").length;
  out.playText = /Play (broken|fixed)/i.test(document.body.textContent);

  out.battles = {};
  for (const key of ["reference", "brand"]) {
    document.querySelector(`#battle-tabs [data-battle="${key}"]`).click();
    const panel = document.querySelector(`.battle[data-battle="${key}"]`);
    const vids = [...panel.querySelectorAll("video")];
    out.battles[key] = {
      shown: !panel.hidden && [...document.querySelectorAll(".battle")].filter((b) => !b.hidden).length === 1,
      loaded: await waitFor(() => vids.every((v) => v.readyState >= 1 && v.videoWidth > 0)),
      errors: vids.filter((v) => v.error).length,
    };
  }

  const frame = document.querySelector(".talk-video iframe");
  const list = document.querySelector(".remarks-list");
  const ack = document.getElementById("ack-title");
  frame.scrollIntoView();
  const box = frame.getBoundingClientRect();
  out.talk = {
    src: frame.src,
    afterList: !!(list.compareDocumentPosition(frame) & Node.DOCUMENT_POSITION_FOLLOWING),
    beforeAck: !!(frame.compareDocumentPosition(ack) & Node.DOCUMENT_POSITION_FOLLOWING),
    ratio: box.width / box.height,
    width: box.width,
  };

  let copied = null;
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: (t) => ((copied = t), Promise.resolve()) },
  });
  const btn = document.getElementById("copy-bibtex");
  const block = document.getElementById("bibtex");
  out.copy = { blockVisible: block.getBoundingClientRect().height > 0, block: block.textContent };
  btn.click();
  out.copy.feedback = await waitFor(() => btn.textContent === "Copied", 2000);
  out.copy.copied = copied;
  out.copy.resets = await waitFor(() => btn.textContent === "Copy as BibTeX", 4000);
  return out;
}

async function browser() {
  const server = await serve();
  const profile = mkdtempSync(path.join(tmpdir(), "iaj-chrome-"));
  const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--mute-audio", "--window-size=1400,1000", "about:blank"],
    { stdio: ["ignore", "ignore", "pipe"] });
  try {
    const wsUrl = await new Promise((ok, fail) => {
      let buf = "";
      chrome.stderr.on("data", (d) => {
        buf += d;
        const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf);
        if (m) ok(m[1]);
      });
      chrome.on("exit", () => fail(new Error("Chrome exited before DevTools was ready")));
      setTimeout(() => fail(new Error("Timed out waiting for Chrome")), 20000);
    });
    const ws = new WebSocket(wsUrl);
    await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = () => fail(new Error("DevTools socket failed")); });
    let seq = 0;
    const pending = new Map();
    const waiters = new Map();
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        m.error ? p.fail(new Error(m.error.message)) : p.ok(m.result);
      } else if (waiters.has(m.method)) {
        waiters.get(m.method)();
        waiters.delete(m.method);
      }
    };
    const send = (method, params = {}, sessionId) =>
      new Promise((ok, fail) => {
        pending.set(++seq, { ok, fail });
        ws.send(JSON.stringify({ id: seq, method, params, sessionId }));
      });
    const event = (method) => new Promise((ok) => waiters.set(method, ok));

    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    await send("Page.enable", {}, sessionId);
    const loaded = event("Page.loadEventFired");
    await send("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/index.html` }, sessionId);
    await loaded;
    const r = await send("Runtime.evaluate",
      { expression: `(${inPage})()`, awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    const p = r.result.value;

    for (const key of Object.keys(EXPECT.battles)) {
      const b = p.battles[key];
      check(5, `${key}: tab shows the example and both videos load in the browser`, b.shown && b.loaded && b.errors === 0, JSON.stringify(b));
    }
    check(6, "talk video sits between the remarks list and Acknowledgements, at 16:9",
      p.talk.src === EXPECT.talk && p.talk.afterList && p.talk.beforeAck && Math.abs(p.talk.ratio - 16 / 9) < 0.03 && p.talk.width > 300,
      JSON.stringify(p.talk));
    check(8, "rendered header links are arXiv, BibTeX, Datasets; no PDF link",
      p.headerLinks.join() === EXPECT.headerLinks.join() && p.pdfLinks === 0, p.headerLinks.join());
    check(9, "BibTeX block visible in the browser", p.copy.blockVisible);
    check(9, "clicking 'Copy as BibTeX' copies the exact block", p.copy.copied !== null && p.copy.copied === p.copy.block && p.copy.copied.trim() === bib.trim());
    check(9, "button confirms with 'Copied', then resets", p.copy.feedback && p.copy.resets);
    check(10, `rendered repair cards (${p.repairCards}) contain no links`, p.repairCards === 4 && p.repairLinks === 0 && !p.playText);
    ws.close();
  } finally {
    chrome.kill();
    server.close();
    await new Promise((r) => setTimeout(r, 300));
    rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
  }
}

/* ── Run and report ─────────────────────────────────────────────────────── */
if (OFFLINE) skip(0, "live blog, Hugging Face and YouTube checks", "--offline");
else await live().catch((e) => check(0, "live checks ran", false, e.message));

if (NO_BROWSER) skip(0, "browser checks", "--no-browser");
else if (!existsSync(CHROME)) skip(0, "browser checks", `Chrome not found at ${CHROME} (set CHROME_PATH)`);
else await browser().catch((e) => check(0, "browser checks ran", false, e.message));

results.sort((a, b) => a.req - b.req);
for (const r of results) {
  const mark = r.pass === null ? "SKIP" : r.pass ? "PASS" : "FAIL";
  const tag = r.req ? `R${r.req}`.padEnd(3) : "-  ";
  console.log(`${mark}  ${tag} ${r.name}${r.pass ? "" : r.detail ? `  →  ${r.detail}` : ""}`);
}
const failed = results.filter((r) => r.pass === false);
const skipped = results.filter((r) => r.pass === null);
console.log(`\n${results.length - failed.length - skipped.length} passed, ${failed.length} failed, ${skipped.length} skipped`);
process.exit(failed.length ? 1 : 0);
