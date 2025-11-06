import { Hono } from 'hono';
import { Bindings, Comment, User, ApiResponse } from '../types';
import { authMiddleware } from '../utils/auth';

const comments = new Hono<{ Bindings: Bindings }>();

// 댓글 작성 (인증 필요)
comments.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const { post_id, content } = await c.req.json();

    if (!post_id || !content) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '모든 필드를 입력해주세요' 
      }, 400);
    }

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

    const result = await c.env.DB.prepare(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)'
    ).bind(post_id, user.id, content).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '댓글이 작성되었습니다',
      data: { id: result.meta.last_row_id }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '댓글 작성 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 댓글 수정 (본인만)
comments.put('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = c.req.param('id');
    const { content } = await c.req.json();

    if (!content) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '내용을 입력해주세요' 
      }, 400);
    }

    const comment = await c.env.DB.prepare(
      'SELECT * FROM comments WHERE id = ? AND status = ?'
    ).bind(id, 'active').first<Comment>();

    if (!comment) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '댓글을 찾을 수 없습니다' 
      }, 404);
    }

    if (comment.user_id !== user.id && user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '수정 권한이 없습니다' 
      }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE comments SET content = ? WHERE id = ?'
    ).bind(content, id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '댓글이 수정되었습니다' 
    });
  } catch (error) {
    console.error('Update comment error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '댓글 수정 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 댓글 삭제 (본인 또는 관리자)
comments.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = c.req.param('id');

    const comment = await c.env.DB.prepare(
      'SELECT * FROM comments WHERE id = ? AND status = ?'
    ).bind(id, 'active').first<Comment>();

    if (!comment) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '댓글을 찾을 수 없습니다' 
      }, 404);
    }

    if (comment.user_id !== user.id && user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '삭제 권한이 없습니다' 
      }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE comments SET status = ? WHERE id = ?'
    ).bind('deleted', id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '댓글이 삭제되었습니다' 
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '댓글 삭제 중 오류가 발생했습니다' 
    }, 500);
  }
});

export default comments;
