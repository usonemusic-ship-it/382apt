import { Hono } from 'hono';
import { Bindings, User, ApiResponse } from '../types';
import { authMiddleware } from '../utils/auth';

const upload = new Hono<{ Bindings: Bindings }>();

// 파일 업로드 (인증 필요)
upload.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const formData = await c.req.formData();
    
    const file = formData.get('file') as File;
    const post_id = formData.get('post_id') as string;
    const comment_id = formData.get('comment_id') as string;

    if (!file) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '파일을 선택해주세요' 
      }, 400);
    }

    // 파일 크기 제한 (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '파일 크기는 50MB를 초과할 수 없습니다' 
      }, 400);
    }

    // 파일 타입 검증
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];

    if (!allowedTypes.includes(file.type)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '지원하지 않는 파일 형식입니다. (허용: 이미지, 동영상)' 
      }, 400);
    }

    // 파일명 생성 (중복 방지)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomStr}.${extension}`;
    const key = `uploads/${filename}`;

    // R2에 파일 업로드
    await c.env.BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 파일 URL (실제 환경에서는 R2 public URL 또는 Custom Domain 사용)
    const url = `/api/files/${filename}`;

    // 데이터베이스에 파일 정보 저장
    const result = await c.env.DB.prepare(`
      INSERT INTO files (post_id, comment_id, user_id, filename, filesize, filetype, url) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      post_id || null,
      comment_id || null,
      user.id,
      file.name,
      file.size,
      file.type,
      url
    ).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '파일이 업로드되었습니다',
      data: {
        id: result.meta.last_row_id,
        filename: file.name,
        url,
        size: file.size,
        type: file.type
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '파일 업로드 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 파일 다운로드/조회
upload.get('/:filename', async (c) => {
  try {
    const filename = c.req.param('filename');
    const key = `uploads/${filename}`;

    const object = await c.env.BUCKET.get(key);

    if (!object) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '파일을 찾을 수 없습니다' 
      }, 404);
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Get file error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '파일 조회 중 오류가 발생했습니다' 
    }, 500);
  }
});

// 파일 삭제 (본인 또는 관리자)
upload.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = c.req.param('id');

    const file = await c.env.DB.prepare(
      'SELECT * FROM files WHERE id = ?'
    ).bind(id).first<any>();

    if (!file) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '파일을 찾을 수 없습니다' 
      }, 404);
    }

    // 권한 확인
    if (file.user_id !== user.id && user.role !== 'admin') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '삭제 권한이 없습니다' 
      }, 403);
    }

    // R2에서 파일 삭제
    const filename = file.url.split('/').pop();
    const key = `uploads/${filename}`;
    await c.env.BUCKET.delete(key);

    // DB에서 파일 정보 삭제
    await c.env.DB.prepare('DELETE FROM files WHERE id = ?').bind(id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '파일이 삭제되었습니다' 
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '파일 삭제 중 오류가 발생했습니다' 
    }, 500);
  }
});

export default upload;
