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
 *   --scope   모드 전용(scope) 항목도 함께 감사한다 (예: --scope slb). 생략하면 scope 없는 전체 항목만 —
 *             모드 전용 항목이 다른 모드 번역의 MISS 로 새지 않게 하려는 것이다.
 *   --source  KR 원문 (파일). 주면 고유명사 감사를 함께 돈다 — 아래.
 *
 * 고유명사 감사 (--source): 문장 TM 은 전량을 체크리스트로 돌리지만, 고유명사는 원문에 없는 용어까지 MISS 로
 * 뜨면 잡음이라 **원문에 source 가 나오는 것만** 골라 그 target 이 번역문에 있는지 본다.
 * 우선순위는 committed scope 항목 > provisional(발행 전, 로컬) > 전체 항목이라 같은 KR 의 모드별 표기가
 * 섞이지 않는다 (예: 리콜 = 전체 Recall / scope slb revive). 대소문자·하이픈은 무시한다(문장 안 굴절 때문 —
 * carry-over ↔ carry over). 출력은 `NOUN_MISS<TAB>층<TAB>정본<TAB>원문`. **존재 검사이지 사용 검사가 아니다** —
 * 한 번 맞게 쓰고 다른 곳에서 틀려도 통과하고, 의도적 우회(오타 교정 등)는 MISS 로 뜬다. 판단은 사람이 한다.
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
function collectSentenceTm(glossaryFiles, skillDir, scope = null) {
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
      if (t.scope && t.scope !== scope) continue;
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

/**
 * 고유명사 수집 — scope 를 선언하면 그 모드 항목이 전체 항목을 덮는다.
 * 층 우선순위: committed scope > provisional(glossary/provisional, 로컬) > 전체.
 */
function collectNouns(skillDir, scope = null) {
  const index = readJsonSafe(path.join(skillDir, "glossary", "_index.json"));
  const files = (index?.files || []).filter((f) => f.kind === "terms").map((f) => f.filename);
  const bySource = new Map();
  const put = (t, layer) => bySource.set(t.source, { source: t.source, expected: t.target, layer });

  const committed = [];
  for (const fn of files) {
    for (const t of readJsonSafe(path.join(skillDir, "glossary", fn))?.terms || []) {
      if (t.status !== "deprecated") committed.push(t);
    }
  }
  for (const t of committed.filter((x) => !x.scope)) put(t, "global");

  if (scope) {
    const dir = path.join(skillDir, "glossary", "provisional");
    if (fs.existsSync(dir)) {
      for (const fn of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
        for (const t of readJsonSafe(path.join(dir, fn))?.terms || []) {
          if (t.status !== "deprecated" && t.scope === scope) put(t, `provisional:${scope}`);
        }
      }
    }
    for (const t of committed.filter((x) => x.scope === scope)) put(t, `scope:${scope}`);
  }
  return [...bySource.values()];
}

/** 원문에 나오는 고유명사만 골라 target 이 번역문에 있는지 본다. 대소문자·하이픈은 무시(굴절 때문). */
function auditNouns(nouns, krText, enText) {
  const norm = (s) => s.normalize("NFC").toLowerCase().replace(/-/g, " ");
  const kr = krText.normalize("NFC");
  const en = norm(enText);
  const present = nouns.filter((n) => kr.includes(n.source.normalize("NFC")));
  const raw = present.filter((n) => !en.includes(norm(n.expected)));

  // 짧은 용어의 MISS 는 그 등장이 전부 '충족된 더 긴 용어' 안에 들어 있으면 오탐이다
  // (전리품 상자 → deathbox 가 충족됐으면 그 안의 '전리품' → Loot Cache 는 걸지 않는다).
  // 단독으로 쓰인 자리가 하나라도 있으면 그대로 남긴다 — 존재 검사이므로 숨기는 쪽이 더 위험하다.
  const occ = (hay, needle) => (needle ? hay.split(needle).length - 1 : 0);
  const satisfied = present.filter((n) => !raw.includes(n));
  const misses = raw.filter((m) => {
    const total = occ(kr, m.source);
    let covered = 0;
    for (const s of satisfied) {
      if (s.source !== m.source && s.source.includes(m.source)) covered += occ(kr, s.source) * occ(s.source, m.source);
    }
    return covered < total;
  });
  return { checked: present.length, misses };
}

function parseArgs(argv) {
  const a = { file: null, files: null, json: false, scope: null, source: null };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--file") a.file = argv[++i];
    else if (t === "--files") a.files = (argv[++i] || "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (t === "--json") a.json = true;
    else if (t === "--scope") a.scope = argv[++i] || null;
    else if (t === "--source") a.source = argv[++i] || null;
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
    console.error("usage: node scripts/tm-audit.js --file <번역문.txt> [--source <KR원문.txt>] [--scope <id>] [--files a.json,b.json] [--json]");
    process.exit(2);
  }

  // 세그먼트 추출기의 "N<TAB>text" 접두를 떼고 한 덩어리로
  const hay = raw
    .split("\n")
    .map((l) => l.replace(/^\d+\t/, "").replace(/\\n/g, "\n"))
    .join("\n");

  const rows = collectSentenceTm(a.files, SKILL_DIR, a.scope);
  if (!rows.length) {
    console.error(
      `[tm-audit] 감사 대상 문장 TM 0건 — ${path.join(SKILL_DIR, "glossary", "_index.json")} 에 kind:sentence_tm 파일이 있는지 확인.`
    );
    process.exit(2);
  }

  const misses = auditLockedTerms(rows, hay);

  let nouns = null;
  if (a.source) {
    let kr;
    try {
      kr = fs.readFileSync(a.source, "utf8");
    } catch (e) {
      console.error(`[tm-audit] 원문을 읽지 못했다: ${e.message}`);
      process.exit(2);
    }
    nouns = auditNouns(collectNouns(SKILL_DIR, a.scope), kr, hay);
  }

  if (a.json) {
    process.stdout.write(JSON.stringify({ checked: rows.length, misses, ...(nouns ? { nouns } : {}) }, null, 2) + "\n");
  } else {
    for (const m of misses) {
      process.stdout.write(`MISS\t${m.docType || "-"}\t${m.expected}\t${m.docTerm}\n`);
    }
    for (const m of nouns?.misses || []) {
      process.stdout.write(`NOUN_MISS\t${m.layer}\t${m.expected}\t${m.source}\n`);
    }
  }
  console.error(
    `[tm-audit] 정본 ${rows.length}개 중 미검출 ${misses.length}건 — 이번 회차에 없는 섹션인지, 재번역 드리프트인지는 원문 대조로 가른다.`
  );
  if (nouns) {
    console.error(
      `[tm-audit] 원문에 나오는 고유명사 ${nouns.checked}개 중 미검출 ${nouns.misses.length}건 — 굴절·의도적 우회(오타 교정 등)일 수 있으니 원문 대조로 가른다. scope=${a.scope || "없음(전체만)"}.`
    );
    if (!a.scope) console.error("[tm-audit] scope 를 안 줬다 — 모드 전용 항목은 대조하지 않았다. 모드 전용 공지면 --scope <id> 를 준다.");
  }
}

if (require.main === module) main();
module.exports = { parseArgs, collectSentenceTm, auditLockedTerms, collectNouns, auditNouns };
