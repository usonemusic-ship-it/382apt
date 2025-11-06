import { Hono } from 'hono';
import { Bindings, User, ApiResponse } from '../types';
import { authMiddleware } from '../utils/auth';

const votes = new Hono<{ Bindings: Bindings }>();

// 투표 생성 (인증 필요)
votes.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const { post_id, title, description, vote_type, end_date, options } = await c.req.json();

    if (!post_id || !title || !vote_type || !options || !Array.isArray(options) || options.length < 2) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '필수 정보를 모두 입력하고, 최소 2개 이상의 선택지를 제공해주세요' 
      }, 400);
    }

    // 게시글 존재 및 권한 확인
    const post = await c.env.DB.prepare(
      'SELECT * FROM posts WHERE id = ? AND status = ?'
    ).bind(post_id, 'active').first<any>();

    if (!post) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '게시글을 찾을 수 없습니다' 
      }, 404);
    }

    // 작성자 또는 관리자만 투표 생성 가능
    if (post.user_id !== user.id && user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '투표 생성 권한이 없습니다' 
      }, 403);
    }

    // 투표 생성
    const voteResult = await c.env.DB.prepare(
      'INSERT INTO post_votes (post_id, title, description, vote_type, end_date) VALUES (?, ?, ?, ?, ?)'
    ).bind(post_id, title, description || null, vote_type, end_date || null).run();

    const voteId = voteResult.meta.last_row_id;

    // 선택지 생성
    for (let i = 0; i < options.length; i++) {
      await c.env.DB.prepare(
        'INSERT INTO vote_options (vote_id, option_text, option_order) VALUES (?, ?, ?)'
      ).bind(voteId, options[i], i).run();
    }

    return c.json<ApiResponse>({ 
      success: true, 
      message: '투표가 생성되었습니다',
      data: { id: voteId }
    });
  } catch (error) {
    console.error('Create vote error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '투표 생성 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 특정 게시글의 투표 조회
votes.get('/post/:post_id', async (c) => {
  try {
    const post_id = c.req.param('post_id');

    // 투표 정보 조회
    const vote = await c.env.DB.prepare(
      'SELECT * FROM post_votes WHERE post_id = ? AND status = ?'
    ).bind(post_id, 'active').first<any>();

    if (!vote) {
      return c.json<ApiResponse>({ 
        success: true, 
        data: null 
      });
    }

    // 선택지 및 투표 결과 조회
    const { results: options } = await c.env.DB.prepare(`
      SELECT 
        vo.*,
        COUNT(uv.id) as vote_count
      FROM vote_options vo
      LEFT JOIN user_votes uv ON vo.id = uv.option_id
      WHERE vo.vote_id = ?
      GROUP BY vo.id
      ORDER BY vo.option_order
    `).bind(vote.id).all();

    // 총 투표 수
    const totalVotes = options.reduce((sum: number, opt: any) => sum + (opt.vote_count || 0), 0);

    // 내가 투표했는지 확인 (로그인 시)
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let myVotes: any[] = [];
    
    if (token) {
      try {
        const decoded = JSON.parse(atob(token));
        const { results } = await c.env.DB.prepare(
          'SELECT option_id FROM user_votes WHERE vote_id = ? AND user_id = ?'
        ).bind(vote.id, decoded.userId).all();
        myVotes = results.map((v: any) => v.option_id);
      } catch (e) {
        // 토큰 오류는 무시
      }
    }

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        ...vote,
        options,
        total_votes: totalVotes,
        my_votes: myVotes
      }
    });
  } catch (error) {
    console.error('Get vote error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '투표 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 투표하기 (인증 필요)
votes.post('/:vote_id/cast', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const vote_id = c.req.param('vote_id');
    const { option_ids } = await c.req.json();

    if (!option_ids || !Array.isArray(option_ids) || option_ids.length === 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '선택지를 선택해주세요' 
      }, 400);
    }

    // 투표 정보 확인
    const vote = await c.env.DB.prepare(
      'SELECT * FROM post_votes WHERE id = ? AND status = ?'
    ).bind(vote_id, 'active').first<any>();

    if (!vote) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '투표를 찾을 수 없거나 종료되었습니다' 
      }, 404);
    }

    // 마감일 확인
    if (vote.end_date && new Date(vote.end_date) < new Date()) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '투표가 마감되었습니다' 
      }, 400);
    }

    // 단일 선택 확인
    if (vote.vote_type === 'single' && option_ids.length > 1) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '하나의 선택지만 선택할 수 있습니다' 
      }, 400);
    }

    // 기존 투표 삭제
    await c.env.DB.prepare(
      'DELETE FROM user_votes WHERE vote_id = ? AND user_id = ?'
    ).bind(vote_id, user.id).run();

    // 새 투표 추가
    for (const option_id of option_ids) {
      await c.env.DB.prepare(
        'INSERT INTO user_votes (vote_id, option_id, user_id) VALUES (?, ?, ?)'
      ).bind(vote_id, option_id, user.id).run();
    }

    return c.json<ApiResponse>({ 
      success: true, 
      message: '투표가 완료되었습니다' 
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '투표 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 투표 종료 (작성자 또는 관리자)
votes.post('/:vote_id/close', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const vote_id = c.req.param('vote_id');

    const vote = await c.env.DB.prepare(`
      SELECT pv.*, p.user_id as post_user_id
      FROM post_votes pv
      JOIN posts p ON pv.post_id = p.id
      WHERE pv.id = ?
    `).bind(vote_id).first<any>();

    if (!vote) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '투표를 찾을 수 없습니다' 
      }, 404);
    }

    // 권한 확인
    if (vote.post_user_id !== user.id && user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '투표 종료 권한이 없습니다' 
      }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE post_votes SET status = ? WHERE id = ?'
    ).bind('closed', vote_id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '투표가 종료되었습니다' 
    });
  } catch (error) {
    console.error('Close vote error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '투표 종료 중 오류가 발생했습니다' 
    }, 500);
  }
});

export default votes;
