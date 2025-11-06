-- 게시글 투표 테이블
CREATE TABLE IF NOT EXISTS post_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  vote_type TEXT NOT NULL, -- single(단일선택), multiple(복수선택)
  end_date DATETIME,
  status TEXT DEFAULT 'active', -- active, closed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- 투표 선택지 테이블
CREATE TABLE IF NOT EXISTS vote_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vote_id INTEGER NOT NULL,
  option_text TEXT NOT NULL,
  option_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vote_id) REFERENCES post_votes(id)
);

-- 사용자 투표 기록 테이블
CREATE TABLE IF NOT EXISTS user_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vote_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vote_id) REFERENCES post_votes(id),
  FOREIGN KEY (option_id) REFERENCES vote_options(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(vote_id, option_id, user_id)
);

-- 게시글 좋아요 테이블
CREATE TABLE IF NOT EXISTS post_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(post_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_vote_options_vote_id ON vote_options(vote_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_vote_id ON user_votes(vote_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_user_id ON user_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
