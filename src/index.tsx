import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { Bindings } from './types'

// 라우트 import
import auth from './routes/auth'
import posts from './routes/posts'
import comments from './routes/comments'
import admin from './routes/admin'
import upload from './routes/upload'
import votes from './routes/votes'
import likes from './routes/likes'

const app = new Hono<{ Bindings: Bindings }>()

// CORS 활성화
app.use('/api/*', cors())

// 정적 파일 제공
app.use('/static/*', serveStatic({ root: './public' }))

// API 라우트
app.route('/api/auth', auth)
app.route('/api/posts', posts)
app.route('/api/comments', comments)
app.route('/api/admin', admin)
app.route('/api/files', upload)
app.route('/api/votes', votes)
app.route('/api/likes', likes)

// 메인 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>한마을아파트 개선 포럼</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', sans-serif; }
          .category-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; }
          .category-suggestion { background: #dbeafe; color: #1e40af; }
          .category-in_progress { background: #fef3c7; color: #92400e; }
          .category-resolved { background: #d1fae5; color: #065f46; }
        </style>
    </head>
    <body class="bg-gray-50">
        <div id="app">
            <div class="flex justify-center items-center h-screen">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                    <p class="text-gray-600">로딩 중...</p>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/app-ext.js"></script>
        <script src="/static/app-help.js"></script>

    </body>
    </html>
  `)
})

// 404 처리
app.notFound((c) => {
  return c.json({ success: false, error: 'Not Found' }, 404)
})

// 에러 처리
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ success: false, error: '서버 오류가 발생했습니다' }, 500)
})

export default app
