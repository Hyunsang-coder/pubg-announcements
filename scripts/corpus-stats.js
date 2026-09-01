#!/usr/bin/env node
/**
 * corpus-stats.js — 받아둔 회차(.corpus/)를 상대로 두 가지를 센다.
 *
 *   --audit  등록된 정본이 실제로 몇 회차에 나오는가
 *            → 0건이면 폐기 후보이거나 계절 한정 섹션. 회차 목록이 곧 근거다.
 *   --mine   아직 등록되지 않았는데 여러 회차에 반복되는 줄
 *            → 새 확정 문구 후보. 이게 회차를 모으는 이유다.
 *   --conflicts  같은 자리인데 표기가 갈린 줄 (대소문자·콤마·아포스트로피 차이)
 *            → 어느 형태를 등록할지 다툼이 있는 자리. 빈도순, 동률이면 최신순으로 점수를 매긴다.
 *
 * 눈으로 훑는 건 서너 회차까지만 된다. 회차가 쌓이면 "12개 회차에 똑같이 나오는데 TM 에 없다"를
 * 사람이 못 찾는다 — 그래서 세는 일을 기계에 넘긴다.
 *
 * 사용:
 *   node scripts/corpus-stats.js --audit
 *   node scripts/corpus-stats.js --mine [--min 4] [--doc-type store_update]
 *   node scripts/corpus-stats.js --conflicts [--min 2]
 *
 * 먼저 node scripts/fetch-announcement.js 로 .corpus/ 를 채워야 한다.
 *
 * **--conflicts 의 점수는 추천이지 판정이 아니다.** 빈도·최근성으로 갈리지 않는 축이 하나 더 있다:
 * 도착어 문법과 인게임 표기다. 이 저장소의 판례 둘이 정확히 그 경우다 —
 * 'Hello players!' 는 25:3 으로 다수였지만 반려됐고(영어 호격 콤마), 'Hello, Players!' 는
 * 4회차 연속 최신이었지만 반려됐다(보통명사 대문자). 점수는 **문법으로 결론이 안 날 때** 쓴다.
 * 판단 순서는 references/judgment.md 를 따른다.
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

/** 표기 차이를 지우는 열쇠 — 이 열쇠가 같은데 원문이 다르면 '같은 자리, 다른 표기'다. */
function variantKey(line) {
  return line
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc]/g, "'")   // 굽은 아포스트로피 → 곧은 것
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[,.!?:;]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** published('2026-08')를 비교 가능한 수로. */
const ym = (d) => Number((d.published || "0000-00").replace("-", ""));

function conflicts(docs, terms, nouns, min) {
  const registered = new Set([...terms, ...nouns].map((t) => t.target));
  const groups = new Map(); // 열쇠 -> Map(원문 -> [회차])
  for (const d of docs) {
    for (let line of new Set(d.en.split("\n"))) {
      line = line.replace(/^[#\->\s*]+/, "").replace(/^[\u203b*]+\s*/, "").replace(/[*]+$/, "").trim();
      if (line.length < 8 || line.length > 220) continue;
      if (VARIABLE.test(line)) continue;
      const k = variantKey(line);
      if (!groups.has(k)) groups.set(k, new Map());
      const g = groups.get(k);
      if (!g.has(line)) g.set(line, []);
      if (!g.get(line).some((x) => x.id === d.id)) g.get(line).push(d);
    }
  }

  const rows = [];
  for (const [, g] of groups) {
    if (g.size < 2) continue;                                  // 표기가 안 갈렸다
    const vs = [...g.entries()].map(([line, ds]) => ({
      line, n: ds.length, latest: Math.max(...ds.map(ym)), reg: registered.has(line),
    }));
    if (vs.reduce((s, v) => s + v.n, 0) < min) continue;
    vs.sort((a, b) => b.n - a.n || b.latest - a.latest);        // 빈도 우선, 동률이면 최신
    rows.push(vs);
  }
  rows.sort((a, b) => b.reduce((s, v) => s + v.n, 0) - a.reduce((s, v) => s + v.n, 0));

  console.log(`표기가 갈린 자리 — ${rows.length}건 (대상 ${docs.length}회차)`);
  console.log("점수: 회차 수 우선, 동률이면 최신 회차. ◆ = 점수 우세형 · ★ = 이미 등록된 정본\n");

  let disputed = 0;
  for (const vs of rows) {
    const tie = vs.length > 1 && vs[0].n === vs[1].n;
    for (const [i, v] of vs.entries()) {
      const mark = (i === 0 ? "◆" : " ") + (v.reg ? "★" : " ");
      const last = String(v.latest).replace(/(\d{4})(\d{2})/, "$1-$2");
      console.log(`${mark} ${String(v.n).padStart(2)}회차  최신 ${last}  ${v.line.slice(0, 88)}`);
    }
    if (tie) console.log("     ↑ 동률 — 최신 회차로 갈랐다");
    if (vs.some((v) => v.reg) && !vs[0].reg) {
      console.log("     ↑ 점수와 등록이 갈린다 — 문법·인게임 표기로 이미 판정한 자리다. 점수를 따르지 않는다.");
      disputed++;
    }
    console.log("");
  }
  console.log("점수는 추천이지 판정이 아니다. 문법이나 인게임 표기로 결론이 나면 그쪽이 먼저다 — references/judgment.md.");
  if (disputed) console.log(`점수와 등록이 갈린 자리 ${disputed}건 — 이 저장소가 판단 순서를 두는 이유가 그것이다.`);
}

function main() {
  const a = process.argv.slice(2);
  const { docs, terms, nouns } = load();
  const min = a.includes("--min") ? +a[a.indexOf("--min") + 1] : 4;
  const dt = a.includes("--doc-type") ? a[a.indexOf("--doc-type") + 1] : null;
  if (a.includes("--mine")) mine(docs, terms, nouns, min, dt);
  else if (a.includes("--audit")) audit(docs, terms);
  else if (a.includes("--conflicts")) conflicts(docs, terms, nouns, a.includes("--min") ? min : 2);
  else console.error("usage: node scripts/corpus-stats.js --audit | --mine [--min N] [--doc-type store_update] | --conflicts [--min N]");
}

main();
