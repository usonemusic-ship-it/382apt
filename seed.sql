-- 관리자 계정
-- 전화번호: 01020410336, 비밀번호: 4862
INSERT OR IGNORE INTO users (phone, password, nickname, dong, ho, status, role, approved_at) 
VALUES ('01020410336', '4862', '관리자', '101', '101', 'approved', 'admin', CURRENT_TIMESTAMP);

-- 테스트용 일반 사용자 (승인된 상태)
INSERT OR IGNORE INTO users (phone, password, nickname, dong, ho, status, role, approved_at) 
VALUES ('01011112222', 'user1234', '김주민', '102', '201', 'approved', 'user', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO users (phone, password, nickname, dong, ho, status, role, approved_at) 
VALUES ('01033334444', 'user1234', '이이웃', '103', '301', 'approved', 'user', CURRENT_TIMESTAMP);

-- 테스트용 대기중인 사용자
INSERT OR IGNORE INTO users (phone, password, nickname, dong, ho, status, role) 
VALUES ('01055556666', 'user1234', '박대기', '104', '401', 'pending', 'user');

-- 테스트용 게시글
INSERT OR IGNORE INTO posts (user_id, category, title, content) 
VALUES (2, 'suggestion', '엘리베이터 버튼 고장 수리 요청', '102동 엘리베이터 3층 버튼이 작동하지 않습니다. 수리가 필요합니다.');

INSERT OR IGNORE INTO posts (user_id, category, title, content) 
VALUES (2, 'suggestion', '주차장 조명 개선 제안', '지하주차장 B2층 조명이 어두워서 안전에 문제가 있습니다. LED 조명으로 교체하면 좋겠습니다.');

INSERT OR IGNORE INTO posts (user_id, category, title, content) 
VALUES (3, 'in_progress', '놀이터 안전매트 교체 진행중', '어린이 놀이터 안전매트가 노후되어 교체 작업을 진행하고 있습니다. 다음주 완료 예정입니다.');

INSERT OR IGNORE INTO posts (user_id, category, title, content) 
VALUES (3, 'resolved', '재활용 분리수거함 추가 설치 완료', '주민분들의 요청으로 재활용 분리수거함을 3개 추가로 설치했습니다.');

-- 테스트용 댓글
INSERT OR IGNORE INTO comments (post_id, user_id, content) 
VALUES (1, 3, '저도 며칠 전부터 같은 문제를 겪고 있습니다. 빠른 수리 부탁드립니다.');

INSERT OR IGNORE INTO comments (post_id, user_id, content) 
VALUES (1, 2, '관리사무소에 연락했습니다. 내일 점검 예정이라고 합니다.');

INSERT OR IGNORE INTO comments (post_id, user_id, content) 
VALUES (2, 3, '좋은 제안입니다. 특히 밤에 차 찾을 때 정말 어둡더라고요.');
