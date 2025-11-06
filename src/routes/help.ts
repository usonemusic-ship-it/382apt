import { Hono } from 'hono';
import { Bindings, User, ApiResponse } from '../types';
import { authMiddleware } from '../utils/auth';

const help = new Hono<{ Bindings: Bindings }>();

// 모든 도움 요청 목록 조회
help.get('/requests', async (c) => {
  try {
    const status = c.req.query('status');
    const category = c.req.query('category');

    let query = `
      SELECT 
        h.*,
        u.nickname as author_nickname,
        u.dong as author_dong,
        u.ho as author_ho,
        (SELECT COUNT(*) FROM help_applications WHERE help_request_id = h.id) as application_count
      FROM help_requests h
      JOIN users u ON h.user_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ' AND h.status = ?';
      params.push(status);
    }
    
    if (category) {
      query += ' AND h.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY h.created_at DESC';

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    return c.json<ApiResponse>({ 
      success: true, 
      data: results
    });
  } catch (error) {
    console.error('Get help requests error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '도움 요청 목록 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 도움 요청 상세 조회
help.get('/requests/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const request = await c.env.DB.prepare(`
      SELECT 
        h.*,
        u.nickname as author_nickname,
        u.dong as author_dong,
        u.ho as author_ho,
        u.phone as author_phone
      FROM help_requests h
      JOIN users u ON h.user_id = u.id
      WHERE h.id = ?
    `).bind(id).first();

    if (!request) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '도움 요청을 찾을 수 없습니다' 
      }, 404);
    }

    const user = c.get('user') as User | undefined;
    let applications = [];
    
    if (user && (user.id === (request as any).user_id || user.role === 'admin')) {
      const { results } = await c.env.DB.prepare(`
        SELECT 
          a.*,
          u.nickname,
          u.dong,
          u.ho,
          u.phone
        FROM help_applications a
        JOIN users u ON a.user_id = u.id
        WHERE a.help_request_id = ?
        ORDER BY a.created_at DESC
      `).bind(id).all();
      applications = results;
    }

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        ...request,
        applications
      }
    });
  } catch (error) {
    console.error('Get help request error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '도움 요청 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 도움 요청 작성
help.post('/requests', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const { title, content, location, category, pay } = await c.req.json();

    if (!title || !content || !category) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '필수 항목을 입력해주세요' 
      }, 400);
    }

    const validCategories = ['강아지산책', '고양이돌봄', '재활용버리기', '집안일', '병원동행', '기타'];
    if (!validCategories.includes(category)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '올바른 카테고리를 선택해주세요' 
      }, 400);
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO help_requests (user_id, title, content, location, category, pay) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.id, title, content, location || '', category, pay || 0).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '도움 요청이 등록되었습니다',
      data: { id: result.meta.last_row_id }
    });
  } catch (error) {
    console.error('Create help request error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '도움 요청 등록 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 도움 요청 수정
help.put('/requests/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = c.req.param('id');
    const { title, content, location, category, pay, status } = await c.req.json();

    const request = await c.env.DB.prepare(
      'SELECT * FROM help_requests WHERE id = ?'
    ).bind(id).first<any>();

    if (!request) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '도움 요청을 찾을 수 없습니다' 
      }, 404);
    }

    if (request.user_id !== user.id && user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '수정 권한이 없습니다' 
      }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE help_requests SET title = ?, content = ?, location = ?, category = ?, pay = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(title, content, location, category, pay, status, id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '도움 요청이 수정되었습니다' 
    });
  } catch (error) {
    console.error('Update help request error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '도움 요청 수정 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 도움 요청 삭제
help.delete('/requests/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = c.req.param('id');

    const request = await c.env.DB.prepare(
      'SELECT * FROM help_requests WHERE id = ?'
    ).bind(id).first<any>();

    if (!request) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '도움 요청을 찾을 수 없습니다' 
      }, 404);
    }

    if (request.user_id !== user.id && user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '삭제 권한이 없습니다' 
      }, 403);
    }

    await c.env.DB.prepare('DELETE FROM help_requests WHERE id = ?').bind(id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '도움 요청이 삭제되었습니다' 
    });
  } catch (error) {
    console.error('Delete help request error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '도움 요청 삭제 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 도움 신청하기
help.post('/requests/:id/apply', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = c.req.param('id');
    const { message } = await c.req.json();

    const request = await c.env.DB.prepare(
      'SELECT * FROM help_requests WHERE id = ? AND status = ?'
    ).bind(id, 'open').first<any>();

    if (!request) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '모집 중인 도움 요청이 아닙니다' 
      }, 404);
    }

    if (request.user_id === user.id) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '본인의 도움 요청에는 신청할 수 없습니다' 
      }, 400);
    }

    const existing = await c.env.DB.prepare(
      'SELECT * FROM help_applications WHERE help_request_id = ? AND user_id = ?'
    ).bind(id, user.id).first();

    if (existing) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '이미 신청하셨습니다' 
      }, 400);
    }

    await c.env.DB.prepare(
      'INSERT INTO help_applications (help_request_id, user_id, message) VALUES (?, ?, ?)'
    ).bind(id, user.id, message || '').run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '신청이 완료되었습니다' 
    });
  } catch (error) {
    console.error('Apply help request error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '신청 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 도움 신청 취소
help.delete('/requests/:id/apply', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = c.req.param('id');

    await c.env.DB.prepare(
      'DELETE FROM help_applications WHERE help_request_id = ? AND user_id = ?'
    ).bind(id, user.id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '신청이 취소되었습니다' 
    });
  } catch (error) {
    console.error('Cancel application error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '신청 취소 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 신청 수락/거절
help.patch('/applications/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = c.req.param('id');
    const { status } = await c.req.json();

    if (!['accepted', 'rejected'].includes(status)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '올바른 상태가 아닙니다' 
      }, 400);
    }

    const application = await c.env.DB.prepare(`
      SELECT a.*, h.user_id as request_user_id
      FROM help_applications a
      JOIN help_requests h ON a.help_request_id = h.id
      WHERE a.id = ?
    `).bind(id).first<any>();

    if (!application) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '신청을 찾을 수 없습니다' 
      }, 404);
    }

    if (application.request_user_id !== user.id && user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '처리 권한이 없습니다' 
      }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE help_applications SET status = ? WHERE id = ?'
    ).bind(status, id).run();

    if (status === 'accepted') {
      await c.env.DB.prepare(
        'UPDATE help_requests SET status = ? WHERE id = ?'
      ).bind('in_progress', application.help_request_id).run();
    }

    return c.json<ApiResponse>({ 
      success: true, 
      message: status === 'accepted' ? '신청이 수락되었습니다' : '신청이 거절되었습니다' 
    });
  } catch (error) {
    console.error('Update application status error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '처리 중 오류가 발생했습니다' 
    }, 500);
  }
});

export default help;
