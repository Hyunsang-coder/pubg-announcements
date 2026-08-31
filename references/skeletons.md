# 공지 골격

`glossary/announcements.json` 은 문장 단위 평면 리스트라, "이 공지는 어떤 섹션이 어떤 순서로 오는가"가 안 보인다. 이 문서가 그 뷰다.

**쓰는 법**: 번역 전에 해당 유형의 골격을 훑어 이번 회차에 어떤 블록이 있는지 표시하고, 번역 후 `scripts/tm-audit.js` 의 `MISS` 를 이 표시와 대조한다. **표시한 블록의 MISS = 드리프트 후보 / 표시 안 한 블록의 MISS = 이번 회차에 없는 섹션.** 그 둘을 가르는 게 골격이 하는 일이다.

> **주의 — 이 문서의 지위**
> 아래 순서는 각 항목의 `context` 필드(`공지 골격 — …`)에서 재구성한 것이지, 발행 공지를 다시 대조해 확정한 사양이 아니다. **섹션의 존재와 확정 문자열은 정본이지만, 순서는 참고**다. 실제 회차와 어긋나면 회차가 맞다.

---

## Store Update

거의 매 회차 같은 골격으로 돈다.

```
인사말                    Hello, players!
도입문                    (회차 서수 등 — 가변. 서수만 풀어 쓴다: sixth Store Update)

New Items and Skins                                   ← 신규 아이템과 스킨
  ※ All featured items may become available again…    ← 재등장 가능 고지
  ※ The sales periods shown below are subject to change.
  [상품 블록 반복]
     상품명
     Sales Period (UTC)                               ← 판매 기간(UTC)
       <시작>, after live server maintenance - <종료>, HH:MM
       또는 종료가 무기한이면  … - until further notice
  ※ Probability-based items such as the Survivor Pass are not available… (BE/NL)
  ※ The probabilities for items obtainable from Contraband Crates… View Probabilities page.
  ※ Contraband Crate (Open 10) offers a 50% discount for the first purchase.

Hideout: Weapon Skins                                 ← 은신처: 무기 스킨
  ※ The probabilities for items obtainable from the Archivist's Chest… View Probabilities page.

[이스포츠 GPT 섹션]
  Check out the special items from the <연도> PUBG: BATTLEGROUNDS Esports Global Partner Teams!

Items and Skins End Date Reminder                     ← 판매 종료 아이템과 스킨
  Sales End Date                                      ← 판매 종료일 (타임존 붙으면 Sales End Date (UTC))
  Items Affected                                      ← 판매 종료 대상 아이템
  Thank you for your understanding.

Happy shopping!
PUBG: BATTLEGROUNDS Team
```

기간 줄의 포맷(구분자 ` - `, 콤마, 월 풀네임)은 `references/notation.json` 의 `event-period-range-format-en` · `event-date-format-en` 소관이다. 위 골격은 **어느 자리에 오는가**만 말한다.

---

## Special Drops

Store Update 와 달리 **회차마다 이벤트 형태가 바뀐다.** 아래 블록이 전부 한 공지에 들어가는 게 아니라, 골격(공통) + 이벤트형(택일 또는 병렬)이다. `MISS` 를 읽을 때 이 구분이 핵심이다.

### 공통 골격

```
Update History                    ← 업데이트 내역 (문서 상단 개정 이력)

Hello, players!
  (이탤릭) Event details can be checked via the in-game lobby event page.

Event Schedule (UTC)              ← 이벤트 기간 (UTC)

Event Details                     ← 이벤트 안내
  Complete missions to earn points, and exchange your accumulated points for
  a variety of reward items! / …for reward items.      ← 2변형. 회차 원문을 따른다
  (However, only 1 of the 6 items can be selected.)     ← 택일형 보상일 때

Mission                           ← 미션
  Each mission resets every day at 11:00 KST. / …02:00 UTC.  ← 초기화 안내(섹션 상단)
  Each mission resets every week.                            ← 주간형
  (Resets every day at 11:00 KST.) / (…02:00 UTC.)           ← 출석형 괄호(이탤릭)
  [미션 문장 반복 — Enter the lobby. / Deal 400 total damage to enemies. / …]
  Survival time includes time spent spectating your teammates.  ← 생존 미션 부가 고지

Obtainable Rewards / Total Obtainable Rewards    ← 획득 가능한 보상 / 총 획득 가능한 보상
  (7 Days)                                       ← 기간제 재화 보상명 접미
  Can be used for 7 days from the time the reward is claimed.   ← 하위 불릿

Happy Drops!
PUBG: BATTLEGROUNDS Team
```

### 이벤트형 블록 — 회차마다 택일/병렬

| 형태 | 블록 | 확정 문자열 |
|---|---|---|
| 주간 미션 릴레이 | `Obtainable Rewards by Week` | `Week 1` · `Weeks 2/3/4` · `To be revealed sequentially.` · `Complete the missions that open each week to earn rewards.` · `Complete each mission to unlock the next.` |
| 빙고 | `Bingo Completion Rewards` | `Complete missions to earn tickets, and complete your Bingo board!` |
| 월간 출석 | `<월> Check-in` · `Bonus Check-in` | `Enter the lobby daily.` · `Log in to the lobby.` |
| 친구 초대 | `Invitation Code Event` | `Invite 1 Friend` · `Generate a referral code from the event page and share it with your friends.` · `Reach Survival Level 10 and earn a reward.` · `Players must have Survival Level 10 or higher to participate in the Friend Invite Event.` · `New Players: …14 days ago or less` · `Returning Players: …28 days or more since their last login` |

---

## 헷갈리는 이름 하나

**`이벤트 안내` 는 공지 유형이 아니라 Special Drops 안의 섹션 헤더**다 (`→ Event Details`). "이벤트 안내 공지를 번역한다"는 말과 이 섹션 헤더는 다른 것이니, 조회할 때 섞지 않는다.

---

## 골격에 없는 유형을 만나면

콜라보 공지처럼 확정 문구가 아직 없는 유형은 골격도 없다. 그때는:

1. `common` 문구(인사말·서명·기간 조건구)와 `references/` 의 규칙·판단 기준까지만 적용한다.
2. **클로징은 지어내지 않는다** — `references/style.json` 의 `closing.map._unlisted`.
3. 확정되면 그 유형의 골격을 이 문서에 추가한다.
