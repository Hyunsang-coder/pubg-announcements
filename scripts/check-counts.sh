#!/usr/bin/env bash
# check-counts.sh — 세 곳에 중복된 수치가 실측과 맞는지 검사한다.
#
# 수치가 사는 곳:
#   1. glossary/_index.json — files[].term_count · total_terms · total_categories
#   2. SKILL.md — 섹션 제목의 (N개) 와 분류별 개수 표
#   3. 실제 JSON 파일의 terms 배열 길이  ← 이것이 정본
#
# 자동 채번·자동 동기화가 없는 저장소라 이 셋은 손으로 맞춰야 한다. 이 스크립트는
# 어긋난 곳을 짚어줄 뿐 고치지 않는다 — 어느 쪽이 맞는지는 사람이 판단한다.
#
# 호출: bash scripts/check-counts.sh
# 종료 코드: 0 = 전부 일치, 1 = 불일치 있음, 2 = 전제 조건 실패(jq 없음 등)

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

command -v jq >/dev/null 2>&1 || { echo "[check-counts] jq 가 필요하다: brew install jq" >&2; exit 2; }

fail=0
ok()   { printf '  ok    %s\n' "$1"; }
bad()  { printf '  FAIL  %s\n' "$1"; fail=1; }

cmp_num() { # cmp_num <라벨> <기대> <실측>
  if [[ "$2" == "$3" ]]; then ok "$1 = $3"; else bad "$1: _index/SKILL.md 는 $2, 실측은 $3"; fi
}

echo "== JSON 파싱 =="
for f in glossary/*.json references/*.json; do
  if jq empty "$f" 2>/dev/null; then ok "$f"; else bad "$f 파싱 실패"; fi
done

echo
echo "== _index.json 카운트 =="
total_actual=0
while IFS=$'\t' read -r fn declared; do
  actual="$(jq -r '.terms | length' "glossary/$fn" 2>/dev/null || echo "?")"
  cmp_num "$fn term_count" "$declared" "$actual"
  [[ "$actual" =~ ^[0-9]+$ ]] && total_actual=$((total_actual + actual))
done < <(jq -r '.files[] | "\(.filename)\t\(.term_count)"' glossary/_index.json)

cmp_num "total_terms" "$(jq -r '.total_terms' glossary/_index.json)" "$total_actual"
cmp_num "total_categories" \
        "$(jq -r '.total_categories' glossary/_index.json)" \
        "$(jq -r '.categories | length' glossary/_categories.json)"

echo
echo "== category_id 가 _categories.json 에 정의돼 있는가 =="
for fn in $(jq -r '.files[].filename' glossary/_index.json); do
  while read -r cid; do
    [[ -z "$cid" ]] && continue
    defined="$(jq -r --arg c "$cid" --arg f "$fn" \
      '[.categories[] | select(.id == $c and .file == $f)] | length' glossary/_categories.json)"
    if [[ "$defined" == "1" ]]; then ok "$fn / $cid"
    else bad "$fn / $cid — _categories.json 에 (id=$cid, file=$fn) 정의 없음"; fi
  done < <(jq -r '[.terms[].category_id] | unique | .[]' "glossary/$fn")
done

echo
echo "== SKILL.md 의 수치 =="
# sed 는 BSD/GNU 방언 차가 있어 (\+ · 구분자 충돌) awk 로 뽑는다.
skill_num() { # skill_num <파일명> → 섹션 제목의 (N개)
  awk -v f="$1" '
    index($0, "`" f "`") && match($0, /\([0-9]+개\)/) {
      s = substr($0, RSTART + 1, RLENGTH - 2); sub(/개$/, "", s); print s; exit
    }' SKILL.md
}
cmp_num "SKILL.md announcements.json (N개)" \
        "$(skill_num 'glossary/announcements.json')" \
        "$(jq -r '.terms | length' glossary/announcements.json)"
cmp_num "SKILL.md proper_nouns.json (N개)" \
        "$(skill_num 'glossary/proper_nouns.json')" \
        "$(jq -r '.terms | length' glossary/proper_nouns.json)"
cmp_num "SKILL.md notation.json (N개)" \
        "$(skill_num 'references/notation.json')" \
        "$(jq -r '.rules | length' references/notation.json)"

echo
echo "== SKILL.md 분류별 개수 표 =="
while IFS=$'\t' read -r cid declared; do
  actual="$(jq -r --arg c "$cid" '[.terms[] | select(.category_id == $c)] | length' glossary/announcements.json)"
  cmp_num "표 / $cid" "$declared" "$actual"
done < <(awk -F'|' '
  /^\| *`[a-z_]+` *\| *[0-9]+ *\|/ {
    cid = $2; n = $3
    gsub(/[` ]/, "", cid); gsub(/ /, "", n)
    print cid "\t" n
  }' SKILL.md)

echo
echo "== 조회면(lean) 신선도 =="
# 생성물이 원본 JSON 과 어긋나면 번역 중에 읽는 쪽이 낡은 값을 준다 — 카운트 불일치보다 위험하다.
if node "$ROOT/scripts/build-lean.js" --check; then :; else fail=1; fi

echo
if [[ $fail -eq 0 ]]; then
  echo "[check-counts] 전부 일치."
else
  echo "[check-counts] 불일치가 있다 — 위 FAIL 줄을 보고 손으로 맞춘다." >&2
fi
exit $fail
