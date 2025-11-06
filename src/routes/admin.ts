import { Hono } from 'hono';
import { Bindings, User, ApiResponse } from '../types';
import { authMiddleware, adminMiddleware } from '../utils/auth';

const admin = new Hono<{ Bindings: Bindings }>();

// 모든 관리자 API는 인증 + 관리자 권한 필요
admin.use('*', authMiddleware, adminMiddleware);

// 가입 신청 목록 조회
admin.get('/pending-users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, phone, nickname, dong, ho, created_at 
      FROM users 
      WHERE status = 'pending' 
      ORDER BY created_at DESC
    `).all();

    return c.json<ApiResponse>({ 
      success: true, 
      data: results 
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '가입 신청 목록 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 회원 승인
admin.post('/approve-user/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND status = ?'
    ).bind(id, 'pending').first();

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '대기 중인 사용자를 찾을 수 없습니다' 
      }, 404);
    }

    await c.env.DB.prepare(
      'UPDATE users SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind('approved', id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '회원이 승인되었습니다' 
    });
  } catch (error) {
    console.error('Approve user error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '회원 승인 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 회원 거부
admin.post('/reject-user/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND status = ?'
    ).bind(id, 'pending').first();

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '대기 중인 사용자를 찾을 수 없습니다' 
      }, 404);
    }

    await c.env.DB.prepare(
      'UPDATE users SET status = ?, rejected_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind('rejected', id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '회원 가입이 거부되었습니다' 
    });
  } catch (error) {
    console.error('Reject user error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '회원 거부 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 모든 회원 목록 조회
admin.get('/users', async (c) => {
  try {
    const status = c.req.query('status'); // approved, pending, rejected
    
    let query = `
      SELECT id, phone, nickname, dong, ho, status, role, created_at, approved_at 
      FROM users
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    return c.json<ApiResponse>({ 
      success: true, 
      data: results 
    });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '회원 목록 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 회원 삭제
admin.delete('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user') as User;

    // 자기 자신은 삭제 불가
    if (currentUser.id === parseInt(id)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '자기 자신은 삭제할 수 없습니다' 
      }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(id).first();

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '사용자를 찾을 수 없습니다' 
      }, 404);
    }

    // 완전 삭제 (또는 소프트 삭제로 변경 가능)
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '회원이 삭제되었습니다' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '회원 삭제 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 통계 조회
admin.get('/stats', async (c) => {
  try {
    // 회원 통계
    const userStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM users
    `).first();

    // 게시글 통계
    const postStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN category = 'suggestion' THEN 1 ELSE 0 END) as suggestions,
        SUM(CASE WHEN category = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN category = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM posts
      WHERE status = 'active'
    `).first();

    // 댓글 통계
    const commentStats = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM comments WHERE status = ?'
    ).bind('active').first();

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        users: userStats,
        posts: postStats,
        comments: commentStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '통계 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

export default admin;
