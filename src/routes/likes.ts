import { Hono } from 'hono';
import { Bindings, User, ApiResponse } from '../types';
import { authMiddleware } from '../utils/auth';

const likes = new Hono<{ Bindings: Bindings }>();

// 게시글 좋아요 토글 (인증 필요)
likes.post('/posts/:post_id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const post_id = c.req.param('post_id');

    // 게시글 존재 확인
    const post = await c.env.DB.prepare(
      'SELECT id FROM posts WHERE id = ? AND status = ?'
    ).bind(post_id, 'active').first();

    if (!post) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '게시글을 찾을 수 없습니다' 
      }, 404);
    }

    // 기존 좋아요 확인
    const existingLike = await c.env.DB.prepare(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?'
    ).bind(post_id, user.id).first();

    if (existingLike) {
      // 좋아요 취소
      await c.env.DB.prepare(
        'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?'
      ).bind(post_id, user.id).run();

      return c.json<ApiResponse>({ 
        success: true, 
        message: '좋아요가 취소되었습니다',
        data: { liked: false }
      });
    } else {
      // 좋아요 추가
      await c.env.DB.prepare(
        'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)'
      ).bind(post_id, user.id).run();

      return c.json<ApiResponse>({ 
        success: true, 
        message: '좋아요가 추가되었습니다',
        data: { liked: true }
      });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '좋아요 처리 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 게시글 좋아요 개수 및 내 좋아요 상태 조회
likes.get('/posts/:post_id', async (c) => {
  try {
    const post_id = c.req.param('post_id');

    // 좋아요 개수 조회
    const result = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?'
    ).bind(post_id).first<{ count: number }>();

    const likeCount = result?.count || 0;

    // 내가 좋아요 했는지 확인 (로그인 시)
    let liked = false;
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = JSON.parse(atob(token));
        const myLike = await c.env.DB.prepare(
          'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?'
        ).bind(post_id, decoded.userId).first();
        liked = !!myLike;
      } catch (e) {
        // 토큰 오류는 무시
      }
    }

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        post_id: parseInt(post_id),
        like_count: likeCount,
        liked
      }
    });
  } catch (error) {
    console.error('Get likes error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '좋아요 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

export default likes;
