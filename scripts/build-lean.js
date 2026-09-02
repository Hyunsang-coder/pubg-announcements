#!/usr/bin/env node
/**
 * build-lean.js — 조회면(lean)을 유지보수면(JSON)에서 생성한다.
 *
 * 왜: announcements.json 은 37KB 인데 번역에 실제로 쓰이는 source→target 은 6.4KB 뿐이다.
 * 나머지는 notes(확정 사유)·status·반복되는 JSON 키다. 번역할 때마다 그 6배를 읽으면
 * 토큰도 토큰이지만 정작 source→target 대응이 잡음에 묻힌다.
 *
 * 그래서 두 면으로 가른다:
 *   조회면 (glossary/_lean/*.tsv + SKILL.md 인라인 표) — 번역 중에 읽는다
 *   유지보수면 (glossary/*.json)                      — 등록·분쟁 때만 읽는다
 *
 * 같은 데이터가 두 곳에 있는 건 이 저장소가 경계하는 드리프트 원인 그 자체다. 그래서
 * **조회면은 손으로 편집하지 않는다** — 여기서 생성만 하고, --check 로 신선도를 검사한다.
 * check-counts.sh 가 그 검사를 부른다.
 *
 * 호출:
 *   node scripts/build-lean.js           생성 (파일을 덮어쓴다)
 *   node scripts/build-lean.js --check   생성물이 최신인지만 검사. 낡았으면 exit 1
 *
 * 의존성 없음 (Node 내장만).
 */

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LEAN_DIR = path.join(ROOT, "glossary", "_lean");

// 조회 순서. common 이 먼저인 것은 공지 유형과 무관하게 항상 적용되기 때문이고,
// 분류 순서는 공지를 읽어 내려가는 순서(구조 → 고지 → 본문 → 마무리)에 가깝게 뒀다.
// 문서 단위의 실제 섹션 순서는 references/skeletons.md 소관이다 — 여기서 흉내내지 않는다.
const DOC_TYPE_ORDER = ["common", "store_update", "special_drops"];
const CATEGORY_ORDER = [
  "section_header",
  "legal_notice",
  "mission_phrase",
  "product_label",
  "period_phrase",
  "boilerplate",
];

const MARK_BEGIN = "<!-- BEGIN:proper-nouns (생성물 — scripts/build-lean.js) -->";
const MARK_END = "<!-- END:proper-nouns -->";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function rank(list, v) {
  const i = list.indexOf(v);
  return i === -1 ? list.length : i;
}

/** TSV 셀에 탭·개행이 들어가면 열이 밀린다. 등록 단계에서 막아야 할 문제라 조용히 고치지 않고 세운다. */
function assertClean(rows) {
  for (const r of rows) {
    for (const cell of r) {
      if (/[\t\n\r]/.test(cell)) {
        throw new Error(`TSV 셀에 탭/개행이 있다 — glossary JSON 을 고쳐야 한다: ${JSON.stringify(cell)}`);
      }
    }
  }
}

function buildAnnouncementsTsv() {
  const data = readJson(path.join(ROOT, "glossary", "announcements.json"));
  const terms = [...data.terms].sort(
    (a, b) =>
      rank(DOC_TYPE_ORDER, a.doc_type) - rank(DOC_TYPE_ORDER, b.doc_type) ||
      rank(CATEGORY_ORDER, a.category_id) - rank(CATEGORY_ORDER, b.category_id) ||
      a.source.localeCompare(b.source, "ko")
  );
  const rows = terms
    .filter((t) => t.status !== "deprecated")
    .map((t) => [t.doc_type, t.category_id, t.source, t.target]);
  assertClean(rows);
  return (
    "# 생성물 — 손으로 편집하지 않는다. 원본: glossary/announcements.json / 생성: scripts/build-lean.js\n" +
    "# 확정 문장 TM. 있으면 그대로 쓰고 가변부(날짜·서수·수치·상품명·연도)만 교체한다.\n" +
    "# notes(확정 사유)·status·근거는 원본 JSON 에 있다. 문서 단위 섹션 순서는 references/skeletons.md.\n" +
    ["doc_type\tcategory\tsource\ttarget", ...rows.map((r) => r.join("\t"))].join("\n") +
    "\n"
  );
}

function properNounRows() {
  const data = readJson(path.join(ROOT, "glossary", "proper_nouns.json"));
  return [...data.terms]
    .filter((t) => t.status !== "deprecated")
    .sort(
      (a, b) =>
        a.category_id.localeCompare(b.category_id) || a.source.localeCompare(b.source, "ko")
    )
    .map((t) => [t.source, t.target, t.category_id]);
}

function buildProperNounsTsv(rows) {
  assertClean(rows);
  return (
    "# 생성물 — 손으로 편집하지 않는다. 원본: glossary/proper_nouns.json / 생성: scripts/build-lean.js\n" +
    ["source\ttarget\tcategory", ...rows.map((r) => r.join("\t"))].join("\n") +
    "\n"
  );
}

/** SKILL.md 의 마커 사이를 고유명사 표로 갈아 끼운다. 조회량이 작아 파일을 따로 열 이유가 없다. */
function buildSkillMd(rows) {
  const src = fs.readFileSync(path.join(ROOT, "SKILL.md"), "utf8");
  const b = src.indexOf(MARK_BEGIN);
  const e = src.indexOf(MARK_END);
  if (b === -1 || e === -1 || e < b) {
    throw new Error(`SKILL.md 에 고유명사 마커가 없다. 다음 두 줄을 넣어야 한다:\n${MARK_BEGIN}\n${MARK_END}`);
  }
  const table = [
    "| KR | EN |",
    "|---|---|",
    ...rows.map(([ko, en]) => `| ${ko} | ${en} |`),
  ].join("\n");
  return src.slice(0, b) + MARK_BEGIN + "\n\n" + table + "\n\n" + src.slice(e);
}

function main() {
  const check = process.argv.includes("--check");
  const pnRows = properNounRows();

  const outputs = [
    [path.join(LEAN_DIR, "announcements.tsv"), buildAnnouncementsTsv()],
    [path.join(LEAN_DIR, "proper_nouns.tsv"), buildProperNounsTsv(pnRows)],
    [path.join(ROOT, "SKILL.md"), buildSkillMd(pnRows)],
  ];

  let stale = 0;
  for (const [p, content] of outputs) {
    const rel = path.relative(ROOT, p);
    const current = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
    if (current === content) {
      if (check) console.log(`  ok    ${rel}`);
      continue;
    }
    if (check) {
      console.log(`  FAIL  ${rel} — 원본 JSON 과 어긋난다. \`node scripts/build-lean.js\` 로 다시 생성한다.`);
      stale++;
    } else {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, content, "utf8");
      console.log(`  wrote ${rel}`);
    }
  }

  if (check && stale) process.exit(1);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(`[build-lean] ${e.message}`);
    process.exit(2);
  }
}
