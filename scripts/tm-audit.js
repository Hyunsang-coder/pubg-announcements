#!/usr/bin/env node
/**
 * tm-audit.js — 확정 문구 TM 의 도착어 정본이 번역문에 실재하는지 대조한다.
 *
 * 왜 원문이 아니라 도착어인가: 공지의 고정 문구는 회차마다 KR 원문이 조사·공백·마침표
 * 단위로 흔들린다. 원문 부분일치로 대조하면 한 글자만 달라도 조용히 0건이 되고, 그러면
 * 그 문장은 도착어 검사도 영영 못 받는다 — 재번역 드리프트를 막으려고 만든 TM 이 정작
 * 드리프트를 못 잡는다. 도착어 정본은 우리가 확정한 값이라 흔들리지 않으므로, 원문 매칭을
 * 건너뛰고 TM 전량을 체크리스트로 돌리는 편이 강하다.
 *
 * 대소문자를 구분한다 — 이 계열의 실제 사고가 케이싱 드리프트였다.
 * "Happy Shopping!" 은 정본 "Happy shopping!" 과 다르고, 무시하면 그대로 통과한다.
 *
 * 사용:
 *   node scripts/tm-audit.js --file <번역문.txt>
 *   cat 번역문.txt | node scripts/tm-audit.js
 *
 *   --file    번역문 (생략 시 stdin). "N<TAB>text" 형태의 세그먼트 줄도 그대로 받는다.
 *   --files   감사할 TM 파일 (콤마 목록). 생략하면 _index.json 의 kind=sentence_tm 전부.
 *   --json    결과를 JSON 으로 (기본은 사람용 목록).
 *
 * 출력: 미검출 문장 목록. **미검출 = 드리프트 확정이 아니다** — 이번 회차에 그 섹션이
 * 없으면 당연히 안 나온다. 둘을 가르는 판단은 사람 몫이고, 원문을 보면 즉시 갈린다.
 * exit 는 항상 0 (경고지 실패가 아니다). 대상 TM 이 0개면 exit 2.
 *
 * 의존성 없음 (Node 내장만). 이 저장소만 clone 해도 그대로 돌아간다.
 */

"use strict";
const fs = require("fs");
const path = require("path");

// 기본값은 이 저장소 루트. 다른 스킬 폴더를 감사하려면 PUBG_SKILL_DIR 로 덮어쓴다.
const SKILL_DIR = process.env.PUBG_SKILL_DIR
  ? path.resolve(process.env.PUBG_SKILL_DIR)
  : path.resolve(__dirname, "..");

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

/**
 * 감사 대상 수집 — 문장 TM 은 *원문 적중분이 아니라 파일 전량* 을 체크리스트로 돌린다.
 * deprecated 항목과 target 중복은 건너뛴다.
 */
function collectSentenceTm(glossaryFiles, skillDir) {
  const index = readJsonSafe(path.join(skillDir, "glossary", "_index.json"));
  const tmFiles = (index?.files || [])
    .filter((f) => f.kind === "sentence_tm" && (!glossaryFiles || glossaryFiles.includes(f.filename)))
    .map((f) => f.filename);

  const seen = new Set();
  const rows = [];
  for (const fn of tmFiles) {
    const data = readJsonSafe(path.join(skillDir, "glossary", fn));
    for (const t of data?.terms || []) {
      if (t.status === "deprecated" || seen.has(t.target)) continue;
      seen.add(t.target);
      rows.push({ docTerm: t.source, expected: t.target, docType: t.doc_type || null, file: fn });
    }
  }
  return rows;
}

/**
 * 도착어 대조. 문장 TM 은 대소문자를 구분하고, 알파벳이 없는 정본(숫자·기호만)은
 * 어차피 케이싱 개념이 없으므로 같은 경로로 처리된다.
 */
function auditLockedTerms(rows, tgtJoined) {
  const hay = tgtJoined.normalize("NFC");
  const misses = [];
  for (const r of rows) {
    if (!hay.includes(r.expected.normalize("NFC"))) {
      misses.push({ docTerm: r.docTerm, expected: r.expected, docType: r.docType });
    }
  }
  return misses;
}

function parseArgs(argv) {
  const a = { file: null, files: null, json: false };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--file") a.file = argv[++i];
    else if (t === "--files") a.files = (argv[++i] || "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (t === "--json") a.json = true;
  }
  return a;
}

function main() {
  // head 등으로 파이프가 먼저 닫히는 건 정상 종료다 (EPIPE 스택 노출 방지)
  process.stdout.on("error", (e) => {
    if (e.code === "EPIPE") process.exit(0);
    throw e;
  });

  const a = parseArgs(process.argv);
  let raw;
  try {
    raw = a.file ? fs.readFileSync(a.file, "utf8") : fs.readFileSync(0, "utf8");
  } catch (e) {
    console.error(`[tm-audit] 번역문을 읽지 못했다: ${e.message}`);
    process.exit(2);
  }
  if (!raw.trim()) {
    console.error("usage: node scripts/tm-audit.js --file <번역문.txt> [--files a.json,b.json] [--json]");
    process.exit(2);
  }

  // 세그먼트 추출기의 "N<TAB>text" 접두를 떼고 한 덩어리로
  const hay = raw
    .split("\n")
    .map((l) => l.replace(/^\d+\t/, "").replace(/\\n/g, "\n"))
    .join("\n");

  const rows = collectSentenceTm(a.files, SKILL_DIR);
  if (!rows.length) {
    console.error(
      `[tm-audit] 감사 대상 문장 TM 0건 — ${path.join(SKILL_DIR, "glossary", "_index.json")} 에 kind:sentence_tm 파일이 있는지 확인.`
    );
    process.exit(2);
  }

  const misses = auditLockedTerms(rows, hay);

  if (a.json) {
    process.stdout.write(JSON.stringify({ checked: rows.length, misses }, null, 2) + "\n");
  } else {
    for (const m of misses) {
      process.stdout.write(`MISS\t${m.docType || "-"}\t${m.expected}\t${m.docTerm}\n`);
    }
  }
  console.error(
    `[tm-audit] 정본 ${rows.length}개 중 미검출 ${misses.length}건 — 이번 회차에 없는 섹션인지, 재번역 드리프트인지는 원문 대조로 가른다.`
  );
}

if (require.main === module) main();
module.exports = { parseArgs, collectSentenceTm, auditLockedTerms };
