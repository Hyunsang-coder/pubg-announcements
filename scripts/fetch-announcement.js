#!/usr/bin/env node
/**
 * fetch-announcement.js — 발행 공지의 KR/EN 본문을 받아 로컬 캐시에 정리한다.
 *
 * 왜 로컬 캐시인가: 근거(회차 id)는 references/corpus.json 에 커밋하지만 **본문은 커밋하지 않는다.**
 * 공지 전문은 PUBG 저작물이고, 이 저장소는 문장 단위 번역 대응을 담는 곳이지 원문 재배포처가 아니다.
 * 필요할 때 받아 쓰고 .corpus/ 는 gitignore 한다.
 *
 * 사용:
 *   node scripts/fetch-announcement.js              corpus.json 의 회차 전부 (이미 받은 건 건너뜀)
 *   node scripts/fetch-announcement.js 10828 9637   특정 id 만
 *   node scripts/fetch-announcement.js --force      이미 받은 것도 다시 받음
 *   node scripts/fetch-announcement.js --verify     받지 않고, 로컬 본문이 corpus.json 의 sha256 과 같은지만 본다
 *
 * 출력: .corpus/<id>.ko.txt · .corpus/<id>.en.txt (본문만, 구조 보존)
 *
 * 판본 대조: corpus.json 의 sha256 은 등록 근거를 센 시점의 판본이다. 새로 받은 본문이 다르면
 * 그 회차를 근거로 삼은 notes 를 다시 봐야 한다는 신호라 CHANGED 로 표시한다(오류는 아니다).
 *
 * 주의: pubg.com 의 현재 HTML 구조(content-template__inner)에 의존한다. 사이트가 개편되면
 * 추출이 빈 결과를 내며, 그때는 이 파일의 CONTENT_RE 를 고친다. 빈 결과는 조용히 넘어가지 않고 세운다.
 *
 * 의존성 없음 (Node 내장만).
 */

"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".corpus");
const CORPUS = path.join(ROOT, "references", "corpus.json");
const CONTENT_RE = /<div[^>]*class="[^"]*content-template__inner[^"]*"[^>]*>/i;
const LOCALES = ["ko", "en"];

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ldquo: "“", rdquo: "”",
  lsquo: "‘", rsquo: "’", mdash: "—", ndash: "–", hellip: "…", middot: "·",
  reg: "®", trade: "™", copy: "©", times: "×", deg: "°" };

function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? ENT[n.toLowerCase()] ?? m);
}

/** 여는 태그부터 짝이 맞는 닫는 태그까지 (중첩 div 대응). */
function sliceBalanced(html, start, tag) {
  const open = new RegExp(`<${tag}\\b`, "gi"), close = new RegExp(`</${tag}\\s*>`, "gi");
  let depth = 0, i = start;
  while (i < html.length) {
    open.lastIndex = i; close.lastIndex = i;
    const o = open.exec(html), c = close.exec(html);
    if (!c) break;
    if (o && o.index < c.index) { depth++; i = o.index + 1; }
    else { depth--; i = c.index + 1; if (depth === 0) return html.slice(start, c.index + c[0].length); }
  }
  return html.slice(start);
}

/** 구조를 살려 평문으로. 이탤릭·굵게는 style.json 이 보존을 요구하므로 마커로 남긴다. */
function extract(html) {
  const m = CONTENT_RE.exec(html);
  if (!m) throw new Error("본문 컨테이너(content-template__inner)를 못 찾음 — 사이트 구조가 바뀌었을 수 있다");
  let s = sliceBalanced(html, m.index, "div");
  s = s.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "");
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi, (_, __, t) => `${t}`);
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi, (_, __, t) => `${t}`);
  s = s.replace(/<h([1-6])\b[^>]*>/gi, (_, n) => `\n\n${"#".repeat(+n)} `).replace(/<\/h[1-6]\s*>/gi, "\n");
  s = s.replace(/<li\b[^>]*>/gi, "\n- ").replace(/<\/li\s*>/gi, "");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|ul|ol|tr|table|blockquote)\s*>/gi, "\n");
  s = s.replace(/<t[dh]\b[^>]*>/gi, " | ");
  s = s.replace(/<img\b[^>]*>/gi, "\n[이미지]\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decode(s);
  s = s.replace(/([^]*)/g, (_, t) => (t.trim() ? `*${t.trim()}*` : t));
  s = s.replace(/([^]*)/g, (_, t) => (t.trim() ? `**${t.trim()}**` : t));
  return s.split("\n").map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter((l, i, a) => l !== "" || (a[i - 1] || "") !== "")
    .join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const sha = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);

function urlFor(entry, locale) {
  const seg = entry.path === "events" ? "events/notice" : "news";
  return `https://pubg.com/${locale}/${seg}/${entry.id}`;
}

async function get(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const verify = args.includes("--verify");
  const ids = args.filter((a) => /^\d+$/.test(a));

  const corpus = JSON.parse(fs.readFileSync(CORPUS, "utf8"));
  let entries = corpus.announcements;
  if (ids.length) {
    entries = ids.map((id) => entries.find((e) => e.id === id) || { id, path: "news" });
  }

  if (verify) return runVerify(entries);

  fs.mkdirSync(CACHE, { recursive: true });
  let got = 0, skipped = 0, failed = 0, changed = 0;

  for (const e of entries) {
    for (const loc of LOCALES) {
      const out = path.join(CACHE, `${e.id}.${loc}.txt`);
      if (!force && fs.existsSync(out)) { skipped++; continue; }
      const url = urlFor(e, loc);
      try {
        const text = extract(await get(url));
        if (text.length < 200) throw new Error(`본문이 너무 짧다 (${text.length}자)`);
        fs.writeFileSync(out, text + "\n", "utf8");
        const want = e.sha256 && e.sha256[loc];
        const have = sha(text + "\n");
        if (want && want !== have) {
          console.log(`  CHANGED ${e.id}.${loc}  등록 근거 판본(${want}) ≠ 지금(${have}) — 이 회차를 근거로 쓴 notes 를 다시 본다`);
          changed++;
        }
        console.log(`  got   ${e.id}.${loc}  ${text.length}자  ${e.title_en || ""}`);
        got++;
      } catch (err) {
        console.error(`  FAIL  ${e.id}.${loc}  ${url} — ${err.message}`);
        failed++;
      }
      await new Promise((r) => setTimeout(r, 400)); // 연속 요청 간격
    }
  }
  console.log(`\n[fetch] 받음 ${got} · 건너뜀 ${skipped} · 실패 ${failed}${changed ? ` · 판본 변경 ${changed}` : ""} → ${path.relative(ROOT, CACHE)}/`);
  if (failed) process.exit(1);
}

/** 받지 않고 로컬 본문만 corpus.json 의 sha256 과 대조한다. */
function runVerify(entries) {
  let ok = 0, changed = 0, absent = 0, unrecorded = 0;
  for (const e of entries) {
    for (const loc of LOCALES) {
      const f = path.join(CACHE, `${e.id}.${loc}.txt`);
      if (!fs.existsSync(f)) { absent++; continue; }
      const want = e.sha256 && e.sha256[loc];
      if (!want) { console.log(`  ?     ${e.id}.${loc}  corpus.json 에 sha256 없음`); unrecorded++; continue; }
      const have = sha(fs.readFileSync(f, "utf8"));
      if (want === have) { ok++; continue; }
      console.log(`  CHANGED ${e.id}.${loc}  등록 근거 판본(${want}) ≠ 로컬(${have})  ${e.published || ""} ${e.title_en || ""}`);
      changed++;
    }
  }
  console.log(`\n[verify] 일치 ${ok} · 판본 변경 ${changed} · 미수신 ${absent} · 미기록 ${unrecorded}`);
  if (changed) console.log("판본 변경은 오류가 아니다 — 원문이 개정됐다는 뜻이고, 그 회차를 근거로 삼은 notes 를 다시 본다.");
}

main().catch((e) => { console.error(`[fetch] ${e.message}`); process.exit(2); });
