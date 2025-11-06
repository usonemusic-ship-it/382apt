import { Hono } from 'hono';
import { Bindings, Post, PostDetail, User, ApiResponse } from '../types';
import { authMiddleware } from '../utils/auth';

const posts = new Hono<{ Bindings: Bindings }>();

// 모든 게시글 목록 조회 (인증 불필요 - 읽기만)
posts.get('/', async (c) => {
  try {
    const category = c.req.query('category'); // suggestion, in_progress, resolved
    const search = c.req.query('search'); // 검색어
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        u.nickname as author_nickname,
        u.dong as author_dong,
        u.ho as author_ho
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active'
    `;
    
    const params: any[] = [];
    
    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }
    
    if (search) {
      query += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await c.env.DB.prepare(query).bind(...params).all<PostDetail>();

    // 전체 개수 조회
    let countQuery = 'SELECT COUNT(*) as total FROM posts WHERE status = ?';
    const countParams: any[] = ['active'];
    
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    
    if (search) {
      countQuery += ' AND (title LIKE ? OR content LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern);
    }
    
    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        posts: results,
        total: countResult?.total || 0,
        page,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '게시글 목록 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 게시글 상세 조회 (댓글 포함)
posts.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // 게시글 조회
    const post = await c.env.DB.prepare(`
      SELECT 
        p.*,
        u.nickname as author_nickname,
        u.dong as author_dong,
        u.ho as author_ho
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.status = 'active'
    `).bind(id).first<PostDetail>();

    if (!post) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '게시글을 찾을 수 없습니다' 
      }, 404);
    }

    // 댓글 조회
    const { results: comments } = await c.env.DB.prepare(`
      SELECT 
        c.*,
        u.nickname as author_nickname,
        u.dong as author_dong,
        u.ho as author_ho
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.status = 'active'
      ORDER BY c.created_at ASC
    `).bind(id).all();

    // 파일 조회
    const { results: files } = await c.env.DB.prepare(
      'SELECT * FROM files WHERE post_id = ? ORDER BY created_at ASC'
    ).bind(id).all();

    post.comments = comments as any;
    post.files = files as any;

    return c.json<ApiResponse>({ 
      success: true, 
      data: post 
    });
  } catch (error) {
    console.error('Get post error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '게시글 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 게시글 작성 (인증 필요)
posts.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const { category, title, content } = await c.req.json();

    if (!category || !title || !content) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '모든 필드를 입력해주세요' 
      }, 400);
    }

    if (!['suggestion', 'in_progress', 'resolved'].includes(category)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '올바른 카테고리를 선택해주세요' 
      }, 400);
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO posts (user_id, category, title, content) VALUES (?, ?, ?, ?)'
    ).bind(user.id, category, title, content).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '게시글이 작성되었습니다',
      data: { id: result.meta.last_row_id }
    });
  } catch (error) {
    console.error('Create post error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '게시글 작성 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 게시글 수정 (본인 또는 관리자만)
posts.put('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = c.req.param('id');
    const { category, title, content } = await c.req.json();

    // 게시글 확인
    const post = await c.env.DB.prepare(
      'SELECT * FROM posts WHERE id = ? AND status = ?'
    ).bind(id, 'active').first<Post>();

    if (!post) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '게시글을 찾을 수 없습니다' 
      }, 404);
    }

    // 권한 확인 (본인 또는 관리자)
    if (post.user_id !== user.id && user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '수정 권한이 없습니다' 
      }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE posts SET category = ?, title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(category, title, content, id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '게시글이 수정되었습니다' 
    });
  } catch (error) {
    console.error('Update post error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '게시글 수정 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 게시글 삭제 (본인 또는 관리자만)
posts.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = c.req.param('id');

    const post = await c.env.DB.prepare(
      'SELECT * FROM posts WHERE id = ? AND status = ?'
    ).bind(id, 'active').first<Post>();

    if (!post) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '게시글을 찾을 수 없습니다' 
      }, 404);
    }

    if (post.user_id !== user.id && user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '삭제 권한이 없습니다' 
      }, 403);
    }

    // 소프트 삭제
    await c.env.DB.prepare(
      'UPDATE posts SET status = ? WHERE id = ?'
    ).bind('deleted', id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '게시글이 삭제되었습니다' 
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '게시글 삭제 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 게시글 카테고리 변경 (관리자 전용)
posts.patch('/:id/category', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    
    if (user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '관리자 권한이 필요합니다' 
      }, 403);
    }

    const id = c.req.param('id');
    const { category } = await c.req.json();

    if (!['suggestion', 'in_progress', 'resolved'].includes(category)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '올바른 카테고리를 선택해주세요' 
      }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE posts SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(category, id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '카테고리가 변경되었습니다' 
    });
  } catch (error) {
    console.error('Update category error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '카테고리 변경 중 오류가 발생했습니다' 
    }, 500);
  }
});

export default posts;
