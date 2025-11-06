// 전역 상태 관리
const state = {
  user: null,
  token: null,
  currentPage: 'home',
  currentCategory: 'all',
  searchKeyword: '',
  posts: [],
  currentPost: null,
  currentVote: null
};

// 로컬 스토리지에서 토큰 가져오기
function loadToken() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    state.token = token;
    state.user = JSON.parse(userStr);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

// 로그아웃
function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  navigate('home');
}

// 페이지 네비게이션
function navigate(page, params = {}) {
  state.currentPage = page;
  Object.assign(state, params);
  render();
}

// 카테고리 한글 변환
function getCategoryText(category) {
  const map = {
    'suggestion': '제안하기',
    'in_progress': '진행 중',
    'resolved': '해결됨'
  };
  return map[category] || category;
}

// 날짜 포맷팅
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString('ko-KR');
  } else if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else {
    return '방금 전';
  }
}

// 네비게이션 바 렌더링
function renderNav() {
  const isAdmin = state.user && state.user.role === 'admin';
  return `
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <button onclick="navigate('home')" class="flex items-center">
              <i class="fas fa-home text-2xl text-blue-600 mr-3"></i>
              <span class="text-xl font-bold text-gray-800">한마을아파트 개선 포럼</span>
            </button>
          </div>
          
          <div class="flex items-center space-x-4">
            ${state.user ? `
              <span class="text-sm text-gray-600">
                <i class="fas fa-user mr-1"></i>
                ${state.user.nickname} (${state.user.dong}동 ${state.user.ho}호)
              </span>
              ${isAdmin ? `
                <button onclick="navigate('admin')" class="px-3 py-2 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
                  <i class="fas fa-user-shield mr-1"></i>
                  관리자
                </button>
              ` : ''}
              <button onclick="logout()" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                <i class="fas fa-sign-out-alt mr-1"></i>
                로그아웃
              </button>
            ` : `
              <button onclick="navigate('login')" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                <i class="fas fa-sign-in-alt mr-1"></i>
                로그인
              </button>
              <button onclick="navigate('register')" class="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <i class="fas fa-user-plus mr-1"></i>
                회원가입
              </button>
            `}
          </div>
        </div>
      </div>
    </nav>
  `;
}

// 홈 페이지 렌더링
function renderHome() {
  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 헤더 -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          <i class="fas fa-comments text-blue-600 mr-2"></i>
          우리 아파트를 함께 가꿔가요
        </h1>
        <p class="text-gray-600">불편사항과 개선 아이디어를 자유롭게 제안하고 토론해주세요</p>
      </div>

      <!-- 빠른 작성 버튼 -->
      ${state.user ? `
        <div class="mb-6 text-center">
          <button onclick="navigate('create')" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-pen mr-2"></i>
            새 제안 작성하기
          </button>
        </div>
      ` : ''}

      <!-- 검색창 -->
      <div class="mb-6 max-w-2xl mx-auto">
        <div class="relative">
          <input 
            type="text" 
            id="search-input" 
            value="${state.searchKeyword || ''}"
            placeholder="게시글 제목이나 내용으로 검색..." 
            class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onkeyup="if(event.key === 'Enter') searchPosts()"
          >
          <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <button onclick="searchPosts()" class="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            검색
          </button>
        </div>
        ${state.searchKeyword ? `
          <button onclick="clearSearch()" class="mt-2 text-sm text-gray-600 hover:text-gray-900">
            <i class="fas fa-times mr-1"></i>
            검색 초기화
          </button>
        ` : ''}
      </div>

      <!-- 카테고리 필터 -->
      <div class="mb-6 flex justify-center space-x-2">
        <button onclick="loadPosts('all')" class="category-btn ${state.currentCategory === 'all' ? 'active' : ''}" data-category="all">
          <i class="fas fa-th-large mr-1"></i> 전체
        </button>
        <button onclick="loadPosts('suggestion')" class="category-btn ${state.currentCategory === 'suggestion' ? 'active' : ''}" data-category="suggestion">
          <i class="fas fa-lightbulb mr-1"></i> 제안하기
        </button>
        <button onclick="loadPosts('in_progress')" class="category-btn ${state.currentCategory === 'in_progress' ? 'active' : ''}" data-category="in_progress">
          <i class="fas fa-spinner mr-1"></i> 진행 중
        </button>
        <button onclick="loadPosts('resolved')" class="category-btn ${state.currentCategory === 'resolved' ? 'active' : ''}" data-category="resolved">
          <i class="fas fa-check-circle mr-1"></i> 해결됨
        </button>
      </div>

      <!-- 게시글 목록 -->
      <div id="posts-container" class="space-y-4">
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
          <p class="text-gray-500 mt-2">게시글을 불러오는 중...</p>
        </div>
      </div>
    </div>

    <style>
      .category-btn {
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 600;
        border: 2px solid #e5e7eb;
        background: white;
        color: #6b7280;
        transition: all 0.2s;
      }
      .category-btn:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }
      .category-btn.active {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
      }
    </style>
  `;
}

// 게시글 목록 로드
async function loadPosts(category = 'all') {
  state.currentCategory = category;

  try {
    let url = category === 'all' 
      ? '/api/posts' 
      : `/api/posts?category=${category}`;
    
    // 검색어가 있으면 추가
    if (state.searchKeyword) {
      url += url.includes('?') ? '&' : '?';
      url += `search=${encodeURIComponent(state.searchKeyword)}`;
    }
    
    const response = await axios.get(url);
    state.posts = response.data.data.posts;
    
    const container = document.getElementById('posts-container');
    if (state.posts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
          <p class="text-gray-500">아직 게시글이 없습니다</p>
          ${state.user ? `
            <button onclick="navigate('create')" class="mt-4 text-blue-600 hover:text-blue-700">
              첫 번째 제안을 작성해보세요 →
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    container.innerHTML = state.posts.map(post => `
      <div class="bg-white rounded-lg shadow hover:shadow-md transition p-6 cursor-pointer" onclick="navigate('post', { postId: ${post.id} })">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center mb-2">
              <span class="category-badge category-${post.category}">
                ${getCategoryText(post.category)}
              </span>
              <span class="ml-3 text-sm text-gray-500">
                ${formatDate(post.created_at)}
              </span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${post.title}</h3>
            <p class="text-gray-600 text-sm line-clamp-2">${post.content}</p>
            <div class="mt-3 flex items-center text-sm text-gray-500">
              <i class="fas fa-user mr-1"></i>
              <span>${post.author_nickname} (${post.author_dong}동 ${post.author_ho}호)</span>
            </div>
          </div>
          <i class="fas fa-chevron-right text-gray-400 ml-4"></i>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load posts error:', error);
    const container = document.getElementById('posts-container');
    container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-circle text-5xl text-red-300 mb-4"></i>
        <p class="text-gray-500">게시글을 불러오는데 실패했습니다</p>
      </div>
    `;
  }
}

// 게시글 상세 페이지
function renderPost() {
  if (!state.currentPost) {
    loadPost(state.postId);
    return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="text-center">
          <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
          <p class="text-gray-500 mt-2">불러오는 중...</p>
        </div>
      </div>
    `;
  }

  const post = state.currentPost;
  const isAuthor = state.user && state.user.id === post.user_id;
  const isAdmin = state.user && state.user.role === 'admin';
  const canModify = isAuthor || isAdmin;

  return `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- 뒤로가기 -->
      <button onclick="navigate('home')" class="mb-4 text-gray-600 hover:text-gray-900">
        <i class="fas fa-arrow-left mr-2"></i>
        목록으로 돌아가기
      </button>

      <!-- 게시글 -->
      <div class="bg-white rounded-lg shadow p-8">
        <div class="mb-4 flex items-center justify-between">
          <span class="category-badge category-${post.category}">
            ${getCategoryText(post.category)}
          </span>
          ${isAdmin ? `
            <div class="space-x-2">
              <button onclick="changeCategory('${post.id}', 'suggestion')" class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">제안</button>
              <button onclick="changeCategory('${post.id}', 'in_progress')" class="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200">진행중</button>
              <button onclick="changeCategory('${post.id}', 'resolved')" class="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">해결</button>
            </div>
          ` : ''}
        </div>

        <h1 class="text-3xl font-bold text-gray-900 mb-4">${post.title}</h1>
        
        <div class="flex items-center justify-between mb-6 pb-6 border-b">
          <div class="flex items-center text-sm text-gray-600">
            <i class="fas fa-user mr-2"></i>
            <span>${post.author_nickname} (${post.author_dong}동 ${post.author_ho}호)</span>
            <span class="mx-2">•</span>
            <span>${formatDate(post.created_at)}</span>
          </div>
          
          ${canModify ? `
            <div class="space-x-2">
              <button onclick="deletePost(${post.id})" class="text-red-600 hover:text-red-700">
                <i class="fas fa-trash mr-1"></i>
                삭제
              </button>
            </div>
          ` : ''}
        </div>

        <div class="prose max-w-none mb-6">
          <p class="text-gray-700 whitespace-pre-wrap">${post.content}</p>
        </div>

        <!-- 좋아요 및 투표 버튼 -->
        <div class="flex items-center space-x-4 mb-6 pb-6 border-b">
          ${state.user ? `
            <button 
              id="like-btn"
              onclick="toggleLike(${post.id})" 
              class="flex items-center px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <i class="fas fa-heart text-gray-400"></i>
              <span class="ml-1">0</span>
            </button>
            ${canModify ? `
              <button 
                onclick="showCreateVoteModal()" 
                class="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <i class="fas fa-poll mr-2"></i>
                투표 만들기
              </button>
            ` : ''}
          ` : ''}
        </div>

        <!-- 투표 컨테이너 -->
        <div id="vote-container"></div>

        <!-- 파일 목록 -->
        ${post.files && post.files.length > 0 ? `
          <div class="mt-6 border-t pt-6">
            <h3 class="font-semibold mb-3">첨부 파일</h3>
            <div class="grid grid-cols-2 gap-4">
              ${post.files.map(file => `
                <a href="${file.url}" target="_blank" class="flex items-center p-3 bg-gray-50 rounded hover:bg-gray-100">
                  <i class="fas ${file.filetype.startsWith('image/') ? 'fa-image' : 'fa-video'} text-2xl text-gray-400 mr-3"></i>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 truncate">${file.filename}</div>
                    <div class="text-xs text-gray-500">${(file.filesize / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- 댓글 -->
      <div class="mt-8">
        <h2 class="text-xl font-bold mb-4">
          <i class="fas fa-comments mr-2"></i>
          댓글 ${post.comments ? post.comments.length : 0}개
        </h2>

        ${state.user ? `
          <div class="bg-white rounded-lg shadow p-4 mb-4">
            <textarea id="comment-input" rows="3" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="댓글을 입력하세요..."></textarea>
            <div class="mt-2 flex justify-end">
              <button onclick="submitComment()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <i class="fas fa-paper-plane mr-1"></i>
                댓글 작성
              </button>
            </div>
          </div>
        ` : `
          <div class="bg-gray-50 rounded-lg p-4 mb-4 text-center">
            <p class="text-gray-600">댓글을 작성하려면 <button onclick="navigate('login')" class="text-blue-600 hover:text-blue-700">로그인</button>이 필요합니다</p>
          </div>
        `}

        <div class="space-y-3">
          ${post.comments && post.comments.length > 0 ? post.comments.map(comment => {
            const isCommentAuthor = state.user && state.user.id === comment.user_id;
            return `
              <div class="bg-white rounded-lg shadow p-4">
                <div class="flex justify-between items-start mb-2">
                  <div class="flex items-center text-sm text-gray-600">
                    <i class="fas fa-user-circle mr-2"></i>
                    <span class="font-medium">${comment.author_nickname}</span>
                    <span class="mx-2">•</span>
                    <span>${formatDate(comment.created_at)}</span>
                  </div>
                  ${(isCommentAuthor || isAdmin) ? `
                    <button onclick="deleteComment(${comment.id})" class="text-red-500 hover:text-red-700 text-sm">
                      <i class="fas fa-trash"></i>
                    </button>
                  ` : ''}
                </div>
                <p class="text-gray-700">${comment.content}</p>
              </div>
            `;
          }).join('') : `
            <div class="text-center py-8 text-gray-500">
              아직 댓글이 없습니다
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

// 게시글 로드
async function loadPost(postId) {
  try {
    const response = await axios.get(`/api/posts/${postId}`);
    state.currentPost = response.data.data;
    render();
    
    // 좋아요와 투표 정보 로드
    if (typeof loadPostLikes === 'function') {
      loadPostLikes(postId);
    }
    if (typeof loadVote === 'function') {
      loadVote(postId);
    }
  } catch (error) {
    console.error('Load post error:', error);
    alert('게시글을 불러오는데 실패했습니다');
    navigate('home');
  }
}

// 댓글 작성
async function submitComment() {
  const content = document.getElementById('comment-input').value.trim();
  if (!content) {
    alert('댓글 내용을 입력해주세요');
    return;
  }

  try {
    await axios.post('/api/comments', {
      post_id: state.currentPost.id,
      content
    });
    
    // 게시글 다시 로드
    state.currentPost = null;
    loadPost(state.postId);
  } catch (error) {
    console.error('Submit comment error:', error);
    alert('댓글 작성에 실패했습니다');
  }
}

// 댓글 삭제
async function deleteComment(commentId) {
  if (!confirm('댓글을 삭제하시겠습니까?')) return;

  try {
    await axios.delete(`/api/comments/${commentId}`);
    state.currentPost = null;
    loadPost(state.postId);
  } catch (error) {
    console.error('Delete comment error:', error);
    alert('댓글 삭제에 실패했습니다');
  }
}

// 게시글 삭제
async function deletePost(postId) {
  if (!confirm('게시글을 삭제하시겠습니까?')) return;

  try {
    await axios.delete(`/api/posts/${postId}`);
    alert('게시글이 삭제되었습니다');
    navigate('home');
  } catch (error) {
    console.error('Delete post error:', error);
    alert('게시글 삭제에 실패했습니다');
  }
}

// 카테고리 변경 (관리자)
async function changeCategory(postId, category) {
  try {
    await axios.patch(`/api/posts/${postId}/category`, { category });
    state.currentPost = null;
    loadPost(postId);
  } catch (error) {
    console.error('Change category error:', error);
    alert('카테고리 변경에 실패했습니다');
  }
}

// 게시글 작성 페이지
function renderCreate() {
  if (!state.user) {
    navigate('login');
    return '';
  }

  return `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">
        <i class="fas fa-pen mr-2"></i>
        새 제안 작성하기
      </h1>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
          <select id="category-select" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500">
            <option value="suggestion">제안하기</option>
            <option value="in_progress">진행 중</option>
            <option value="resolved">해결됨</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">제목</label>
          <input type="text" id="title-input" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="제목을 입력하세요">
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">내용</label>
          <textarea id="content-input" rows="10" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="내용을 입력하세요"></textarea>
        </div>

        <!-- 파일 업로드 -->
        <div id="file-upload-container"></div>

        <div class="flex justify-end space-x-3">
          <button onclick="navigate('home')" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            취소
          </button>
          <button onclick="submitPost()" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i class="fas fa-check mr-2"></i>
            작성 완료
          </button>
        </div>
      </div>
    </div>
  `;
}

// 게시글 작성 제출
async function submitPost() {
  const category = document.getElementById('category-select').value;
  const title = document.getElementById('title-input').value.trim();
  const content = document.getElementById('content-input').value.trim();

  if (!title) {
    alert('제목을 입력해주세요');
    return;
  }

  if (!content) {
    alert('내용을 입력해주세요');
    return;
  }

  try {
    const response = await axios.post('/api/posts', {
      category,
      title,
      content
    });

    const postId = response.data.data.id;

    // 파일 업로드 (있는 경우)
    if (typeof uploadFiles === 'function') {
      await uploadFiles(postId);
    }

    alert('게시글이 작성되었습니다');
    navigate('post', { postId });
  } catch (error) {
    console.error('Submit post error:', error);
    alert(error.response?.data?.error || '게시글 작성에 실패했습니다');
  }
}

// 로그인 페이지
function renderLogin() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900">로그인</h2>
          <p class="mt-2 text-gray-600">한마을아파트 개선 포럼에 오신 것을 환영합니다</p>
        </div>

        <div class="bg-white rounded-lg shadow p-8">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
            <input type="tel" id="login-phone" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="01012345678">
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
            <input type="password" id="login-password" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="비밀번호">
          </div>

          <button onclick="submitLogin()" class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <i class="fas fa-sign-in-alt mr-2"></i>
            로그인
          </button>

          <div class="mt-4 text-center">
            <span class="text-gray-600">계정이 없으신가요?</span>
            <button onclick="navigate('register')" class="ml-2 text-blue-600 hover:text-blue-700 font-medium">
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 로그인 제출
async function submitLogin() {
  const phone = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-password').value;

  if (!phone || !password) {
    alert('전화번호와 비밀번호를 입력해주세요');
    return;
  }

  try {
    const response = await axios.post('/api/auth/login', { phone, password });
    
    state.token = response.data.data.token;
    state.user = response.data.data.user;
    
    localStorage.setItem('token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;

    alert('로그인되었습니다');
    navigate('home');
  } catch (error) {
    console.error('Login error:', error);
    alert(error.response?.data?.error || '로그인에 실패했습니다');
  }
}

// 회원가입 페이지
function renderRegister() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900">회원가입</h2>
          <p class="mt-2 text-gray-600">관리자 승인 후 이용 가능합니다</p>
        </div>

        <div class="bg-white rounded-lg shadow p-8">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
            <input type="tel" id="register-phone" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="01012345678">
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
            <input type="password" id="register-password" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="비밀번호">
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
            <input type="text" id="register-nickname" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="닉네임">
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">동</label>
              <input type="text" id="register-dong" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="101">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">호</label>
              <input type="text" id="register-ho" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="101">
            </div>
          </div>

          <button onclick="submitRegister()" class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <i class="fas fa-user-plus mr-2"></i>
            가입 신청하기
          </button>

          <div class="mt-4 text-center">
            <span class="text-gray-600">이미 계정이 있으신가요?</span>
            <button onclick="navigate('login')" class="ml-2 text-blue-600 hover:text-blue-700 font-medium">
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 회원가입 제출
async function submitRegister() {
  const phone = document.getElementById('register-phone').value.trim();
  const password = document.getElementById('register-password').value;
  const nickname = document.getElementById('register-nickname').value.trim();
  const dong = document.getElementById('register-dong').value.trim();
  const ho = document.getElementById('register-ho').value.trim();

  if (!phone || !password || !nickname || !dong || !ho) {
    alert('모든 필드를 입력해주세요');
    return;
  }

  try {
    await axios.post('/api/auth/register', {
      phone,
      password,
      nickname,
      dong,
      ho
    });

    alert('가입 신청이 완료되었습니다.\n관리자 승인 후 이용 가능합니다.');
    navigate('login');
  } catch (error) {
    console.error('Register error:', error);
    alert(error.response?.data?.error || '회원가입에 실패했습니다');
  }
}

// 관리자 페이지
function renderAdmin() {
  if (!state.user || state.user.role !== 'admin') {
    navigate('home');
    return '';
  }

  return `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">
        <i class="fas fa-user-shield mr-2"></i>
        관리자 페이지
      </h1>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-blue-50 rounded-lg p-6">
          <div class="text-blue-600 text-3xl mb-2">
            <i class="fas fa-clock"></i>
          </div>
          <div class="text-2xl font-bold" id="pending-count">-</div>
          <div class="text-gray-600">대기 중인 가입 신청</div>
        </div>

        <div class="bg-green-50 rounded-lg p-6">
          <div class="text-green-600 text-3xl mb-2">
            <i class="fas fa-users"></i>
          </div>
          <div class="text-2xl font-bold" id="approved-count">-</div>
          <div class="text-gray-600">승인된 회원</div>
        </div>

        <div class="bg-purple-50 rounded-lg p-6">
          <div class="text-purple-600 text-3xl mb-2">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="text-2xl font-bold" id="posts-count">-</div>
          <div class="text-gray-600">전체 게시글</div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow">
        <div class="border-b px-6 py-4">
          <h2 class="text-xl font-bold">가입 승인 대기 목록</h2>
        </div>
        <div id="pending-users-list" class="p-6">
          <div class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 관리자 페이지 데이터 로드
async function loadAdminData() {
  try {
    // 통계 로드
    const statsResponse = await axios.get('/api/admin/stats');
    const stats = statsResponse.data.data;
    
    document.getElementById('pending-count').textContent = stats.users.pending || 0;
    document.getElementById('approved-count').textContent = stats.users.approved || 0;
    document.getElementById('posts-count').textContent = stats.posts.total || 0;

    // 대기 중인 사용자 로드
    const usersResponse = await axios.get('/api/admin/pending-users');
    const users = usersResponse.data.data;
    
    const container = document.getElementById('pending-users-list');
    
    if (users.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-check-circle text-4xl mb-2"></i>
          <p>대기 중인 가입 신청이 없습니다</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-4">
        ${users.map(user => `
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div class="font-medium text-gray-900">${user.nickname}</div>
              <div class="text-sm text-gray-600">
                <i class="fas fa-phone mr-1"></i>
                ${user.phone} • ${user.dong}동 ${user.ho}호
              </div>
              <div class="text-xs text-gray-500 mt-1">
                ${formatDate(user.created_at)}
              </div>
            </div>
            <div class="space-x-2">
              <button onclick="approveUser(${user.id})" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                <i class="fas fa-check mr-1"></i>
                승인
              </button>
              <button onclick="rejectUser(${user.id})" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                <i class="fas fa-times mr-1"></i>
                거부
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Load admin data error:', error);
  }
}

// 회원 승인
async function approveUser(userId) {
  if (!confirm('이 회원을 승인하시겠습니까?')) return;

  try {
    await axios.post(`/api/admin/approve-user/${userId}`);
    alert('회원이 승인되었습니다');
    loadAdminData();
  } catch (error) {
    console.error('Approve user error:', error);
    alert('승인에 실패했습니다');
  }
}

// 회원 거부
async function rejectUser(userId) {
  if (!confirm('이 회원의 가입을 거부하시겠습니까?')) return;

  try {
    await axios.post(`/api/admin/reject-user/${userId}`);
    alert('가입이 거부되었습니다');
    loadAdminData();
  } catch (error) {
    console.error('Reject user error:', error);
    alert('거부에 실패했습니다');
  }
}

// 메인 렌더링 함수
function render() {
  const app = document.getElementById('app');
  
  let content = '';
  
  switch (state.currentPage) {
    case 'home':
      content = renderNav() + renderHome();
      break;
    case 'post':
      content = renderNav() + renderPost();
      break;
    case 'create':
      content = renderNav() + renderCreate();
      break;
    case 'login':
      content = renderLogin();
      break;
    case 'register':
      content = renderRegister();
      break;
    case 'admin':
      content = renderNav() + renderAdmin();
      break;
    default:
      content = renderNav() + renderHome();
  }
  
  app.innerHTML = content;
  
  // 페이지별 추가 로직
  if (state.currentPage === 'home') {
    loadPosts(state.currentCategory);
  } else if (state.currentPage === 'admin') {
    loadAdminData();
  } else if (state.currentPage === 'create') {
    // 파일 업로드 UI 표시
    if (typeof showFileUpload === 'function') {
      showFileUpload();
    }
  }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  loadToken();
  render();
});
