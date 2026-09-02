# pubg-announcements

PUBG 플레이어 공지(out-game announcement)를 **한국어에서 영어로 번역할 때 사용하는 스킬 패키지**입니다.

Store Update, Special Drops, 콜라보레이션, 이벤트 안내처럼 반복되는 공지의 확정 문장·게임 용어·표기 규칙을 한곳에서 관리합니다. 매 회차 문장을 새로 번역하는 대신, 이미 검증된 영어 표현을 재사용하고 날짜·수치·상품명 같은 가변부만 바꾸는 것이 이 프로젝트의 핵심입니다.

이 저장소는 Claude Code와 Codex에서 모두 사용할 수 있도록, 스킬 본체와 번역 자산을 하나의 Git 저장소에 함께 둡니다.

> **번역 방향은 한국어 → 영어 전용입니다.**
> 영어 공지를 한국어로 되돌리는 용도로 사용하지 않습니다. 한국어 원문은 회차마다 조사·공백·문장부호가 흔들릴 수 있지만, 이 저장소의 영어 정본은 고정되어 있기 때문입니다.

## 빠른 시작

현재 공개 저장소:

<https://github.com/Hyunsang-coder/pubg-announcements>

### Claude Code

전역 스킬로 설치하려면 다음과 같이 저장소를 clone하고 Claude Code 스킬 디렉터리에 연결합니다.

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/Hyunsang-coder/pubg-announcements.git
cd pubg-announcements
ln -s "$(pwd)" ~/.claude/skills/pubg-announcements
```

이미 저장소를 내려받았다면 clone 단계는 생략하고, 저장소의 절대 경로를 링크하면 됩니다.

```bash
mkdir -p ~/.claude/skills
ln -s /absolute/path/to/pubg-announcements ~/.claude/skills/pubg-announcements
```

특정 프로젝트에서만 사용하려면 전역 경로 대신 해당 프로젝트의 `.claude/skills/` 아래에 연결합니다.

```bash
mkdir -p .claude/skills
ln -s /absolute/path/to/pubg-announcements .claude/skills/pubg-announcements
```

### Codex

Codex의 GitHub 스킬 설치 도구를 사용하면 저장소 루트의 `SKILL.md`를 스킬로 설치할 수 있습니다.

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo Hyunsang-coder/pubg-announcements \
  --path . \
  --name pubg-announcements
```

이 저장소는 루트에 `SKILL.md`가 있으므로 `--path .`를 사용합니다. 다른 저장소 안에 여러 스킬을 넣을 때처럼 `skills/pubg-announcements` 경로를 사용할 필요는 없습니다.

## 자료 기준일

이 저장소의 번역 자산과 참고 공지는 다음 시점을 기준으로 정리되어 있습니다.

| 항목 | 기준 |
|---|---|
| 자료 기준일 | **2026-09-01** |
| 참고 공지 발행 범위 | **2025-07 ~ 2026-08** |
| 최신 참고 공지 | **2026-08** |
| 참고 공지 수 | **33건** |
| 마지막 코퍼스 수집일 | **2026-09-01** |

발행 공지가 추가되거나 기존 공지가 개정되면 `references/corpus.json`에 기록하고, 이 표의 기준일과 수집일도 함께 갱신합니다. 정확한 회차별 발행일·ID·수집일은 [`references/corpus.json`](references/corpus.json)이 기준입니다.

### 설치 후 사용

설치한 뒤에는 다음처럼 요청하면 됩니다.

```text
이 PUBG Store Update 공지를 pubg-announcements 규칙에 맞춰 한국어에서 영어로 번역해줘.
```

다음과 같은 요청도 스킬의 사용 대상입니다.

```text
이 Special Drops 공지에서 확정 문구를 먼저 찾아서 번역해줘.
날짜와 기간은 영어 공지 표기 규칙에 맞춰줘.
번역 후 TM 감사를 실행하고 MISS를 설명해줘.
```

## 프로젝트가 제공하는 것

현재 번역 자산은 다음과 같습니다.

| 자산 | 개수 | 역할 |
|---|---:|---|
| 확정 문장 TM | 98 | 공지에 반복되는 문장. 있으면 그대로 재사용 |
| 고유명사 | 73 | PUBG 인게임 표기가 확인된 게임 용어 |
| 표기 규칙 | 3 | 날짜·기간·title case 같은 패턴 규칙 |
| 참고 공지 | 25 | KR/EN 대조에 사용한 공지 회차 목록 |

확정 문장과 고유명사는 PUBG 공식 홈페이지에 발행된 공지의 한국어·영어 대조를 근거로 등록합니다.

## 디렉터리 구조

```text
pubg-announcements/
├── SKILL.md
├── README.md
├── glossary/
│   ├── announcements.json
│   ├── proper_nouns.json
│   ├── _lean/
│   │   ├── announcements.tsv
│   │   └── proper_nouns.tsv
│   ├── _index.json
│   └── _categories.json
├── references/
│   ├── notation.json
│   ├── style.json
│   ├── judgment.md
│   ├── skeletons.md
│   ├── example-store-update.md
│   ├── sources.md
│   └── corpus.json
└── scripts/
    ├── build-lean.js
    ├── tm-audit.js
    ├── fetch-announcement.js
    ├── corpus-stats.js
    └── check-counts.sh
```

### 핵심 파일

| 파일 | 역할 | 편집 여부 |
|---|---|---|
| `SKILL.md` | Claude Code와 Codex가 읽는 작업 지침 | 규칙 변경 시 편집 |
| `glossary/announcements.json` | 확정 문장 원본 | 직접 편집 |
| `glossary/proper_nouns.json` | 고유명사 원본 | 직접 편집 |
| `glossary/_lean/*.tsv` | 번역 중 빠르게 조회하는 생성물 | 직접 편집하지 않음 |
| `references/notation.json` | 날짜·기간·대소문자 패턴 규칙 | 규칙 변경 시 편집 |
| `references/style.json` | 문체·구조·길이·클로징 규칙 | 필요할 때 편집 |
| `references/judgment.md` | 선례가 갈릴 때의 판단 기준 | 필요할 때 편집 |
| `references/skeletons.md` | 공지 유형별 섹션 골격 | 유형이 추가될 때 편집 |
| `references/corpus.json` | 근거로 대조한 공지의 ID 목록 | 발행 공지 대조 후 편집 |

## 번역 작업 순서

스킬은 다음 순서로 자료를 사용합니다.

1. **공지 유형을 확인합니다.** Store Update인지 Special Drops인지, 또는 다른 유형인지 구분합니다.
2. **공지의 섹션 골격을 확인합니다.** `references/skeletons.md`에서 이번 회차에 실제로 있는 블록을 표시합니다.
3. **확정 문장을 먼저 찾습니다.** `glossary/_lean/announcements.tsv`에서 한국어 원문과 정확히 일치하는 문장을 검색합니다.
4. **확정 문장은 다시 번역하지 않습니다.** 날짜·서수·수치·상품명·연도 같은 가변부만 교체합니다.
5. **일치하지 않는 부분은 규칙을 적용합니다.** `notation.json` → `style.json` → `judgment.md` 순서로 확인합니다.
6. **미확정 고유명사나 등록되지 않은 유형의 클로징은 추측하지 않습니다.** 확인이 필요한 상태로 남깁니다.
7. **번역 후 도착어를 검사합니다.** `tm-audit.js`로 확정 영어 문구가 살아 있는지 확인합니다.

## 날짜·기간 표기 규칙

영어 공지에서는 한국식 숫자 날짜를 그대로 옮기지 않습니다.

| 피해야 할 표기 | 사용할 표기 |
|---|---|
| `26/9/10` | `September 10` |
| `Sep 10` | `September 10` |
| `September 01` | `September 1` |
| `Week2` | `Week 2` |
| `2026 Black Market` | `Black Market 2026` |
| `700 m` | `700m` |

기간은 공백 하이픈으로 연결합니다.

```text
May 21, after live server maintenance - June 18, 07:00
```

같은 날의 기간은 종료 날짜를 생략합니다.

```text
February 4, 00:00 - 08:30
```

한국 원문의 시간이 KST라면 영어 공지에서는 UTC로 환산합니다. 예를 들어 `09:00 KST`는 `00:00 UTC`가 됩니다. 자세한 규칙과 예외는 [`references/notation.json`](references/notation.json)에 있습니다.

## 검증

### 1. 확정 문장 TM 감사

번역문 파일에서 확정 영어 문구가 빠지거나 변형되지 않았는지 확인합니다.

```bash
node scripts/tm-audit.js --file <translated.txt>
```

`MISS`는 곧바로 오류라는 뜻은 아닙니다. 이번 공지에 해당 섹션이 없어서 나오지 않은 것일 수도 있습니다. `references/skeletons.md`에서 이번 회차의 블록을 먼저 표시한 뒤 판단합니다.

이 검사는 대소문자를 구분합니다.

```text
Happy shopping!   ✅
Happy Shopping!   ❌
```

### 2. 데이터와 생성물 정합성 검사

```bash
bash scripts/check-counts.sh
```

다음 항목을 한 번에 검사합니다.

- JSON 파일 파싱 여부
- `_index.json`의 파일별 개수와 실제 데이터 개수
- 전체 용어 개수와 분류 개수
- `category_id` 정의 여부
- `SKILL.md`에 적힌 개수와 실제 개수
- `_lean` 조회면과 원본 JSON의 일치 여부

### 3. 조회면 생성 또는 최신 상태 검사

원본 JSON을 수정한 뒤 조회면을 다시 생성합니다.

```bash
node scripts/build-lean.js
```

수정 없이 최신 상태만 확인하려면 다음을 사용합니다.

```bash
node scripts/build-lean.js --check
```

## 근거 공지와 코퍼스

등록된 문구가 실제로 몇 회차에 사용됐는지 확인하려면 먼저 근거 공지를 로컬에 받습니다.

```bash
node scripts/fetch-announcement.js
```

특정 공지만 받을 수도 있습니다.

```bash
node scripts/fetch-announcement.js 10828 9637
```

받은 본문은 `.corpus/`에 저장되며 Git에는 포함하지 않습니다. 공지 전문은 PUBG 저작물이므로, 이 저장소에는 공지 ID와 문장 단위의 번역 대응만 커밋합니다.

코퍼스를 사용한 통계와 대조 명령은 다음과 같습니다.

```bash
node scripts/corpus-stats.js --audit
node scripts/corpus-stats.js --mine --min 5 --doc-type store_update
node scripts/corpus-stats.js --conflicts
node scripts/fetch-announcement.js --verify
```

`--mine` 결과는 새 확정 문구가 아니라 등록 후보입니다. 실제 발행물의 KR/EN 대조와 판단 기준 검토를 거쳐야 합니다.

## 새 문구·용어 등록

새 자산을 등록할 때는 다음 원칙을 지킵니다.

1. 근거는 PUBG 공식 홈페이지에 **발행된 공지**만 사용합니다.
2. 사내 문서·기획서·초안·내부 경로는 근거로 사용하거나 공개 저장소에 남기지 않습니다.
3. 표기가 여러 가지면 빈도·최근성·문법·인게임 표기를 함께 검토합니다.
4. `source`와 `target`은 발행된 KR/EN 문장에서 확인합니다.
5. `category_id`는 [`glossary/_categories.json`](glossary/_categories.json)의 기존 값을 재사용합니다.
6. 등록은 원본 JSON에만 합니다.
7. 등록 후 조회면을 재생성하고 검증합니다.

```bash
node scripts/build-lean.js
bash scripts/check-counts.sh
```

미확정 고유명사는 추측해서 만들지 않습니다. 한 번 등록된 표기가 이후 공지의 선례가 되기 때문입니다.

## 편집 규칙

- `glossary/*.json`이 번역 자산의 원본입니다.
- `glossary/_lean/*.tsv`는 생성물이므로 손으로 편집하지 않습니다.
- `SKILL.md` 안의 고유명사 표도 `build-lean.js`가 생성하므로 마커 사이를 직접 고치지 않습니다.
- 규칙은 문자열인지, 패턴인지, 판단 기준인지 먼저 구분한 뒤 한 파일에만 넣습니다.
- 스크립트와 문서는 외부 절대 경로에 의존하지 않아야 합니다.
- `.corpus/`와 공지 전문은 커밋하지 않습니다.

## 범위

### 포함

- PUBG 플레이어에게 발행되는 out-game 공지
- Store Update
- Special Drops
- 콜라보레이션·이벤트 공지에 적용되는 공통 문구와 표기 규칙
- 한국어 → 영어 번역

### 제외

- 인게임 UI 전체 용어집
- 내부 기획서·회의록·사내 문서
- 영어 → 한국어 역번역
- 등록되지 않은 공지 유형의 전용 문구를 임의로 만드는 작업

## 공개와 라이선스

이 저장소는 공개 배포를 전제로 합니다.

- 공개된 발행 공지에서 확인 가능한 정보만 등록합니다.
- 내부 위키 경로, 스페이스 키, 팀 약어, 내부 코드명, 미발표 일정, 협력사 내부 정보는 기록하지 않습니다.
- 공지 전문은 저장소에 재배포하지 않고 필요할 때만 로컬 코퍼스로 받습니다.

코드는 [MIT License](LICENSE)를 따릅니다. 문서와 데이터는 한국어로 작성되며, `target` 값과 규칙 예시는 영어입니다.

## 참고 문서

- [스킬 본체](SKILL.md)
- [작업 지침](CLAUDE.md)
- [출처 정책](references/sources.md)
- [판단 기준](references/judgment.md)
- [공지 골격](references/skeletons.md)
- [완역 예시](references/example-store-update.md)
