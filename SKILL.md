---
name: pubg-announcements
description: PUBG 라이브 out-game 공지를 한국어에서 영어로 번역할 때 쓰는 확정 문구·표기 규칙·스타일 모음. 회차마다 그대로 반복되는 고정 문구 TM(Store Update·Special Drops 기준), 법률·규정 고지, 섹션 헤더, 공지 빈출 고유명사, 날짜·기간·대소문자 표기 규칙, 그리고 선례가 갈릴 때의 판단 기준을 담는다. 상점 안내, 스토어 업데이트, Store Update, 스페셜 드롭, Special Drops, 콜라보레이션 공지, 이벤트 안내, 패치노트 공지 번역 키워드에 트리거된다. 공지 문구를 새로 번역하기 전에 반드시 이 스킬의 확정 문자열을 먼저 확인할 것 — 재번역은 표기 흔들림을 만든다.
---

# PUBG out-game 공지 번역

플레이어에게 발행되는 공지의 번역 자산. 회차마다 같은 문장이 반복되므로, 핵심은 **번역이 아니라 재사용**이다.

## 방향 — KR → EN 전용

**이 저장소는 한국어 → 영어만 다룬다.** 117건 전부 `source_lang: ko` / `target_lang: en` 이고, 이건 항목별 속성이 아니라 저장소 불변식이다.

**역방향(EN → KR)으로 쓰지 않는다.** 자산이 부족해서가 아니라 **틀린 답을 주기 때문**이다 — KR 원문은 회차마다 조사·공백·마침표가 흔들리지만 EN 정본은 고정이다(도착어 쪽에서 감사하는 이유가 그것). EN 에서 되짚으면 여러 KR 변형 중 임의의 하나, 그것도 과거 회차 것을 집게 된다. EN → KR 요청을 받으면 이 스킬을 쓰지 말고 그렇게 말한다.

## 범위

**안**: 플레이어에게 발행되는 out-game 공지.
**밖**: 인게임 UI · 기획서 · 회의록 · 내부 문서 — 다른 용어 체계다.

확정 문구가 실제로 쌓인 공지 유형은 **Store Update** 와 **Special Drops** 둘이다. 콜라보·이벤트 등 다른 유형에도 이 스킬을 쓰되, 적용되는 것은 **`common` 문구 + 표기 규칙 + 스타일 + 판단 기준**까지다. **그 유형 전용 문구를 지어내지 않는다** — 특히 클로징(§4).

---

## 작업 절차 — 공지 한 편을 번역할 때

권위 순서(뭐가 이기나)가 아니라 **작업 순서**다. 위에서부터 그대로 따른다.

0. **처음이거나 형식이 헷갈리면** `references/example-store-update.md` 를 먼저 읽는다 — 발행분 한 편의 KR/EN 대조다.
1. **유형 판정** → `references/skeletons.md` 를 읽고 이번 회차에 있는 블록을 표시해둔다. Special Drops 는 회차마다 이벤트형(주간 릴레이·빙고·출석·친구 초대)이 갈리므로 이 표시가 나중에 6번에서 쓰인다.
2. **`glossary/_lean/announcements.tsv` 를 통째로 읽는다.** 조회용 압축본이라 통독해도 부담이 없다. 원문 문장마다 **정확 일치**를 찾는다.
3. **일치분** — 그대로 붙이고 가변부(날짜·서수·수치·상품명·연도)만 교체한다. **다시 번역하지 않는다.**
4. **불일치분** — `references/notation.json`(날짜·기간·대소문자) → `references/style.json`(문체·구조·길이) → `references/judgment.md`(선례가 갈릴 때) 순으로 내려간다.
5. **막히면 멈춘다** — 미등록 고유명사, 등록되지 않은 유형의 클로징은 **지어내지 말고 확인을 받는다.** 한 번 발행되면 그게 선례가 된다.
6. **검증** — `node scripts/tm-audit.js --file <번역문.txt>`. `MISS` 를 1번에서 표시한 블록과 대조한다: **표시한 블록의 MISS = 드리프트 후보 / 표시 안 한 블록의 MISS = 이번 회차에 없는 섹션.**

`notes`·근거·확정 사유가 필요할 때만 원본 `glossary/announcements.json` 을 연다(39.6KB). 번역 중에는 필요 없다.

재번역하면 표기가 흔들리고, 공지와 로비·상점 페이지가 어긋난다. 그게 이 스킬이 존재하는 이유다.

---

## 1. 확정 문구 (70개) — 조회는 `glossary/_lean/announcements.tsv`, 원본은 `glossary/announcements.json`

문장 단위 TM. **가변부(날짜·서수·수치·상품명·연도)만 갈아 끼운다.**

**번역 중에는 lean 쪽만 읽는다** — `doc_type · category · source · target` 4열, 9.8KB. 원본 JSON 은 39.6KB 인데 그 차이는 전부 `notes`(확정 사유)·`status`·반복되는 JSON 키다. 번역에 필요 없고, 오히려 `source → target` 대응을 묻는다. lean 은 생성물이라 **손으로 편집하지 않는다**(`scripts/build-lean.js`).

| 분류 | 개수 | 무엇 |
|---|---|---|
| `section_header` | 23 | 섹션 헤더·라벨 (신규 아이템과 스킨 → New Items and Skins) |
| `legal_notice` | 17 | 법률·규정·조건 고지 (지역 판매 제한, 확률 고지, 참여 조건, 초기화 안내) |
| `mission_phrase` | 18 | 미션·안내 문장 (Special Drops 계열) |
| `boilerplate` | 7 | 인사·클로징·서명 |
| `product_label` | 3 | 상품명 접미·할인 술부 |
| `period_phrase` | 2 | 기간 표기 조각 (라이브 서버 점검 완료 후 → after live server maintenance) |

**`doc_type` 은 "이 문장이 어느 공지에서 확인됐는가"** 다 — `store_update` / `special_drops` / `common`(두 유형이 같이 쓰는 것).

조회할 때는 신경 쓸 일이 거의 없다. **70건의 `source` 는 서로 하나도 안 겹치므로**, 원문에서 찾아 들어가는 한 doc_type 이 달라도 헷갈릴 수 없다. 클로징조차 원문이 다르다 — `즐거운 쇼핑 되시길 바랍니다` vs `전장에서 뵙겠습니다`.

`doc_type` 이 실제로 일하는 자리는 하나다: **원문에 없던 자리를 채울 때.** 원문 클로징이 등록된 둘 중 어느 것도 아니면 조회는 MISS 고, 그때 "이 공지 유형의 클로징은 무엇인가"를 doc_type 이 답한다 — `store_update` = `Happy shopping!` / `special_drops` = `Happy Drops!`. **등록되지 않은 유형이면 지어내지 말고 확정을 받는다.**

### 법률·규정 고지는 특별 취급

`legal_notice` 항목은 **한정어를 빼거나 범위를 바꾸지 않는다.** 지역 제한·자격 조건·확률 고지는 문구가 곧 고지 의무다.
UI 경로가 들어간 고지(확률 보기 페이지 등)는 **인게임 표기가 정본**이고, 예뻐 보이는 대안으로 바꾸지 않는다.

## 2. 고유명사 (47개) — 아래 표가 전량. 원본은 `glossary/proper_nouns.json`

발행 공지에 실제 등장한 인게임 고유명사만 담았다. 47건이라 **파일을 열 필요 없이 여기서 바로 쓴다.**

<!-- BEGIN:proper-nouns (생성물 — scripts/build-lean.js) -->

| KR | EN |
|---|---|
| 피해량 | Damage |
| 경쟁전 | Ranked |
| 관전 | Spectating |
| 생존 레벨 | Survival Level |
| 서바이벌 레벨 | Survival Level |
| 패스 XP | Pass XP |
| 기록 파일 | Record File |
| 도안 | Imprint |
| 밀수품 상자 | Contraband Crate |
| 밀수품 쿠폰 | Contraband Coupon |
| 보급 전리품 | Supply Loot Cache |
| 붕대 | Bandages |
| 성장형 무기 스킨 | Progressive weapon skin |
| 열쇠 | Key |
| 열쇠 조각 | Key Fragment |
| 장인 토큰 | Artisan Token |
| 전리품 | Loot Cache |
| 전리품 조각 | Loot Cache Fragment |
| 최고급 꾸러미 | Prime Parcel |
| 크로마 | Chroma |
| 화물 | Cargo |
| 화물 티켓 | Cargo Ticket |
| 듀오 | Duo |
| 스쿼드 | Squad |
| 기록보관소 상자 | Archivist's Chest |
| 나만의 상점 | Your Shop |
| 보급고 | Supply Bay |
| 서바이버 상자 | Survivor's Chest |
| 서바이버 패스 | Survivor Pass |
| 스크랩 브로커 | Scrap Broker |
| 스텝 업 팩 | Step Up Pack |
| 은신처 | Hideout |
| 이벤트 패스 | Event Pass |
| 일반 분해 | Regular Disassembly |
| 일반 제작 | Regular Crafting |
| 전리품 팩 | Loot Cache Pack |
| 제작소 | Workshop |
| 제작소 패스 | Crafter Pass |
| 크레딧 | Credits |
| 특수 분해 | Special Disassembly |
| 특수 제작 | Special Crafting |
| 헌터 상자 | Hunter's Chest |
| 무기 수집가 | Weapon Collector |
| 수집가 | The Collector |
| 추천 코드 | referral code |
| 커스텀 로비 스킨 | Custom Lobby Skin |
| 탈 것 | Vehicle |

<!-- END:proper-nouns -->

등록형은 기본형이고, 문장 안에서 수·관사는 영어 문법에 맞춘다(탈 것 → Drive **vehicles**, 경쟁전 → in **Ranked Mode**).
`생존 레벨`·`서바이벌 레벨` 은 같은 것을 가리키는 KR 원문 변형이고 EN 은 `Survival Level` 로 고정이다.
**미등록 고유명사는 추측해서 만들지 않는다** → `references/judgment.md`.

## 3. 표기 규칙 — `references/notation.json` (3개)

문자열이 아니라 패턴이라 TM 으로 못 박는 것들.

- `event-date-format-en` — 월 풀네임 · 앞자리 0 없는 일 · 연도 후치 · `Week 1` 공백 · 단위 붙여쓰기 🔴
- `event-period-range-format-en` — 기간 양끝 형태와 구분자 ` - ` · 플랫폼 라벨 `PC:` 🔴
- `announcement-title-case-en` — 헤더·상품명은 title case, 전량 대문자 금지 🟡

## 4. 스타일 — `references/style.json`

문체·골격·구조 보존·길이·기밀. 요약하면: **원문 구조(※·괄호·이탤릭·순서)는 보존하고, 문장 안쪽은 영어 기준으로 쓴다.**

## 5. 판단 기준 — `references/judgment.md`

위 넷으로 안 덮이는 경우. 선례가 갈릴 때(빈도 vs 최근성 vs 문법), 원문 한정어를 살릴지, 직역 대신 관용역을 쓸 자리, 인게임 문자열 우선, 업계 은어 회피, 미등록 고유명사 처리.

## 6. 완역 예시 — `references/example-store-update.md`

발행분 한 편(2025-07 Store Update, news/8875)의 KR/EN 대조. **규칙이 실제 문서에서 어떻게 붙는지**를 본다. 처음 번역하거나 형식이 헷갈릴 때 이걸 먼저 읽는다.

여기서만 알 수 있는 것들: KR 원문에 `(UTC)` 가 없어도 EN 헤더는 `Sales Period (UTC)` 인 것 · 시각의 KST→UTC 환산 · **확률형 아이템 고지는 KR 전용이라 EN 에 안 나가는 것** · **약관 조항 번호는 언어판마다 달라서 그대로 옮기면 안 되는 것**.

## 7. 골격 — `references/skeletons.md`

우선순위 계층이 아니라 **작업용 지도**다. 유형별로 어떤 섹션이 어떤 순서로 오는지 한 장에 모아둔 것.

번역 전에 훑어서 이번 회차에 있는 블록을 표시해두면, 번역 후 `MISS` 를 **드리프트 후보**와 **이번 회차에 없는 섹션**으로 가를 수 있다. Special Drops 는 회차마다 이벤트형(주간 릴레이·빙고·출석·친구 초대)이 갈리므로 특히 필요하다.

---

## 번역 후 확인 — 도착어 쪽에서

확정 문장이 번역문에 **그대로 살아있는지** 도착어에서 대조한다. 원문 쪽으로 대조하면 회차마다 조사·공백이 흔들려 매칭이 조용히 빗나간다.

```
node scripts/tm-audit.js --file <번역문.txt>
```

의존성 없이(Node 내장만) 이 저장소 안에서 그대로 돈다. 출력은 `MISS<TAB>doc_type<TAB>정본<TAB>원문`.

`MISS` 는 **드리프트 후보**지 확정 오류가 아니다 — 이번 회차에 그 섹션이 없으면 당연히 안 나온다. 둘을 가르는 건 사람이 하고, `references/skeletons.md` 로 이번 회차의 블록을 먼저 표시해두면 훨씬 빨리 갈린다. `doc_type` 열로 다른 유형의 노이즈를 걸러낼 수도 있다.

대소문자까지 본다: `Happy Shopping!` 은 정본 `Happy shopping!` 과 다르다.

---

## 등록·갱신

새 회차 공지가 발행되면 확정된 문구를 등록해 다음 회차가 흔들리지 않게 한다.

- 근거는 **발행물만** — 출처 정책과 공개 판정 기준은 `references/sources.md`.
- 표기가 갈렸으면 다수형을 등록하고 **소수형과 반려 이유를 `notes` 에 남긴다.** 그게 다음 판단의 근거가 된다.
- `category_id` 는 `glossary/_categories.json` 에 정의된 값을 재사용한다. 새 값을 만들면 분류가 흩어져 개수 표가 의미를 잃는다.
- 등록은 **원본 JSON 에만** 한다. `glossary/_lean/*.tsv` 와 §2 의 고유명사 표는 생성물이라 손대지 않는다.
- 등록 후 조회면을 다시 생성하고 수치를 검사한다:

```
node scripts/build-lean.js && bash scripts/check-counts.sh
```
