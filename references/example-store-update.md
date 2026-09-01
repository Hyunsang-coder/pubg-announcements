# 완역 예시 — 2025-07 Store Update (news/8875)

발행분 KR/EN 대조. 규칙 스무 개보다 **완성된 한 편**이 문서 형식을 더 잘 전달한다.

- KR: `https://pubg.com/ko/news/8875` · EN: `https://pubg.com/en/news/8875`
- **구조가 다른 부분만 한 번씩** 실었다. 같은 모양으로 반복되는 상품 블록은 첫 둘만 두고 생략했다(`⋯ 생략`).
- 섹션 인벤토리는 `skeletons.md`, 확정 문자열은 `glossary/_lean/announcements.tsv` 소관이다. 여기서는 **그 조각들이 실제 문서에서 어떻게 붙는가**를 본다.

---

## 1. 도입 — 인사·서수·요약

```
KR  안녕하세요, 플레이어 여러분!
    2025년의 일곱 번째 상점 안내가 도착했습니다.

EN  Hello players!
    Welcome to the seventh Store update of 2025.
```

- 서수는 풀어 쓴다(`일곱 번째` → `seventh`). 연도는 후치(`2025년의 일곱 번째` → `the seventh … of 2025`).
- 이 회차의 EN 은 **`Hello players!` (콤마 없음)** 이다. 등록된 정본은 `Hello, players!` 이므로 갈리는 항목이다 — `judgment.md` 의 "선례가 갈릴 때" 참고.
- 본문 안의 `Store update` 는 소문자 u 다. `announcement-title-case-en` 은 **헤더·상품명**에 적용되는 규칙이고, 문장 안의 서술은 대상이 아니다.

## 2. 섹션 상단 ※ 고지

```
KR  ## 신규 아이템과 스킨
    ※ 소개된 모든 상품은 제작소, 나만의 상점 등 게임 내 플랫폼 및/또는 이벤트/프로모션을 통해 추후 재등장할 수 있습니다.
    ※ 판매 기간은 상황에 따라 변경될 수 있습니다.

EN  ## New Items and Skins
    ※ All featured items may become available again at a later date via the Workshop, Your Shop, or other in-game features, as well as various events and promotions.
    ※ The sales periods shown below are subject to change.
```

- `※` 를 떼거나 문장으로 풀지 않는다. 굵게 처리도 원문을 따른다.
- 이 두 줄은 Store Update 전용이 아니다 — 콜라보 공지(news/10043 · 9469)에도 같은 자리에 그대로 나온다.

## 3. 상품 블록 — 헤더 + 소개문 + 판매 기간

```
KR  ### 서바이버 패스: 키스 더 선
    서바이버 패스: 키스 더 선과 함께 여름의 열기를 끌어올리세요.

    #### 판매 기간
    - PC: 25/7/9, 라이브 서버 점검 완료 후 - 25/8/6, 09:00
    - Console: 25/7/17, 라이브 서버 점검 완료 후 - 25/8/14, 09:00

EN  ### Survivor Pass: Kiss The Sun
    Crank up the heat this summer with Survivor Pass: Kiss the Sun.

    #### Sales Period (UTC)
    - PC: July 9, after live server maintenance - August 6, 00:00
    - Console: July 17, after live server maintenance - August 14, 00:00
```

여기에 규칙 네 개가 한꺼번에 들어 있다.

1. **KR 헤더는 `판매 기간` 인데 EN 은 `Sales Period (UTC)` 다.** 원문에 `(UTC)` 가 없어도 EN 은 붙인다 — 타임존을 밝히지 않으면 기간을 오독하기 때문이다. TM 의 `source` 는 `판매 기간(UTC)` 로 등록돼 있으니, 원문이 `판매 기간` 이어도 같은 자리다.
2. **시각이 KST → UTC 로 환산된다.** `09:00` → `00:00`, `11:00` → `02:00` (−9h). 숫자를 그대로 옮기지 않는다.
3. **날짜는 `25/7/9` → `July 9`.** 월 풀네임, 앞자리 0 없음, 같은 해면 연도 생략.
4. 상품명 안의 관사·대소문자는 EN 쪽 표기를 따른다(`키스 더 선` → 헤더는 `Kiss The Sun`, 문장 안은 `Kiss the Sun`).

⋯ 같은 모양의 상품 블록 2개 생략 (PGC 2024 챔피언 · PIGFF 기어) ⋯

## 4. 🔴 KR 에만 있고 EN 에는 없는 고지

```
KR  ## 은신처: 무기 스킨
    ※ #36.2 PUBG: 배틀그라운드 확률형 아이템 정보는 별도 공지를 통해 안내드릴 예정입니다.

    ### 밀수품 상자

EN  ## Hideout: Weapon Skins

    ### Contraband Crate
```

**확률형 아이템 정보 고지는 EN 에 옮기지 않는다.** 한국 규제에 따른 KR 전용 고지이기 때문이다.

`style.json` 의 구조 보존 규칙과 `judgment.md` 의 "법률 고지에서 한정어를 빼지 않는다" 와 충돌하는 것처럼 보이지만 아니다 — 그 규칙들은 **양쪽에 다 나가는 고지**의 범위를 좁히지 말라는 것이고, 이건 애초에 KR 관할에서만 요구되는 고지다. 판단이 서지 않으면 지우지 말고 확인을 받는다.

## 5. 🔴 법률 고지 — 조항 번호를 그대로 옮기지 않는다

```
KR  ※ … 이용약관(PUBG: BATTLEGROUNDS Terms of Service) 제10조, 제16조에 따라 …
       … 운영정책(Rules of Conduct) 제5조에 근거한 제재가 …

EN  ※ … in accordance with Articles 3, 6, and 18 of the PUBG: BATTLEGROUNDS Terms of Service.
       … based on Article 5 of the Rules of Conduct.
```

**조항 번호가 다르다** (`제10조, 제16조` vs `Articles 3, 6, and 18`). 각 언어판 약관의 조항 번호가 다르기 때문이다. 숫자라고 기계적으로 옮기면 존재하지 않는 조항을 가리키게 된다 — **문서 참조 번호는 도착어판 문서를 확인하고 쓴다.**

## 6. 확률 고지 — 인게임 UI 경로가 정본

```
KR  ※ 밀수품 상자에서 획득 가능한 아이템의 획득 확률은 은신처 - 밀수품 - 세부 정보 - 확률 보기 페이지에서 확인하실 수 있습니다.

EN  ※ The probabilities for items obtainable from Contraband Crates can be found on the Hideout - Contraband - More Details - View Probabilities page.
```

- 메뉴 경로는 인게임 표기 그대로. `View Probabilities` 는 **복수형 고정**이다.
- KR 은 `밀수품 상자`(단수)인데 EN 은 `Contraband Crates`(복수) — 총칭이라 영어 문법을 따랐다.

## 7. 지역 판매 제한 — 상품마다 문구가 다르다

```
EN  ※ Due to legal regulations, the Loot Cache Packs are not available for purchase in Belgium and the Netherlands.
```

등록된 정본(`Probability-based items such as the Survivor Pass are not available for sale in BE and NL (Belgium and the Netherlands) due to legal issues.`)과 **문장이 다르다.** 대상 상품이 다르면 문구도 다르다는 뜻이므로, 등록 문자열을 아무 데나 끌어 쓰지 않는다.

## 8. 클로징·서명

```
KR  즐거운 쇼핑 되시길 바랍니다.
    PUBG: 배틀그라운드 팀

EN  Happy shopping!
    PUBG: BATTLEGROUNDS Team
```

`Enjoy your shopping.` 같은 직역이 아니라 **자리에 굳은 관용역**이다. 서명은 전 공지 유형 공통.

---

## 이 회차에 없던 것

`Items and Skins End Date Reminder`(판매 종료 아이템과 스킨) 섹션이 **이번 회차엔 없다.** `tm-audit.js` 를 돌리면 `Sales End Date` · `Items Affected` 가 `MISS` 로 뜨는데, 이건 드리프트가 아니라 **섹션 부재**다.

`skeletons.md` 로 이번 회차 블록을 먼저 표시해두라는 이유가 이것이다.
