-- 회원 테이블 (수동 승인 방식)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT NOT NULL,
  dong TEXT NOT NULL,
  ho TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  role TEXT DEFAULT 'user',  -- user, admin
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  rejected_at DATETIME
);

-- 게시글 테이블
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,  -- suggestion(제안하기), in_progress(진행중), resolved(해결됨)
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'active',  -- active, deleted
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'active',  -- active, deleted
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 파일 테이블 (이미지, 동영상)
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  comment_id INTEGER,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  filesize INTEGER NOT NULL,
  filetype TEXT NOT NULL,  -- image/jpeg, video/mp4 등
  url TEXT NOT NULL,  -- R2 storage URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (comment_id) REFERENCES comments(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_files_post_id ON files(post_id);
CREATE INDEX IF NOT EXISTS idx_files_comment_id ON files(comment_id);
