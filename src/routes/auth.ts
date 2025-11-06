import { Hono } from 'hono';
import { Bindings, User, ApiResponse } from '../types';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';

const auth = new Hono<{ Bindings: Bindings }>();

// 회원가입 (수동 승인 대기)
auth.post('/register', async (c) => {
  try {
    const { phone, password, nickname, dong, ho } = await c.req.json();

    // 입력 검증
    if (!phone || !password || !nickname || !dong || !ho) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '모든 필드를 입력해주세요' 
      }, 400);
    }

    // 전화번호 중복 확인
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE phone = ?'
    ).bind(phone).first();

    if (existingUser) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '이미 등록된 전화번호입니다' 
      }, 400);
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 사용자 등록 (pending 상태)
    const result = await c.env.DB.prepare(
      'INSERT INTO users (phone, password, nickname, dong, ho) VALUES (?, ?, ?, ?, ?)'
    ).bind(phone, hashedPassword, nickname, dong, ho).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '가입 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
      data: { id: result.meta.last_row_id }
    });
  } catch (error) {
    console.error('Register error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '회원가입 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 로그인
auth.post('/login', async (c) => {
  try {
    const { phone, password } = await c.req.json();

    if (!phone || !password) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '전화번호와 비밀번호를 입력해주세요' 
      }, 400);
    }

    // 사용자 조회
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE phone = ?'
    ).bind(phone).first<User>();

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '전화번호 또는 비밀번호가 일치하지 않습니다' 
      }, 401);
    }

    // 승인 상태 확인
    if (user.status === 'pending') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '관리자 승인 대기 중입니다' 
      }, 403);
    }

    if (user.status === 'rejected') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '가입이 거부되었습니다. 관리자에게 문의하세요' 
      }, 403);
    }

    // 비밀번호 검증 (평문 또는 해시)
    let isValid = false;
    
    // 평문 비밀번호 체크 (seed 데이터용)
    if (user.password === password) {
      isValid = true;
    } else {
      // 해시된 비밀번호 체크
      isValid = await verifyPassword(password, user.password);
    }
    
    if (!isValid) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '전화번호 또는 비밀번호가 일치하지 않습니다' 
      }, 401);
    }

    // 토큰 생성
    const token = generateToken(user.id);

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;

    return c.json<ApiResponse>({ 
      success: true, 
      data: { 
        token, 
        user: userWithoutPassword 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '로그인 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 내 정보 조회
auth.get('/me', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '인증이 필요합니다' 
      }, 401);
    }

    const decoded = JSON.parse(atob(token));
    const user = await c.env.DB.prepare(
      'SELECT id, phone, nickname, dong, ho, role, status, created_at FROM users WHERE id = ?'
    ).bind(decoded.userId).first<User>();

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '사용자를 찾을 수 없습니다' 
      }, 404);
    }

    return c.json<ApiResponse>({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '사용자 정보 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

export default auth;
