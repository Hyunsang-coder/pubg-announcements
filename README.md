# pubg-announcements

PUBG out-game 공지(Store Update · Special Drops 등)를 **한국어 → 영어**로 번역할 때 쓰는 Claude Code 스킬.

실행 코드가 아니라 **번역 자산**이다. 확정 문구 TM 70건, 공지 빈출 고유명사 23건, 표기 규칙 3건, 그리고 애매할 때의 판단 기준.

> **KR → EN 전용이고, 역방향으로는 쓰지 않는다.**
> 자산이 부족해서가 아니라 틀린 답을 주기 때문이다 — KR 원문은 회차마다 조사·공백이 흔들리지만 EN 정본은 고정이다. EN 에서 되짚으면 여러 KR 변형 중 임의의 하나, 그것도 과거 회차 것을 집게 된다.

## 왜 있는가

공지는 회차마다 같은 문장이 반복된다. 매번 새로 번역하면 표기가 조금씩 흔들리고, 그러면 **공지와 로비·상점 페이지가 어긋난다.** 플레이어는 기간이나 조건을 오독하고, 인게임에서 길을 못 찾는다.

그래서 이 스킬의 핵심은 번역이 아니라 **재사용**이다. 확정된 문장은 그대로 쓰고 가변부(날짜·서수·수치·상품명·연도)만 갈아 끼운다.

## 설치

Claude Code 스킬 디렉터리에 링크한다.

```bash
git clone https://github.com/Hyunsang-coder/pubg-announcements.git
ln -s "$(pwd)/pubg-announcements" ~/.claude/skills/pubg-announcements
```

PUBG 공지 번역 관련 대화에서 자동으로 트리거된다. 특정 프로젝트에서만 쓰려면 `~/.claude/skills` 대신 그 프로젝트의 `.claude/skills/` 아래에 링크한다.

## 조회면과 유지보수면

같은 데이터를 두 형태로 낸다. 번역할 때 읽는 것과, 등록·분쟁 때 읽는 것이 다르기 때문이다.

| | 언제 읽나 | 크기 |
|---|---|---|
| `glossary/_lean/*.tsv` + `SKILL.md` 인라인 표 | **번역 중 (항상)** | 21.1KB |
| `glossary/*.json` | 등록·분쟁 때만 | 47.8KB |

원본 JSON 39.6KB 중 번역에 실제로 쓰이는 `source`→`target` 은 6.4KB 뿐이고, 나머지는 `notes`(확정 사유)·`status`·반복되는 JSON 키다. 번역할 때마다 그 6배를 읽으면 토큰도 토큰이지만 정작 대응 관계가 잡음에 묻힌다.

**조회면은 생성물이라 손으로 편집하지 않는다.** 등록은 원본 JSON 에만 하고 다시 생성한다.

```bash
node scripts/build-lean.js
```

`check-counts.sh` 가 "지금 JSON 으로 다시 뽑은 것과 같은가"를 검사하므로 둘이 어긋난 채로 남지 않는다.

## 구조 — 읽는 순서가 곧 우선순위

| | 파일 | 맡는 것 |
|---|---|---|
| 1 | `glossary/announcements.json` | **확정 문장 TM (70)** — 있으면 그대로. 재번역 금지 |
| 2 | `references/notation.json` | **패턴 규칙 (3)** — 날짜·기간 범위·title case. 문자열이 아니라 형태라 TM 으로 못 박는 것 |
| 3 | `glossary/proper_nouns.json` | 공지 빈출 고유명사 (23). 인게임 표기가 정본 |
| 4 | `references/judgment.md` | 위 셋으로 안 덮이는 경우의 판단 순서와 실제 판례 |

여기에 얹히는 것:

- `references/style.json` — 문체·구조 보존·길이·클로징 맵
- `references/example-store-update.md` — **발행분 한 편의 KR/EN 완역 대조** (news/8875). 형식이 헷갈리면 여기부터
- `references/skeletons.md` — 유형별 섹션 골격 (작업용 지도)
- `references/sources.md` — 무엇을 근거로 쓸 수 있는가
- `references/corpus.json` — 대조한 회차 목록 (id·발행월·유형)
- `glossary/_categories.json` — `category_id` 정의

새 규칙을 넣을 때는 **"이건 문자열인가 패턴인가 판단인가"** 를 먼저 정해 한 파일에만 넣는다. 두 곳에 쓰면 그 자체가 드리프트 원인이 된다.

## 검증

### 확정 문장이 번역문에 살아있는지

```bash
node scripts/tm-audit.js --file <번역문.txt>
```

**도착어 쪽에서** 대조한다 — 원문은 회차마다 조사·공백이 흔들려 매칭이 조용히 빗나간다. 대소문자를 구분한다(`Happy Shopping!` ≠ 정본 `Happy shopping!`).

`MISS` 는 **드리프트 후보**지 오류 확정이 아니다. 이번 회차에 그 섹션이 없으면 당연히 안 나온다. 둘을 가르는 건 사람이 하고, `references/skeletons.md` 로 이번 회차의 블록을 먼저 표시해두면 빨리 갈린다. exit code 는 항상 0.

### 근거 회차 세기

```bash
node scripts/fetch-announcement.js      # references/corpus.json 의 회차를 .corpus/ 로 받는다
node scripts/corpus-stats.js --audit    # 등록 정본이 몇 회차에 나오는가
node scripts/corpus-stats.js --mine     # 미등록인데 반복되는 줄 = 새 확정 문구 후보
```

`.corpus/` 는 gitignore 다 — 공지 전문은 PUBG 저작물이라 재배포하지 않고, 커밋하는 건 회차 id 목록뿐이다.

### 수치 정합

개수가 세 곳(`_index.json` · `SKILL.md` 개수 표 · 섹션 제목)에 중복돼 있고 자동 동기화가 없다. 등록 후 검사한다.

```bash
bash scripts/check-counts.sh
```

`jq` 가 필요하다. 불일치가 있으면 exit 1.

## 등록할 때

1. **근거는 발행물만** — 공식 홈페이지 발행 공지의 KR/EN 대조. 사내 문서·기획서·초안은 근거로 쓰지 않는다.
2. 표기가 갈렸으면 다수형을 등록하고 **소수형과 반려 이유를 `notes` 에 남긴다.** 그게 다음 판단의 근거가 된다.
3. `category_id` 는 `_categories.json` 의 기존 값을 재사용한다.
4. 등록은 **원본 JSON 에만.** 끝나면 다시 생성하고 검사한다:

```bash
node scripts/build-lean.js && bash scripts/check-counts.sh
```

**미확정 고유명사는 추측해서 만들지 않는다** — 한 번 발행되면 그게 선례가 된다.

자세한 절차는 [CLAUDE.md](CLAUDE.md), 출처 정책은 [references/sources.md](references/sources.md).

## 범위

**안**: 플레이어에게 발행되는 out-game 공지.
**밖**: 인게임 UI · 기획서 · 회의록 · 내부 문서 — 다른 용어 체계다.

확정 문구가 실제로 쌓인 유형은 **Store Update** 와 **Special Drops** 둘이다. 콜라보·이벤트 등 다른 유형에도 쓰되, 적용되는 건 공통 문구와 규칙·판단 기준까지고 **그 유형 전용 문구를 지어내지 않는다.**

## 출처

모든 확정 표기는 PUBG 공식 홈페이지에 **발행된 공지의 KR/EN 대조**에서 나왔다. 발행된 영문이 곧 플레이어가 본 표기이므로 그것이 정본이다.

근거는 `https://pubg.com/<locale>/news/<id>` 의 news id 로 인용한다 — 로케일만 바꾸면 같은 회차의 KR/EN 이 나온다. 재검증한 회차는 `glossary/announcements.json` 의 `_meta.evidence_corpus` 에 있고, 최초 등록분의 회차를 채우는 작업은 아직 남아 있다 (`references/sources.md` TODO).

## 라이선스

[MIT](LICENSE). 문서와 데이터는 한국어로 쓰여 있다(`target` 값과 규칙 예시만 영어).
