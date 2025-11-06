-- 도움 요청 테이블
CREATE TABLE IF NOT EXISTS help_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  location TEXT, -- 동/호 또는 구체적 위치
  category TEXT NOT NULL, -- 강아지산책, 고양이돌봄, 재활용버리기, 집안일, 병원동행, 기타
  pay INTEGER DEFAULT 0, -- 알바비 (원 단위)
  status TEXT DEFAULT 'open', -- open(모집중), in_progress(진행중), closed(마감)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 도움 신청 테이블
CREATE TABLE IF NOT EXISTS help_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  help_request_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  message TEXT, -- 신청 메시지
  status TEXT DEFAULT 'pending', -- pending(대기), accepted(수락), rejected(거절)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (help_request_id) REFERENCES help_requests(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(help_request_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_applications_help_request_id ON help_applications(help_request_id);
CREATE INDEX IF NOT EXISTS idx_help_applications_user_id ON help_applications(user_id);
