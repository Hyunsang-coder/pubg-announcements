#!/usr/bin/env node
/**
 * check-scopes.js — scope · provisional 정합을 검사한다. check-counts.sh 가 부른다.
 *
 * 왜: 같은 KR 이 모드에 따라 다르게 옮겨지는 자리(scope)와, 발행 전이라 임시인 항목(provisional)을
 * 스키마에 허용하면 두 가지가 조용히 망가진다.
 *   - 같은 source 에 다른 target 이 scope 구분 없이 공존하면 어느 쪽이 맞는지 조회가 못 가른다.
 *   - 임시 표기가 committed 파일에 섞이면 그게 곧 선례가 된다 (등록 원칙: 미확정은 추측해서 만들지 않는다).
 *
 * 검사 (FAIL = exit 1, warn 은 exit 에 영향 없음):
 *   1. 쓰인 scope 는 glossary/_scopes.json 에 정의돼 있어야 한다.
 *   2. committed(glossary/*.json)에는 status=provisional 이 없어야 한다.
 *   3. provisional(glossary/provisional/*.json)은 status=provisional · scope 필수 · evidence=pre_release.
 *   4. 같은 source 에 target 이 둘 이상이면 scope 가 서로 달라야 한다 (전체 = 빈 scope).
 *   5. [warn] provisional 이 committed 와 같은 (source, target) 이면 승격이 끝난 것이니 provisional 에서 지운다.
 *   6. [warn] scope 항목이 전체 항목과 같은 target 이면 scope 가 불필요하다.
 *
 * 사용: node scripts/check-scopes.js [--root <디렉터리>]   (--root 는 픽스처 검증용. 기본은 이 저장소)
 * 의존성 없음 (Node 내장만).
 */

"use strict";
const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);
const ROOT = argv.includes("--root") ? path.resolve(argv[argv.indexOf("--root") + 1]) : path.resolve(__dirname, "..");

let failed = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const bad = (m) => { console.log(`  FAIL  ${m}`); failed = 1; };
const warn = (m) => console.log(`  warn  ${m}`);

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadCommitted() {
  const out = [];
  for (const fn of ["announcements.json", "proper_nouns.json"]) {
    const p = path.join(ROOT, "glossary", fn);
    if (!fs.existsSync(p)) continue;
    for (const t of readJson(p).terms) out.push({ ...t, _file: fn, _provisional: false });
  }
  return out;
}

function loadProvisional() {
  const dir = path.join(ROOT, "glossary", "provisional");
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const fn of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    for (const t of readJson(path.join(dir, fn)).terms) out.push({ ...t, _file: `provisional/${fn}`, _provisional: true });
  }
  return out;
}

function main() {
  const scopesPath = path.join(ROOT, "glossary", "_scopes.json");
  const defined = new Set(fs.existsSync(scopesPath) ? readJson(scopesPath).scopes.map((s) => s.id) : []);
  const committed = loadCommitted().filter((t) => t.status !== "deprecated");
  const prov = loadProvisional().filter((t) => t.status !== "deprecated");
  const all = [...committed, ...prov];

  // 1. scope 정의
  const undef = all.filter((t) => t.scope && !defined.has(t.scope));
  if (undef.length) for (const t of undef) bad(`scope "${t.scope}" 가 _scopes.json 에 정의돼 있지 않다 — ${t._file} / ${t.source}`);
  else ok(`쓰인 scope ${new Set(all.filter((t) => t.scope).map((t) => t.scope)).size}종 모두 정의됨`);

  // 2. committed 에 provisional 금지
  const leaked = committed.filter((t) => t.status === "provisional");
  if (leaked.length) for (const t of leaked) bad(`committed 파일에 provisional 항목이 있다 — ${t._file} / ${t.source}. glossary/provisional/ 로 옮긴다.`);
  else ok("committed 파일에 provisional 항목 없음");

  // 3. provisional 형식
  let provBad = 0;
  for (const t of prov) {
    const why = [];
    if (t.status !== "provisional") why.push(`status=${t.status} (provisional 이어야 함)`);
    if (!t.scope) why.push("scope 없음");
    if (t.evidence !== "pre_release") why.push(`evidence=${t.evidence} (pre_release 여야 함)`);
    if (why.length) { bad(`${t._file} / ${t.source} — ${why.join(", ")}`); provBad++; }
  }
  if (!provBad) ok(`provisional ${prov.length}건 형식 정상`);

  // 4. 같은 source 의 target 충돌
  const bySource = new Map();
  for (const t of all) {
    if (!bySource.has(t.source)) bySource.set(t.source, []);
    bySource.get(t.source).push(t);
  }
  let conflicts = 0;
  for (const [source, ts] of bySource) {
    const targets = new Set(ts.map((t) => t.target));
    if (targets.size < 2) continue;
    // 같은 scope(빈 scope 포함) 안에서 target 이 갈리면 조회가 못 가른다
    const byScope = new Map();
    for (const t of ts) {
      const k = t.scope || "";
      if (!byScope.has(k)) byScope.set(k, new Set());
      byScope.get(k).add(t.target);
    }
    for (const [k, set] of byScope) {
      if (set.size > 1) {
        bad(`"${source}" 가 ${k ? `scope=${k}` : "전체"} 안에서 target 이 갈린다: ${[...set].join(" / ")}`);
        conflicts++;
      }
    }
  }
  if (!conflicts) ok(`source 충돌 없음 (다른 target 은 scope 로 갈려 있음)`);

  // 5. provisional 승격 완료
  for (const t of prov) {
    const hit = committed.find((c) => c.source === t.source && c.target === t.target && (c.scope || "") === (t.scope || ""));
    const hitGlobal = committed.find((c) => c.source === t.source && c.target === t.target && !c.scope);
    if (hit || hitGlobal) warn(`"${t.source}" → "${t.target}" 는 이미 committed 에 있다 — 승격이 끝났으니 provisional 에서 지운다.`);
  }

  // 6. 불필요한 scope
  for (const t of committed.filter((x) => x.scope)) {
    const g = committed.find((c) => c.source === t.source && !c.scope && c.target === t.target);
    if (g) warn(`scope=${t.scope} "${t.source}" 가 전체 항목과 target 이 같다 — scope 가 필요 없다.`);
  }

  if (failed) process.exit(1);
}

main();
