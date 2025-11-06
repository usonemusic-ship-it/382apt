// Cloudflare Bindings 타입 정의
export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
}

// 사용자 타입
export type User = {
  id: number;
  phone: string;
  password: string;
  nickname: string;
  dong: string;
  ho: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

// 게시글 타입
export type Post = {
  id: number;
  user_id: number;
  category: 'suggestion' | 'in_progress' | 'resolved';
  title: string;
  content: string;
  status: 'active' | 'deleted';
  created_at: string;
  updated_at: string;
}

// 댓글 타입
export type Comment = {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  status: 'active' | 'deleted';
  created_at: string;
}

// 파일 타입
export type FileRecord = {
  id: number;
  post_id: number | null;
  comment_id: number | null;
  user_id: number;
  filename: string;
  filesize: number;
  filetype: string;
  url: string;
  created_at: string;
}

// API 응답 타입
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 게시글 상세 (작성자 정보 포함)
export type PostDetail = Post & {
  author_nickname: string;
  author_dong: string;
  author_ho: string;
  comments?: CommentDetail[];
  files?: FileRecord[];
}

// 댓글 상세 (작성자 정보 포함)
export type CommentDetail = Comment & {
  author_nickname: string;
  author_dong: string;
  author_ho: string;
}
