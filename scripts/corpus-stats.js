#!/usr/bin/env node
/**
 * corpus-stats.js — 받아둔 회차(.corpus/)를 상대로 두 가지를 센다.
 *
 *   --audit  등록된 정본이 실제로 몇 회차에 나오는가
 *            → 0건이면 폐기 후보이거나 계절 한정 섹션. 회차 목록이 곧 근거다.
 *   --mine   아직 등록되지 않았는데 여러 회차에 반복되는 줄
 *            → 새 확정 문구 후보. 이게 회차를 모으는 이유다.
 *
 * 눈으로 훑는 건 서너 회차까지만 된다. 회차가 쌓이면 "12개 회차에 똑같이 나오는데 TM 에 없다"를
 * 사람이 못 찾는다 — 그래서 세는 일을 기계에 넘긴다.
 *
 * 사용:
 *   node scripts/corpus-stats.js --audit
 *   node scripts/corpus-stats.js --mine [--min 4] [--doc-type store_update]
 *
 * 먼저 node scripts/fetch-announcement.js 로 .corpus/ 를 채워야 한다.
 *
 * **--mine 결과는 후보지 확정이 아니다.** 반복은 굳었다는 증거가 아니라 같은 사람이 계속 썼다는
 * 증거일 수도 있다(references/judgment.md "번역자가 만든 라벨을 의심한다"). KR 원문 대조와
 * 확인을 거쳐 등록한다.
 *
 * 의존성 없음 (Node 내장만).
 */

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".corpus");

function load() {
  const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, "references", "corpus.json"), "utf8"));
  const docs = [];
  for (const e of corpus.announcements) {
    try {
      docs.push({ ...e, en: fs.readFileSync(path.join(CACHE, `${e.id}.en.txt`), "utf8") });
    } catch { /* 아직 안 받은 회차 */ }
  }
  if (!docs.length) {
    console.error("[corpus-stats] .corpus/ 가 비어 있다 — 먼저 node scripts/fetch-announcement.js 를 돌린다.");
    process.exit(2);
  }
  const terms = JSON.parse(fs.readFileSync(path.join(ROOT, "glossary", "announcements.json"), "utf8")).terms;
  // 고유명사도 이미 등록된 것이다 — 안 빼면 후보 목록이 등록분으로 채워진다
  const nouns = JSON.parse(fs.readFileSync(path.join(ROOT, "glossary", "proper_nouns.json"), "utf8")).terms;
  return { docs, terms, nouns };
}

function ref(d) {
  return `${d.published} ${d.path === "events" ? "events" : "news"}/${d.id}`;
}

function audit(docs, terms) {
  console.log(`등록 정본 ${terms.length}건 · 코퍼스 ${docs.length}회차\n`);
  const rows = terms
    .map((t) => ({ t, hits: docs.filter((d) => d.en.includes(t.target)) }))
    .sort((a, b) => a.hits.length - b.hits.length);
  for (const { t, hits } of rows) {
    const mark = hits.length === 0 ? "✗" : hits.length < 3 ? "·" : "✓";
    console.log(`${mark} ${String(hits.length).padStart(2)}/${docs.length}  [${t.doc_type}] ${t.target.slice(0, 60)}`);
    if (hits.length && hits.length < 6) console.log(`        ${hits.map(ref).join(", ")}`);
  }
  const zero = rows.filter((r) => !r.hits.length).length;
  console.log(`\n0건 ${zero}건 — 폐기 후보가 아니라 '이 코퍼스에 그 섹션이 없다'일 수 있다. 회차를 늘려 보고 판단한다.`);
}

/** 가변부가 섞인 줄은 후보에서 뺀다 — 날짜·수치·괄호수량은 회차마다 달라 TM 이 될 수 없다. */
const VARIABLE = /\d{2}:\d{2}|\b(January|February|March|April|May|June|July|August|September|October|November|December)\b|\d{4}|\(x?\d+\)/;

function mine(docs, terms, nouns, min, docType) {
  const registered = new Set([...terms, ...nouns].map((t) => t.target));
  const target = docType ? docs.filter((d) => d.doc_type === docType) : docs;
  if (!target.length) { console.error(`[corpus-stats] doc_type=${docType} 회차가 없다.`); process.exit(2); }

  const seen = new Map(); // line -> Set(회차 id)
  for (const d of target) {
    for (let line of new Set(d.en.split("\n"))) {
      line = line.replace(/^[#\->\s*]+/, "").replace(/^[※*]+\s*/, "").replace(/[*]+$/, "").trim();
      if (line.length < 8 || line.length > 220) continue;
      if (registered.has(line) || VARIABLE.test(line)) continue;
      if (!seen.has(line)) seen.set(line, new Set());
      seen.get(line).add(d.id);
    }
  }
  const rows = [...seen.entries()]
    .map(([line, ids]) => ({ line, ids: [...ids] }))
    .filter((r) => r.ids.length >= min)
    .sort((a, b) => b.ids.length - a.ids.length || a.line.localeCompare(b.line));

  console.log(`미등록인데 ${min}회차 이상 반복되는 줄 — ${rows.length}건 (대상 ${target.length}회차${docType ? `, doc_type=${docType}` : ""})\n`);
  for (const r of rows) {
    console.log(`${String(r.ids.length).padStart(2)}/${target.length}  ${r.line}`);
  }
  console.log(`\n후보지 확정이 아니다 — KR 원문을 대조하고 확인을 받아 등록한다(references/judgment.md).`);
}

function main() {
  const a = process.argv.slice(2);
  const { docs, terms, nouns } = load();
  const min = a.includes("--min") ? +a[a.indexOf("--min") + 1] : 4;
  const dt = a.includes("--doc-type") ? a[a.indexOf("--doc-type") + 1] : null;
  if (a.includes("--mine")) mine(docs, terms, nouns, min, dt);
  else if (a.includes("--audit")) audit(docs, terms);
  else console.error("usage: node scripts/corpus-stats.js --audit | --mine [--min N] [--doc-type store_update]");
}

main();
