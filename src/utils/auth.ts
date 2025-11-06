import { Context } from 'hono';
import { Bindings, User } from '../types';

// 간단한 비밀번호 해싱 (실제 환경에서는 bcrypt 등 사용 권장)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 비밀번호 검증
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}

// 세션 토큰 생성 (간단한 JWT 대용)
export function generateToken(userId: number): string {
  const data = {
    userId,
    timestamp: Date.now()
  };
  return btoa(JSON.stringify(data));
}

// 세션 토큰 검증
export function verifyToken(token: string): { userId: number } | null {
  try {
    const data = JSON.parse(atob(token));
    // 24시간 유효
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    return { userId: data.userId };
  } catch {
    return null;
  }
}

// 인증 미들웨어
export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Function) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ success: false, error: '인증이 필요합니다' }, 401);
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return c.json({ success: false, error: '유효하지 않은 토큰입니다' }, 401);
  }

  // 사용자 정보 조회
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ? AND status = ?'
  ).bind(decoded.userId, 'approved').first<User>();

  if (!user) {
    return c.json({ success: false, error: '승인되지 않은 사용자입니다' }, 401);
  }

  // 사용자 정보를 context에 저장
  c.set('user', user);
  await next();
}

// 관리자 권한 확인 미들웨어
export async function adminMiddleware(c: Context<{ Bindings: Bindings }>, next: Function) {
  const user = c.get('user') as User;
  
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, error: '관리자 권한이 필요합니다' }, 403);
  }

  await next();
}
