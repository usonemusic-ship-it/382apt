# 한마을아파트 개선 포럼

> 우리 아파트의 불편사항과 개선 아이디어를 주민들이 자유롭게 제안하고, 서로 의견을 나누며 해결 과정을 기록할 수 있는 커뮤니티 웹사이트

## 🌐 현재 접속 URL

- **개발 서버**: https://3000-i3vnukr2z8szhx01ff0gq-2b54fc91.sandbox.novita.ai
- **배포 예정**: Cloudflare Pages

## 📋 프로젝트 개요

### 목표
- 불만만 쏟는 공간이 아니라, 실제 해결을 위한 토론 플랫폼
- 카톡방에서 나온 논의나 제안을 정리하고 공유할 수 있는 구조

### 현재 완료된 기능 ✅

#### 1. 회원가입 및 로그인
- **수동 승인 시스템**: 관리자가 직접 전화/문자로 본인 확인 후 승인
- 회원가입: 전화번호 + 비밀번호 + 닉네임 + 동/호수
- 로그인: 전화번호 + 비밀번호
- 승인 대기 / 승인 완료 / 거부 상태 관리

#### 2. 게시판 기능
- **카테고리 구분**: 
  - 제안하기 (suggestion)
  - 진행 중 (in_progress)
  - 해결됨 (resolved)
- 게시글 작성, 수정, 삭제
- 게시글 목록 조회 (카테고리별 필터링)
- 게시글 상세 보기

#### 3. 댓글 기능
- 게시글별 댓글 작성
- 댓글 수정, 삭제
- 작성자 닉네임 및 동/호수 표시

#### 4. 파일 업로드
- 이미지 업로드 지원 (JPEG, PNG, GIF, WebP)
- 동영상 업로드 지원 (MP4, WebM, QuickTime)
- 파일 크기 제한: 최대 50MB
- R2 스토리지에 저장

#### 5. 관리자 페이지
- 가입 신청 승인/거부
- 회원 목록 관리
- 게시글 카테고리 변경 (진행 상태 관리)
- 통계 대시보드 (회원 수, 게시글 수)

#### 6. 투표 기능 ✨ NEW
- 게시글마다 투표 생성 가능 (작성자 또는 관리자)
- 단일 선택 / 복수 선택 투표 지원
- 실시간 투표 결과 표시 (투표 수, 비율)
- 투표 마감일 설정 가능
- 투표 종료 기능 (작성자/관리자)
- 내가 투표한 항목 표시

#### 7. 좋아요 기능 ✨ NEW
- 게시글 좋아요/취소 토글
- 좋아요 개수 실시간 표시
- 로그인 사용자만 가능
- 내가 좋아요한 게시글 표시

#### 8. 검색 기능 ✨ NEW
- 게시글 제목/내용 전체 검색
- 카테고리와 함께 필터링 가능
- 검색어 초기화 기능
- 실시간 검색

#### 9. 파일 업로드 UI ✨ NEW
- 게시글 작성 시 파일 첨부 UI
- 이미지/동영상 미리보기
- 여러 파일 동시 업로드 지원
- 파일명, 크기 표시

## 🎨 주요 기능 URI

### 공개 API (인증 불필요)
| 기능 | Method | URI | 설명 |
|------|--------|-----|------|
| 게시글 목록 | GET | `/api/posts` | 전체 게시글 목록 |
| 게시글 목록 (카테고리별) | GET | `/api/posts?category=suggestion` | 카테고리별 필터링 |
| 게시글 상세 | GET | `/api/posts/:id` | 댓글 및 파일 포함 |

### 인증 API
| 기능 | Method | URI | 파라미터 |
|------|--------|-----|----------|
| 회원가입 | POST | `/api/auth/register` | `{ phone, password, nickname, dong, ho }` |
| 로그인 | POST | `/api/auth/login` | `{ phone, password }` |
| 내 정보 | GET | `/api/auth/me` | Header: `Authorization: Bearer <token>` |

### 게시글 API (인증 필요)
| 기능 | Method | URI | 파라미터 |
|------|--------|-----|----------|
| 게시글 작성 | POST | `/api/posts` | `{ category, title, content }` |
| 게시글 수정 | PUT | `/api/posts/:id` | `{ category, title, content }` |
| 게시글 삭제 | DELETE | `/api/posts/:id` | - |

### 댓글 API (인증 필요)
| 기능 | Method | URI | 파라미터 |
|------|--------|-----|----------|
| 댓글 작성 | POST | `/api/comments` | `{ post_id, content }` |
| 댓글 수정 | PUT | `/api/comments/:id` | `{ content }` |
| 댓글 삭제 | DELETE | `/api/comments/:id` | - |

### 파일 업로드 API (인증 필요)
| 기능 | Method | URI | 파라미터 |
|------|--------|-----|----------|
| 파일 업로드 | POST | `/api/files` | `FormData: { file, post_id?, comment_id? }` |
| 파일 조회 | GET | `/api/files/:filename` | - |
| 파일 삭제 | DELETE | `/api/files/:id` | - |

### 관리자 API (관리자 전용)
| 기능 | Method | URI | 설명 |
|------|--------|-----|------|
| 가입 신청 목록 | GET | `/api/admin/pending-users` | 승인 대기 중인 회원 |
| 회원 승인 | POST | `/api/admin/approve-user/:id` | - |
| 회원 거부 | POST | `/api/admin/reject-user/:id` | - |
| 회원 목록 | GET | `/api/admin/users` | 전체 회원 목록 |
| 회원 삭제 | DELETE | `/api/admin/users/:id` | - |
| 통계 조회 | GET | `/api/admin/stats` | 회원/게시글/댓글 통계 |
| 카테고리 변경 | PATCH | `/api/posts/:id/category` | `{ category }` |

### 투표 API ✨ NEW
| 기능 | Method | URI | 파라미터 |
|------|--------|-----|----------|
| 투표 생성 | POST | `/api/votes` | `{ post_id, title, description?, vote_type, end_date?, options }` |
| 투표 조회 | GET | `/api/votes/post/:post_id` | 투표 정보 및 결과 |
| 투표하기 | POST | `/api/votes/:vote_id/cast` | `{ option_ids }` |
| 투표 종료 | POST | `/api/votes/:vote_id/close` | - |

### 좋아요 API ✨ NEW
| 기능 | Method | URI | 설명 |
|------|--------|-----|------|
| 좋아요 토글 | POST | `/api/likes/posts/:post_id` | 좋아요 추가/취소 |
| 좋아요 조회 | GET | `/api/likes/posts/:post_id` | 좋아요 개수 및 내 상태 |

### 검색 기능 ✨ NEW
게시글 목록 API에 `search` 쿼리 파라미터 추가:
- `/api/posts?search=검색어`
- `/api/posts?category=suggestion&search=검색어`

## 💾 데이터 구조

### 데이터베이스: Cloudflare D1 (SQLite)

#### users 테이블
```sql
- id: INTEGER (PK)
- phone: TEXT (UNIQUE) - 전화번호
- password: TEXT - 해시된 비밀번호
- nickname: TEXT - 닉네임
- dong: TEXT - 동
- ho: TEXT - 호
- status: TEXT - pending/approved/rejected
- role: TEXT - user/admin
- created_at: DATETIME
- approved_at: DATETIME
- rejected_at: DATETIME
```

#### posts 테이블
```sql
- id: INTEGER (PK)
- user_id: INTEGER (FK)
- category: TEXT - suggestion/in_progress/resolved
- title: TEXT - 제목
- content: TEXT - 내용
- status: TEXT - active/deleted
- created_at: DATETIME
- updated_at: DATETIME
```

#### comments 테이블
```sql
- id: INTEGER (PK)
- post_id: INTEGER (FK)
- user_id: INTEGER (FK)
- content: TEXT - 댓글 내용
- status: TEXT - active/deleted
- created_at: DATETIME
```

#### files 테이블
```sql
- id: INTEGER (PK)
- post_id: INTEGER (FK, nullable)
- comment_id: INTEGER (FK, nullable)
- user_id: INTEGER (FK)
- filename: TEXT - 원본 파일명
- filesize: INTEGER - 파일 크기 (bytes)
- filetype: TEXT - MIME 타입
- url: TEXT - 파일 URL
- created_at: DATETIME
```

#### post_votes 테이블 ✨ NEW
```sql
- id: INTEGER (PK)
- post_id: INTEGER (FK)
- title: TEXT - 투표 제목
- description: TEXT - 투표 설명
- vote_type: TEXT - single/multiple
- end_date: DATETIME - 마감일
- status: TEXT - active/closed
- created_at: DATETIME
```

#### vote_options 테이블 ✨ NEW
```sql
- id: INTEGER (PK)
- vote_id: INTEGER (FK)
- option_text: TEXT - 선택지 텍스트
- option_order: INTEGER - 순서
- created_at: DATETIME
```

#### user_votes 테이블 ✨ NEW
```sql
- id: INTEGER (PK)
- vote_id: INTEGER (FK)
- option_id: INTEGER (FK)
- user_id: INTEGER (FK)
- created_at: DATETIME
- UNIQUE(vote_id, option_id, user_id)
```

#### post_likes 테이블 ✨ NEW
```sql
- id: INTEGER (PK)
- post_id: INTEGER (FK)
- user_id: INTEGER (FK)
- created_at: DATETIME
- UNIQUE(post_id, user_id)
```

### 스토리지: Cloudflare R2
- 이미지 및 동영상 파일 저장
- 경로: `uploads/[timestamp]-[random].[extension]`

## 🧪 테스트 계정

개발 환경에서 다음 테스트 계정을 사용할 수 있습니다:

### 관리자 계정
- **전화번호**: 01020410336
- **비밀번호**: 4862
- **닉네임**: 관리자
- **동/호**: 101동 101호

### 일반 사용자 (승인됨)
- **전화번호**: 01011112222
- **비밀번호**: user1234
- **닉네임**: 김주민
- **동/호**: 102동 201호

### 승인 대기 중인 사용자
- **전화번호**: 01055556666
- **비밀번호**: user1234
- **닉네임**: 박대기
- **동/호**: 104동 401호

## 🚀 사용 방법

### 1. 일반 사용자 (주민)

#### 회원가입
1. 메인 페이지 우측 상단 "회원가입" 클릭
2. 전화번호, 비밀번호, 닉네임, 동/호수 입력
3. 가입 신청 완료 → 관리자 승인 대기
4. 관리자가 전화/문자로 본인 확인 후 승인
5. 승인 후 로그인 가능

#### 제안 작성하기
1. 로그인 후 "새 제안 작성하기" 버튼 클릭
2. 카테고리 선택 (제안하기/진행중/해결됨)
3. 제목과 내용 입력
4. 작성 완료

#### 댓글 작성
1. 게시글 상세 페이지에서 댓글 입력
2. "댓글 작성" 버튼 클릭

#### 파일 업로드
- 현재 프론트엔드 UI에는 미구현 (API는 준비됨)
- 추후 업데이트 예정

### 2. 관리자

#### 회원 승인하기
1. 관리자 계정으로 로그인
2. 우측 상단 "관리자" 버튼 클릭
3. "가입 승인 대기 목록"에서 신청자 확인
4. 전화번호로 직접 연락하여 본인 확인
5. "승인" 또는 "거부" 버튼 클릭

#### 진행 상태 변경
1. 게시글 상세 페이지
2. 상단의 "제안" "진행중" "해결" 버튼 클릭
3. 카테고리 자동 변경

#### 게시글/댓글 관리
- 모든 게시글과 댓글 삭제 가능
- 우측 쓰레기통 아이콘 클릭

## 🛠️ 기술 스택

### 프론트엔드
- **HTML/CSS/JavaScript** (Vanilla JS)
- **TailwindCSS** (CDN)
- **Font Awesome** (아이콘)
- **Axios** (HTTP 클라이언트)

### 백엔드
- **Hono** (경량 웹 프레임워크)
- **TypeScript**
- **Cloudflare Workers** (엣지 런타임)

### 데이터베이스 & 스토리지
- **Cloudflare D1** (SQLite 기반)
- **Cloudflare R2** (파일 스토리지)

### 배포
- **Cloudflare Pages** (정적 사이트 + Workers)

## 📦 로컬 개발 환경 설정

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd webapp
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 데이터베이스 초기화
```bash
# 마이그레이션 적용
npm run db:migrate:local

# 테스트 데이터 삽입
npm run db:seed
```

### 4. 개발 서버 실행
```bash
# 빌드
npm run build

# PM2로 서버 시작
pm2 start ecosystem.config.cjs

# 또는 직접 실행
npm run dev:sandbox
```

### 5. 접속
```
http://localhost:3000
```

## 📝 향후 개선 예정 사항

### 기능 추가
- [x] 파일 업로드 프론트엔드 UI 구현 ✅
- [x] 게시글 검색 기능 ✅
- [x] 게시글 좋아요 기능 ✅
- [x] 투표 기능 ✅
- [ ] 이미지 자동 압축 기능 (브라우저에서 리사이징)
- [ ] 알림 기능 (댓글, 상태 변경, 투표)
- [ ] 이메일 알림 (가입 승인 시)
- [ ] 공지사항 고정 기능

### UI/UX 개선
- [ ] 다크모드 지원
- [ ] 이미지 갤러리 뷰 (Lightbox)
- [ ] 모바일 반응형 최적화
- [ ] 무한 스크롤
- [ ] 투표 결과 그래프 시각화

### 관리 기능
- [ ] 통계 그래프 시각화 (Chart.js)
- [ ] 회원 활동 로그
- [ ] 신고 기능
- [ ] 게시글 자동 분류 (AI)

## 🚀 배포 가이드

### Cloudflare Pages 배포

1. **D1 데이터베이스 생성**
```bash
npx wrangler d1 create webapp-production
```

2. **wrangler.jsonc에 database_id 업데이트**

3. **프로덕션 마이그레이션**
```bash
npm run db:migrate:prod
```

4. **R2 버킷 생성**
```bash
npx wrangler r2 bucket create hanmaul-files
```

5. **빌드 및 배포**
```bash
npm run deploy:prod
```

## 📞 문의하기

관리자 이메일: admin@example.com

---

**Last Updated**: 2025-11-06
**Version**: 1.0.0
**Status**: ✅ 개발 완료, 배포 대기 중
