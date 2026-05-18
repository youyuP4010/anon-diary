# Anon Diary — 서비스 설계 문서

> 최종 확정본 (설계 전용, 코드 없음)

---

## 1. 서비스 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | Anon Diary |
| 목적 | 공개 익명 일기 서비스 |
| Frontend | React + Vite (PWA) |
| Backend | Supabase (Auth + DB + Storage) |
| 인증 | Supabase Auth Google OAuth 단독 사용 |

---

## 2. 전체 서비스 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         클라이언트                               │
│   React + Vite (PWA)                                            │
│                                                                 │
│   ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐ │
│   │  Swiper.js   │  │Google Translate│  │   Google AdSense    │ │
│   │ touchAngle:30│  │    Widget      │  │ 모든 페이지 상단 고정 │ │
│   │ nested: true │  │  (번역 버튼)   │  │      배너 1개       │ │
│   └──────────────┘  └───────────────┘  └─────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS (Supabase JS Client)
┌──────────────────────────────▼──────────────────────────────────┐
│                         Supabase                                │
│                                                                 │
│   ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│   │       Auth       │  │     Database     │  │   Storage   │  │
│   │  Google OAuth    │  │   PostgreSQL     │  │ 배경 이미지  │  │
│   │  (Supabase 내장) │  │   + RLS + 트리거 │  │             │  │
│   └──────────────────┘  └──────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 페이지 목록 (총 6개)

| # | 페이지명 | 경로 | 설명 |
|---|---------|------|------|
| 1 | 메인 피드 | `/` | 전체 공개 일기 카드 좌우 스와이프 뷰 |
| 2 | 내 일기 | `/my` | 내가 쓴 일기 목록 + 팔로잉/팔로워 관리 |
| 3 | 일기 상세 | `/diary/:id` | 단일 일기 전체 보기 (작성자 여부에 따라 UI 분기) |
| 4 | 일기 작성 | `/write` | 제목+본문 입력, 배경 선택, 업로드 |
| 5 | 설정 | `/settings` | 계정 정보, 계정 관리, 문의하기, 앱 정보 |
| 6 | 로그인 | `/login` | Supabase Google OAuth 로그인 |

**없는 페이지:**
- `/following` — 팔로잉 전용 피드 없음
- `/user/:id` — 타 유저 글 목록 페이지 없음

---

## 4. 피드 스와이프 + 스크롤 구조

### 제스처 충돌 해결 방식

스크롤 위치 기반 제어(맨 위/아래에서만 스와이프 허용)는 UX 불안정으로 사용하지 않는다.
터치 이동 각도로 스크롤과 스와이프를 분리한다.

```
터치 시작
    │
    ├─ 세로 이동량 > 가로 이동량
    │       → 카드 내부 세로 스크롤
    │
    └─ 가로 이동량 > 세로 이동량 (30도 이하)
            → 카드 좌우 스와이프
```

### Swiper.js 설정값

| 옵션 | 값 | 설명 |
|------|----|------|
| `touchAngle` | `30` | 30도 이하 움직임만 가로 스와이프로 인식 |
| `nested` | `true` | 카드 내부 세로 스크롤 허용 |
| `touchStartPreventDefault` | `false` | 브라우저 기본 스크롤 이벤트 유지 |

---

## 5. 카드 HTML 구조

카드는 전체 화면 높이로 고정하고, 헤더/푸터는 고정, 본문만 스크롤된다.

```
[고정] 사이트 로고
[고정] 상단 광고 배너 (AdSense)
│
└─ Swiper
   └─ Slide
      └─ diary-card              ← height: 100vh, flex column
         │
         ├─ card-header          ← 고정 (flex-shrink: 0)
         │   ├─ nickname          (텍스트만, 클릭 기능 없음)
         │   ├─ star-follow       (⭐/☆ 토글)
         │   └─ translate-button
         │
         ├─ card-content         ← flex: 1 / overflow-y: auto (스크롤 영역)
         │   ├─ background-image
         │   ├─ title
         │   └─ content (최대 500자)
         │
         └─ card-footer          ← 고정 (flex-shrink: 0)
             ├─ date
             ├─ reactions (😢 공감 / 😊 응원)
             └─ report-button
│
[고정] 하단 네비게이션 (Anon Diary | My Diary)
```

### CSS 핵심 규칙

| 요소 | 스타일 |
|------|--------|
| `diary-card` | `height: 100vh`, `display: flex`, `flex-direction: column` |
| `card-header` | `flex-shrink: 0` |
| `card-content` | `flex: 1`, `overflow-y: auto` |
| `card-footer` | `flex-shrink: 0` |

카드 내부를 끝까지 스크롤해도 로고, 광고, 하단 네비는 항상 고정 표시된다.

---

## 6. `/diary/:id` 페이지 UI 분기

```
일기 상세 페이지 진입
        │
        ├─ 로그인 상태 + 본인이 작성한 일기
        │       표시: 삭제 버튼, 수정 버튼
        │       숨김: 신고 버튼, 팔로우 버튼, 감정 반응
        │
        └─ 비로그인 또는 타인이 작성한 일기
                표시: 닉네임, 팔로우 버튼, 감정 반응, 신고 버튼
                숨김: 삭제 버튼, 수정 버튼
```

---

## 7. 팔로우 기능

### 목적
팔로우한 유저의 글이 메인 피드에서 우선 노출됨. 전용 피드 없음.

### 별 버튼 동작

| 상태 | 표시 | 클릭 시 동작 |
|------|------|-------------|
| 팔로우 안 함 | ☆ | 즉시 팔로우 → `anon_diary_follows` row 생성 → ⭐ 변경 |
| 팔로우 중 | ⭐ | 즉시 언팔로우 → `anon_diary_follows` row 삭제 → ☆ 변경 |

별 버튼 위치: 피드 카드 상단, 일기 상세 페이지
메인 피드에서는 팝업 없이 직접 토글.

### 닉네임 동작
닉네임은 클릭 기능을 가지지 않는다. 텍스트 표시만 한다.

### `/my` 페이지 팔로잉/팔로워 관리

```
[ ⭐ 132 팔로잉 ]   [ ☆ 22 팔로워 ]
      │                    │
      ▼                    ▼
  팔로잉 팝업           팔로워 팝업
```

#### 팔로잉 팝업 (내가 팔로우한 사람 목록)

```
┌─────────────────────────────┐
│ 팔로잉                       │
├─────────────────────────────┤
│ 닉네임A           ⭐         │  ← ⭐ 클릭 → 언팔로우
│ 닉네임B           ⭐         │     anon_diary_follows row 삭제
│ ...                         │
└─────────────────────────────┘
```

#### 팔로워 팝업 (나를 팔로우한 사람 목록)

```
┌─────────────────────────────┐
│ 팔로워                       │
├─────────────────────────────┤
│ 닉네임D           ☆         │  ← ☆ 클릭 → 팔로우
│ 닉네임E           ⭐         │     이미 팔로우 중이면 ⭐ 표시
│ ...                         │
└─────────────────────────────┘
```

---

## 8. 메인 피드 노출 알고리즘

```
피드 구성 순서
    │
    ├─ 1순위: 오늘 작성된 일기
    │         → 랜덤 순서로 노출
    │         → 팔로우한 유저 글을 같은 조건에서 앞에 배치
    │
    └─ 2순위: 오늘 일기가 없거나 부족할 때
              → 최근 작성된 일기 중 감정 반응 수 많은 순
              → 팔로우한 유저 글을 같은 조건에서 앞에 배치
```

피드가 항상 비어 보이지 않도록 2순위가 자동 보충한다.

---

## 9. 신고 처리 방식

- 모든 신고는 `anon_diary_reports` 테이블에 기록
- Edge Function 없음
- 동일 일기 중복 신고 방지: `(diary_id, reporter_id)` UNIQUE 제약
- 신고 5회 이상 누적 시 DB 트리거가 자동으로 `diaries.is_hidden = true` 처리
- 관리자가 DB 직접 확인 후 숨김 해제 또는 영구 삭제 판단
- 차단 기능 없음

---

## 10. 일기 본문 글자 수 제한

- 최대 500자
- 프론트엔드: `textarea` 입력 시 실시간 카운터 표시, 초과 입력 불가

```
본문
[ textarea               ]
320 / 500
```

- DB: `content TEXT CHECK (char_length(content) <= 500)`

---

## 11. 광고

- Google AdSense
- 모든 페이지 최상단 고정 배너 1개
- 로고와 광고 사이 구분선 추가, 최소 12px 공백
- 피드 카드 사이에는 광고 없음

---

## 12. PWA

- `manifest.json` (앱 아이콘, 이름, 테마 색상)
- Service Worker (오프라인 캐싱)
- 설정 페이지 "앱처럼 사용하세요" 배너 → PWA 설치 유도

---

## 13. 번역

- Google Translate Widget 버튼
- 카드 상단 "번역하기" 버튼으로 본문 번역

---

## 14. 오류 처리 방식

별도 에러 페이지 없음. 모든 오류는 해당 위치에서 인라인으로 처리.

| 상황 | 처리 방식 |
|------|----------|
| 존재하지 않는 일기 ID 접근 | 카드 위치에 "존재하지 않는 일기입니다" 인라인 메시지 |
| 정의되지 않은 URL 경로 | 메인 피드(`/`)로 리다이렉트 |
| 비로그인 상태에서 글쓰기/반응 시도 | 로그인 유도 모달 (페이지 이동 없이) |
| Supabase 연결 실패 / 네트워크 오류 | "불러오기 실패, 다시 시도하기" 버튼 표시 |
| 이미지 업로드 실패 | 작성 페이지 내 인라인 에러 메시지 |

---

## 15. Supabase DB 구조

### 테이블 목록 (5개)

| 테이블명 | 역할 |
|---------|------|
| `anon_diary_profiles` | 사용자 프로필 |
| `anon_diary_diaries` | 일기 |
| `anon_diary_reactions` | 감정 반응 |
| `anon_diary_follows` | 팔로우 관계 |
| `anon_diary_reports` | 신고 기록 |

---

### `anon_diary_profiles`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK | Supabase Auth `auth.users.id`와 동일값 |
| `nickname` | text | NOT NULL | 공개 닉네임 (익명) |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 가입일 |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | 수정일 |

---

### `anon_diary_diaries`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | 일기 고유 ID |
| `author_id` | uuid | NOT NULL, FK → profiles.id | 작성자 |
| `title` | text | NOT NULL | 제목 |
| `content` | text | NOT NULL, CHECK (char_length ≤ 500) | 본문 |
| `background_type` | text | NOT NULL, DEFAULT 'color' | `color` 또는 `image` |
| `background_value` | text | NOT NULL, DEFAULT '#FFFFFF' | 색상 코드 또는 이미지 URL |
| `font_size` | integer | NOT NULL, DEFAULT 14 | 14 또는 10 (pt) |
| `is_hidden` | boolean | NOT NULL, DEFAULT false | 신고 누적 자동 숨김 |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 작성일 |

`views`, `view_count` 컬럼 없음.

---

### `anon_diary_reactions`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `diary_id` | uuid | NOT NULL, FK → diaries.id | 대상 일기 |
| `user_id` | uuid | NOT NULL, FK → profiles.id | 반응한 사용자 |
| `type` | text | NOT NULL, CHECK IN ('sad', 'happy') | 반응 종류 |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |

UNIQUE: `(diary_id, user_id)` → 1인 1반응 강제

---

### `anon_diary_follows`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `follower_id` | uuid | NOT NULL, FK → profiles.id | 팔로우하는 사람 |
| `following_id` | uuid | NOT NULL, FK → profiles.id | 팔로우 대상 |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |

UNIQUE: `(follower_id, following_id)` → 중복 팔로우 방지
CHECK: `follower_id ≠ following_id` → 자기 자신 팔로우 방지

---

### `anon_diary_reports`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `diary_id` | uuid | NOT NULL, FK → diaries.id | 신고 대상 일기 |
| `reporter_id` | uuid | NOT NULL, FK → profiles.id | 신고자 |
| `reason` | text | NOT NULL | 신고 사유 |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |

UNIQUE: `(diary_id, reporter_id)` → 중복 신고 방지

---

### 테이블 관계

```
auth.users (Supabase 내장)
    │ 1:1
    ▼
anon_diary_profiles
    │
    ├──────── 1:N ────────────────────────────────────────────────┐
    ▼                                                             │
anon_diary_diaries                                               │
    │                                                             │
    ├── 1:N ──▶ anon_diary_reactions ◀── N:1 ────────────────────┤
    │                                                             │
    └── 1:N ──▶ anon_diary_reports   ◀── N:1 ────────────────────┤
                                                                  │
anon_diary_follows                                                │
    follower_id  ── N:1 ─────────────────────────────────────────┘
    following_id ── N:1 ─────────────────────────────────────────┘
```

**FK 삭제 정책:**
- `profiles` 삭제 시 → `diaries`, `reactions`, `follows`, `reports` CASCADE 삭제
- `diaries` 삭제 시 → `reactions`, `reports` CASCADE 삭제

---

### 인덱스

| 테이블 | 컬럼 | 목적 |
|--------|------|------|
| `anon_diary_diaries` | `author_id` | 내 일기 목록 조회 속도 |
| `anon_diary_diaries` | `created_at DESC` | 피드 최신순 정렬 속도 |
| `anon_diary_diaries` | `is_hidden` | 숨김 글 필터 속도 |
| `anon_diary_reactions` | `diary_id` | 일기별 반응 수 집계 속도 |
| `anon_diary_reactions` | `user_id` | 사용자별 반응 조회 속도 |
| `anon_diary_follows` | `follower_id` | 내가 팔로우한 목록 조회 속도 |
| `anon_diary_follows` | `following_id` | 나를 팔로우한 목록 조회 속도 |
| `anon_diary_reports` | `diary_id` | 신고 수 집계 속도 |

UNIQUE 제약 컬럼 조합은 Supabase가 자동 인덱스 생성.

---

### RLS 정책

#### `anon_diary_profiles`

| 작업 | 허용 조건 |
|------|----------|
| SELECT | 모든 사용자 |
| INSERT | `auth.uid() = id` |
| UPDATE | `auth.uid() = id` |
| DELETE | `auth.uid() = id` |

#### `anon_diary_diaries`

| 작업 | 허용 조건 |
|------|----------|
| SELECT | `is_hidden = false` (전체 공개) |
| INSERT | `auth.uid() IS NOT NULL` |
| UPDATE | `auth.uid() = author_id` |
| DELETE | `auth.uid() = author_id` |

#### `anon_diary_reactions`

| 작업 | 허용 조건 |
|------|----------|
| SELECT | 모든 사용자 |
| INSERT | `auth.uid() IS NOT NULL` |
| DELETE | `auth.uid() = user_id` |

#### `anon_diary_follows`

| 작업 | 허용 조건 |
|------|----------|
| SELECT | 모든 사용자 |
| INSERT | `auth.uid() = follower_id` |
| DELETE | `auth.uid() = follower_id` |

#### `anon_diary_reports`

| 작업 | 허용 조건 |
|------|----------|
| SELECT | `auth.uid() = reporter_id` |
| INSERT | `auth.uid() IS NOT NULL` AND `auth.uid() = reporter_id` |
| UPDATE | 불가 |
| DELETE | 불가 |

---

### DB 트리거

| 트리거 | 시점 | 동작 |
|--------|------|------|
| 프로필 자동 생성 | `auth.users` INSERT 후 | `anon_diary_profiles` row 자동 생성, 랜덤 닉네임 할당 |
| 신고 자동 숨김 | `anon_diary_reports` INSERT 후 | 해당 `diary_id`의 신고 수 ≥ 5 이면 `diaries.is_hidden = true` |
| `updated_at` 갱신 | `anon_diary_profiles` UPDATE 후 | `updated_at = now()` 자동 갱신 |

---

## 16. 주요 컴포넌트 구조

```
src/
├── pages/
│   ├── FeedPage.tsx              ← 메인 피드 (Swiper)
│   ├── MyDiaryPage.tsx           ← 내 일기 목록 + 팔로잉/팔로워 팝업
│   ├── DiaryDetailPage.tsx       ← 일기 상세 (작성자 분기 포함)
│   ├── WritePage.tsx             ← 일기 작성
│   ├── SettingsPage.tsx          ← 설정
│   └── LoginPage.tsx             ← Google 로그인
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          ← 로고 + 광고 + 하단 네비 고정 래퍼
│   │   ├── TopAdBanner.tsx       ← AdSense 상단 고정 광고
│   │   └── BottomNav.tsx         ← 하단 네비게이션
│   │
│   ├── feed/
│   │   ├── DiarySwiper.tsx       ← Swiper 래퍼 (touchAngle, nested 설정)
│   │   └── DiaryCard.tsx         ← 카드 (header/content/footer 구조)
│   │
│   ├── diary/
│   │   ├── CardHeader.tsx        ← 닉네임(텍스트) + 별 버튼(직접 토글) + 번역 버튼
│   │   ├── CardContent.tsx       ← 배경 + 제목 + 본문 (스크롤 영역)
│   │   └── CardFooter.tsx        ← 날짜 + 반응 버튼 + 신고 버튼
│   │
│   ├── user/
│   │   ├── FollowingPopup.tsx    ← 팔로잉 목록 팝업 (언팔로우)
│   │   └── FollowerPopup.tsx     ← 팔로워 목록 팝업 (팔로우/언팔로우)
│   │
│   └── write/
│       ├── ContentEditor.tsx     ← textarea + 500자 카운터
│       └── BackgroundPicker.tsx  ← 배경 색상/이미지 선택
│
└── lib/
    ├── supabase.ts               ← Supabase 클라이언트
    ├── feedAlgorithm.ts          ← 피드 노출 순서 쿼리 로직
    └── auth.ts                   ← Google OAuth 로그인/로그아웃
```
