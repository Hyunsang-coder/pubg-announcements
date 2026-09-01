# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 이 저장소의 정체

**Claude Code 스킬 패키지**다. 산출물은 `SKILL.md` + JSON 데이터이고, 빌드·린트 파이프라인이 없다(검증 스크립트 둘만 있다 — 아래 "검증 명령"). 여기서의 "작업"은 거의 항상 둘 중 하나다: **번역 자산 조회**, 또는 **새 확정 문구 등록**.

내용은 PUBG out-game 공지의 **KR→EN 전용** 번역 자산이다. 117건 전부 `source_lang: ko` / `target_lang: en` 이고, 이건 항목별 속성이 아니라 저장소 불변식이다. **역방향(EN→KR)으로 쓰지 않는다** — KR 원문은 회차마다 흔들리지만 EN 정본은 고정이라, EN 에서 되짚으면 임의의 과거 변형을 집게 된다.

인게임 UI·기획서·회의록은 명시적으로 범위 밖이며, 그쪽 용어 체계를 여기로 끌어오지 않는다.

**공개 저장소다.** 그래서 두 가지가 따라온다: 근거는 발행물만 쓰고(→ "등록할 때"), 스크립트·문서는 외부 절대경로를 참조하지 않는다 — 남의 머신에서 안 돌기 때문이다.

## 계층 구조 — 읽는 순서가 곧 우선순위

네 파일이 서로 겹치지 않게 역할을 나눠 갖는다. 어떤 판단이든 이 순서로 내려간다.

1. `glossary/announcements.json` — **문장 단위 TM(70개)**. 있으면 그대로 쓴다. 재번역 금지, 가변부(날짜·서수·수치·상품명·연도)만 교체.
2. `references/notation.json` — **패턴 규칙(3개)**. 문자열이 아니라 형태라서 TM 으로 못 박는 것(날짜·기간 범위·title case).
3. `glossary/proper_nouns.json` — 공지 빈출 고유명사(23개). 인게임 표기가 정본.
4. `references/judgment.md` — 위 셋으로 안 덮이는 경우의 판단 순서와 실제 판례(선례가 갈릴 때 빈도·최근성·문법을 함께 본다).

계층에 얹히는 것들 — `references/style.json` 은 문체·골격 규칙(구조 보존·길이·클로징 맵·기밀), `references/skeletons.md` 는 유형별 섹션 골격(우선순위가 아니라 작업용 지도. `MISS` 를 드리프트와 섹션 부재로 가를 때 쓴다), `references/sources.md` 는 무엇을 근거로 쓸 수 있는지의 정책, `glossary/_categories.json` 은 `category_id` 정의다.

이 구조의 존재 이유는 하나다: **회차마다 재번역하면 표기가 흔들려 공지와 로비·상점 페이지가 어긋난다.** 새 규칙을 추가할 때도 "이건 문자열인가 패턴인가 판단인가"를 먼저 정해 해당 파일에만 넣는다 — 두 곳에 쓰면 그 자체가 드리프트 원인이 된다.

## 조회면 / 유지보수면 — 편집 방향이 한쪽이다

같은 데이터가 두 형태로 있다. **원본은 JSON 하나뿐이고, 조회면은 전부 생성물이다.**

| | 파일 | 언제 읽나 | 편집 |
|---|---|---|---|
| 조회면 | `glossary/_lean/*.tsv` · `SKILL.md` §2 고유명사 표 | 번역 중 (항상) | ❌ 생성물 |
| 유지보수면 | `glossary/announcements.json` · `proper_nouns.json` | 등록·분쟁 때만 | ✅ 여기만 |

이유는 부피가 아니라 신호 대 잡음비다. `announcements.json` 39.6KB 중 번역에 쓰이는 `source`→`target` 은 6.4KB 뿐이고 나머지는 `notes`(확정 사유)·`status`·반복 키다. 번역할 때마다 6배를 읽으면 정작 대응 관계가 묻힌다.

**등록은 JSON 에만 하고 `node scripts/build-lean.js` 로 다시 뽑는다.** TSV 나 SKILL.md 표를 손으로 고치면 다음 생성 때 덮어써진다. `check-counts.sh` 가 신선도를 검사하므로 어긋난 채로 커밋되지는 않는다.

`SKILL.md` 의 고유명사 표는 `<!-- BEGIN:proper-nouns -->` / `<!-- END:proper-nouns -->` 마커 사이에 생성된다. 마커를 지우면 빌드가 선다.

## 데이터 스키마

두 glossary 파일 모두 `{ _meta, terms[] }` 구조이고, term 필드는 `id · source · source_lang · target · target_lang · category_id · context · notes · status`. `source_lang`·`target_lang` 은 93건 전부 상수(`ko`/`en`)라 조회면에서는 뺀다.

`announcements.json` 에만 **`doc_type`** 이 추가로 있다 — `store_update` / `special_drops` / `common`. **"이 문장이 어느 공지에서 확인됐는가"** 라는 출처 표시다.

조회에는 거의 쓸 일이 없다. **70건의 `source` 가 서로 하나도 안 겹쳐서**, 원문에서 찾아 들어가는 한 유형이 달라도 헷갈릴 수 없다(클로징조차 원문이 다르다 — `즐거운 쇼핑 되시길 바랍니다` vs `전장에서 뵙겠습니다`). `doc_type` 이 일하는 자리는 **원문에 없던 자리를 채울 때** 하나다: 원문 클로징이 등록된 둘 중 어느 것도 아니면 조회는 MISS 고, 그때 유형별 클로징을 doc_type 이 답한다. **등록되지 않은 유형이면 지어내지 않는다** (`references/style.json` 의 `closing.map._unlisted`).

`id` 접두어는 doc_type 과 일치하지 않는다 — `common` 8건 중 여럿이 `store_update_*` id 를 그대로 들고 있다(중복 제거 흔적). id 로 doc_type 을 추론하지 말 것.

`category_id` 는 이 저장소 로컬 분류이고 정의는 **`glossary/_categories.json`** 에 있다(announcements 쪽 6종 · proper_nouns 쪽 7종, `file` 필드로 갈린다). 새 값을 만들기 전에 기존 값 재사용을 먼저 본다 — 분류가 흩어지면 개수 표가 의미를 잃는다. `check-counts.sh` 가 미정의 `category_id` 를 잡는다.

## 검증 명령

### TM 감사 — 확정 문장이 번역문에 살아있는지

**도착어 쪽에서** 대조한다(원문은 회차마다 조사·공백이 흔들려 매칭이 조용히 빗나간다). 대소문자를 구분한다 — `Happy Shopping!` 은 정본 `Happy shopping!` 과 다르다.

```bash
node scripts/tm-audit.js --file <번역문.txt>
```

의존성 없이(Node 내장만) 이 저장소 안에서 돈다. 출력은 `MISS<TAB>doc_type<TAB>정본<TAB>원문`.

`MISS` 는 **드리프트 후보**지 오류 확정이 아니다 — 이번 회차에 그 섹션이 없으면 당연히 안 나온다. 둘을 가르는 건 사람이 하되, `references/skeletons.md` 로 이번 회차의 블록을 먼저 표시해두면 빨리 갈린다. exit code 는 항상 0(대상 TM 이 0건이면 2).

### 카운트·분류 정합

```bash
bash scripts/check-counts.sh
```

JSON 파싱 · `_index.json` 카운트 3종 · `category_id` 가 `_categories.json` 에 정의돼 있는지 · `SKILL.md` 의 섹션 제목 수치와 분류별 개수 표까지 한 번에 본다. 불일치면 exit 1 이고, **고치지는 않는다** — 어느 쪽이 맞는지는 사람이 판단한다.

수치가 **세 곳**에 중복돼 있다: `_index.json` 의 `files[].term_count` · `total_terms` · `total_categories`, 그리고 `SKILL.md` 본문의 개수 표(분류별 개수 포함)와 섹션 제목. 자동 동기화가 없으므로 등록 후 셋 다 손으로 갱신하고 위 스크립트로 확인한다. id 채번도 자동이 아니다 — 기존 최대치+1 을 실측해 쓴다.

### 코퍼스 — 근거를 세는 도구

```bash
node scripts/fetch-announcement.js      # corpus.json 의 회차를 .corpus/ 로 (gitignore)
node scripts/corpus-stats.js --audit    # 등록 정본이 몇 회차에 나오는가
node scripts/corpus-stats.js --mine --min 5 --doc-type store_update
node scripts/corpus-stats.js --conflicts    # 표기가 갈린 자리 (빈도 우선, 동률이면 최신)
node scripts/fetch-announcement.js --verify # 로컬 본문이 등록 근거 판본과 같은가
```

`--mine` 이 이 저장소를 키우는 방법이다 — 미등록인데 여러 회차에 반복되는 줄을 뽑는다. **후보지 확정이 아니다**: 반복은 굳었다는 증거가 아니라 같은 사람이 계속 썼다는 증거일 수도 있다(judgment.md "번역자가 만든 라벨을 의심한다").

`.corpus/` 는 커밋하지 않는다. 공지 전문은 PUBG 저작물이고 이 저장소는 문장 단위 대응을 담는 곳이다. 커밋하는 건 `references/corpus.json` 의 회차 id 뿐이다.

> **주의**: 상류 trans_agent 의 `sync-glossary-index.js` · `add-term.js` 에 의존하지 않는다. 이 저장소의 검증은 위 두 스크립트로 자립한다(공개 배포 대상이라 외부 경로를 참조하면 남의 머신에서 안 돈다).

## 상류 관계 — trans_agent/pubg-context

이 저장소는 **`trans_agent/.claude/skills/pubg-context` 에서 공개 가능한 부분만 추려낸 파생본**이다.

- `glossary/announcements.json` = 상류 `pubg_store_update.json`(20) + `pubg_special_drops.json`(50) 에서 중복 3건을 `common` 으로 합쳐 67건으로 출발했다(이후 발행분 대조로 추가 등록). target 문자열은 전부 동일하다.
- `glossary/proper_nouns.json` = 상류 `pubg_br.json` 에서 발행 공지에 실제 등장한 것만 추려 18건으로 출발했다.
- 상류의 `project` 필드는 빼고 `doc_type` 을 새로 넣었으며, `announcement_boilerplate` 단일 분류를 6종으로 다시 갈랐다.
- `notation.json` 의 `_meta.upstream` 이 명시하듯 **사내 룰셋이 정본**이고 갈리면 이쪽을 맞춘다.

두 저장소를 동시에 만질 일이 생기면 상류를 먼저 고치고 여기로 내리는 방향을 지킨다. 반대 방향은 공개 판정을 우회하게 된다.

## 등록할 때

1. **근거는 발행물만** — PUBG 공식 홈페이지 발행 공지의 KR/EN 대조. 사내 문서·기획서·초안은 근거로 쓰지 않는다.
   대조본은 **로케일만 갈아 끼워** 얻는다(`ko` ↔ `en`. `kr` 은 404). 경로가 유형에 따라 다르다 — Store Update·콜라보는 `/<locale>/news/<id>`, Special Drops 는 `/<locale>/events/notice/<id>`. 회차 목록은 `references/corpus.json`, 자세한 건 `references/sources.md`.
2. **공개 판정 한 줄**: 발행된(또는 발행 예정인) 공지 문구 = 공개 가능 / 그 문구를 확정한 내부 경로 = 비공개. 위키 페이지 ID·스페이스 키·팀 약어·내부 코드명·마일스톤 번호·협력사명·미발표 일정은 `notes` 에도 남기지 않는다.
3. **근거는 "몇 개 회차를 대조했는가"까지만** 적는다 (`"24개 공지 실측 15:1 로 확정(소수형 'End of Sales Date' 는 반려)."`). 회차 특정이 필요하면 공지 제목 + 발행 연월(`2026-09 Store Update`).
4. 표기가 갈렸으면 다수형을 등록하고 **소수형과 반려 이유를 `notes` 에 남긴다** — 그게 다음 판단의 근거가 된다.
5. `source` 는 선행 기호(`※` · `*`)를 뗀 형태로 등록한다.
6. id 는 `<doc_type 접두어>_<번호>` 로 채번하되 상류와 충돌하지 않게 기존 최대치+1 을 쓴다.
7. `category_id` 는 `glossary/_categories.json` 의 기존 값을 재사용한다. 등록을 마치면 `bash scripts/check-counts.sh` 로 수치·분류를 확인하고, 새 유형의 골격이 생겼으면 `references/skeletons.md` 에 추가한다.

미확정 고유명사는 **추측해서 만들지 않는다** — 한 번 발행되면 그게 선례가 된다. 확인을 받고 등록한다.

## 문서 언어

SKILL.md · judgment.md · sources.md · 모든 JSON 의 `_meta` 와 `notes` 가 한국어다. 새로 쓰는 설명·notes 도 한국어로 맞춘다. 영어는 `target` 값과 규칙 예시에만 들어간다.
