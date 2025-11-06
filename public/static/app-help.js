// 도와주세요 카테고리 한글 변환
function getHelpCategoryText(category) {
  const map = {
    '강아지산책': '🐕 강아지 산책',
    '고양이돌봄': '🐱 고양이 돌봄',
    '재활용버리기': '♻️ 재활용 버리기',
    '집안일': '🏠 집안일',
    '병원동행': '🏥 병원 동행',
    '기타': '📌 기타'
  };
  return map[category] || category;
}

// 도와주세요 상태 한글 변환
function getHelpStatusText(status) {
  const map = {
    'open': '모집중',
    'in_progress': '진행중',
    'closed': '마감'
  };
  return map[status] || status;
}

// 도와주세요 상태 배지 클래스
function getHelpStatusBadge(status) {
  const map = {
    'open': 'bg-green-100 text-green-700',
    'in_progress': 'bg-yellow-100 text-yellow-700',
    'closed': 'bg-gray-100 text-gray-700'
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

// 도와주세요 메인 페이지
function renderHelp() {
  return `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">
          <i class="fas fa-hands-helping mr-2 text-green-600"></i>
          도와주세요
        </h1>
        ${state.user ? `
          <button onclick="navigate('help-create')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <i class="fas fa-plus mr-2"></i>
            도움 요청하기
          </button>
        ` : ''}
      </div>

      <!-- 카테고리 필터 -->
      <div class="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button onclick="loadHelpRequests('all')" class="category-btn ${state.currentHelpCategory === 'all' ? 'active' : ''}">
          전체
        </button>
        <button onclick="loadHelpRequests('강아지산책')" class="category-btn ${state.currentHelpCategory === '강아지산책' ? 'active' : ''}">
          🐕 강아지 산책
        </button>
        <button onclick="loadHelpRequests('고양이돌봄')" class="category-btn ${state.currentHelpCategory === '고양이돌봄' ? 'active' : ''}">
          🐱 고양이 돌봄
        </button>
        <button onclick="loadHelpRequests('재활용버리기')" class="category-btn ${state.currentHelpCategory === '재활용버리기' ? 'active' : ''}">
          ♻️ 재활용 버리기
        </button>
        <button onclick="loadHelpRequests('집안일')" class="category-btn ${state.currentHelpCategory === '집안일' ? 'active' : ''}">
          🏠 집안일
        </button>
        <button onclick="loadHelpRequests('병원동행')" class="category-btn ${state.currentHelpCategory === '병원동행' ? 'active' : ''}">
          🏥 병원 동행
        </button>
        <button onclick="loadHelpRequests('기타')" class="category-btn ${state.currentHelpCategory === '기타' ? 'active' : ''}">
          📌 기타
        </button>
      </div>

      <!-- 도움 요청 목록 -->
      <div id="help-requests-container" class="space-y-4">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
        </div>
      </div>
    </div>
  `;
}

// 도움 요청 목록 로드
async function loadHelpRequests(category = 'all') {
  state.currentHelpCategory = category;

  try {
    let url = '/api/help/requests';
    if (category !== 'all') {
      url += `?category=${encodeURIComponent(category)}`;
    }
    
    const response = await axios.get(url);
    state.helpRequests = response.data.data;
    
    const container = document.getElementById('help-requests-container');
    if (state.helpRequests.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
          <p class="text-gray-500">아직 도움 요청이 없습니다</p>
          ${state.user ? `
            <button onclick="navigate('help-create')" class="mt-4 text-green-600 hover:text-green-700">
              첫 번째 도움 요청을 작성해보세요 →
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    container.innerHTML = state.helpRequests.map(req => `
      <div class="bg-white rounded-lg shadow hover:shadow-md transition p-6 cursor-pointer" onclick="navigate('help-detail', { helpRequestId: ${req.id} })">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center mb-2 space-x-2">
              <span class="px-3 py-1 rounded-full text-xs font-semibold ${getHelpStatusBadge(req.status)}">
                ${getHelpStatusText(req.status)}
              </span>
              <span class="text-sm text-gray-600">
                ${getHelpCategoryText(req.category)}
              </span>
              ${req.pay > 0 ? `
                <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                  <i class="fas fa-won-sign"></i> ${req.pay.toLocaleString()}원
                </span>
              ` : ''}
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${req.title}</h3>
            <p class="text-gray-600 text-sm line-clamp-2 mb-3">${req.content}</p>
            <div class="flex items-center justify-between text-sm text-gray-500">
              <div class="flex items-center space-x-3">
                <span>
                  <i class="fas fa-user mr-1"></i>
                  ${req.author_nickname} (${req.author_dong}동 ${req.author_ho}호)
                </span>
                ${req.location ? `
                  <span>
                    <i class="fas fa-map-marker-alt mr-1"></i>
                    ${req.location}
                  </span>
                ` : ''}
              </div>
              <div class="flex items-center space-x-2">
                <span>
                  <i class="fas fa-users mr-1"></i>
                  ${req.application_count || 0}명 신청
                </span>
                <span>${formatDate(req.created_at)}</span>
              </div>
            </div>
          </div>
          <i class="fas fa-chevron-right text-gray-400 ml-4"></i>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load help requests error:', error);
    const container = document.getElementById('help-requests-container');
    container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-circle text-5xl text-red-300 mb-4"></i>
        <p class="text-gray-500">도움 요청을 불러오는데 실패했습니다</p>
      </div>
    `;
  }
}

// 도움 요청 상세 페이지
function renderHelpDetail() {
  if (!state.currentHelpRequest || state.currentHelpRequest.id !== state.helpRequestId) {
    loadHelpRequest(state.helpRequestId);
    return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="text-center">
          <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
          <p class="text-gray-500 mt-2">불러오는 중...</p>
        </div>
      </div>
    `;
  }

  const req = state.currentHelpRequest;
  const isAuthor = state.user && state.user.id === req.user_id;
  const isAdmin = state.user && state.user.role === 'admin';
  const canModify = isAuthor || isAdmin;
  const hasApplied = state.user && req.applications && req.applications.some(app => app.user_id === state.user.id);

  return `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- 뒤로가기 -->
      <button onclick="navigate('help')" class="mb-4 text-gray-600 hover:text-gray-900">
        <i class="fas fa-arrow-left mr-2"></i>
        목록으로 돌아가기
      </button>

      <!-- 도움 요청 -->
      <div class="bg-white rounded-lg shadow p-8">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 rounded-full text-sm font-semibold ${getHelpStatusBadge(req.status)}">
              ${getHelpStatusText(req.status)}
            </span>
            <span class="text-gray-600">${getHelpCategoryText(req.category)}</span>
          </div>
          ${canModify ? `
            <button onclick="deleteHelpRequest(${req.id})" class="text-red-600 hover:text-red-700">
              <i class="fas fa-trash mr-1"></i>
              삭제
            </button>
          ` : ''}
        </div>

        <h1 class="text-3xl font-bold text-gray-900 mb-4">${req.title}</h1>
        
        <div class="flex items-center justify-between mb-6 pb-6 border-b">
          <div class="flex items-center text-sm text-gray-600 space-x-4">
            <span>
              <i class="fas fa-user mr-1"></i>
              ${req.author_nickname} (${req.author_dong}동 ${req.author_ho}호)
            </span>
            ${req.location ? `
              <span>
                <i class="fas fa-map-marker-alt mr-1"></i>
                ${req.location}
              </span>
            ` : ''}
            <span>${formatDate(req.created_at)}</span>
          </div>
          ${req.pay > 0 ? `
            <div class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold">
              <i class="fas fa-won-sign mr-1"></i>
              ${req.pay.toLocaleString()}원
            </div>
          ` : ''}
        </div>

        <div class="prose max-w-none mb-6">
          <p class="text-gray-700 whitespace-pre-wrap">${req.content}</p>
        </div>

        <!-- 신청 버튼 -->
        ${state.user && !isAuthor && req.status === 'open' ? `
          <div class="border-t pt-6">
            ${hasApplied ? `
              <button onclick="cancelHelpApplication(${req.id})" class="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                <i class="fas fa-times mr-2"></i>
                신청 취소하기
              </button>
            ` : `
              <button onclick="showApplyModal(${req.id})" class="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                <i class="fas fa-hand-paper mr-2"></i>
                도와드릴게요!
              </button>
            `}
          </div>
        ` : ''}

        <!-- 신청자 목록 (작성자만 볼 수 있음) -->
        ${canModify && req.applications && req.applications.length > 0 ? `
          <div class="border-t pt-6 mt-6">
            <h3 class="text-lg font-semibold mb-4">
              <i class="fas fa-users mr-2"></i>
              신청자 목록 (${req.applications.length}명)
            </h3>
            <div class="space-y-3">
              ${req.applications.map(app => `
                <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div class="flex-1">
                    <div class="font-medium text-gray-900">
                      ${app.nickname} (${app.dong}동 ${app.ho}호)
                    </div>
                    ${app.message ? `
                      <p class="text-sm text-gray-600 mt-1">${app.message}</p>
                    ` : ''}
                    <div class="text-xs text-gray-500 mt-1">
                      ${formatDate(app.created_at)}
                      ${app.phone ? ` • ${app.phone}` : ''}
                    </div>
                  </div>
                  ${app.status === 'pending' ? `
                    <div class="flex space-x-2">
                      <button onclick="updateApplicationStatus(${app.id}, 'accepted')" class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                        수락
                      </button>
                      <button onclick="updateApplicationStatus(${app.id}, 'rejected')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                        거절
                      </button>
                    </div>
                  ` : `
                    <span class="px-3 py-1 rounded text-sm ${app.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                      ${app.status === 'accepted' ? '수락됨' : '거절됨'}
                    </span>
                  `}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// 도움 요청 상세 로드
async function loadHelpRequest(id) {
  try {
    const response = await axios.get(`/api/help/requests/${id}`);
    state.currentHelpRequest = response.data.data;
    render();
  } catch (error) {
    console.error('Load help request error:', error);
    alert('도움 요청을 불러오는데 실패했습니다');
    navigate('help');
  }
}

// 도움 요청 작성 페이지
function renderHelpCreate() {
  if (!state.user) {
    navigate('login');
    return '';
  }

  return `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">
        <i class="fas fa-hands-helping mr-2 text-green-600"></i>
        도움 요청하기
      </h1>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
          <select id="help-category-select" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500">
            <option value="강아지산책">🐕 강아지 산책</option>
            <option value="고양이돌봄">🐱 고양이 돌봄</option>
            <option value="재활용버리기">♻️ 재활용 버리기</option>
            <option value="집안일">🏠 집안일</option>
            <option value="병원동행">🏥 병원 동행</option>
            <option value="기타">📌 기타</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">제목</label>
          <input type="text" id="help-title-input" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500" placeholder="예: 강아지 산책 시켜주실 분">
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">내용</label>
          <textarea id="help-content-input" rows="8" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500" placeholder="자세한 내용을 입력해주세요"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">위치 (선택)</label>
            <input type="text" id="help-location-input" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500" placeholder="예: 101동 앞">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">알바비 (선택)</label>
            <input type="number" id="help-pay-input" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500" placeholder="0" min="0" step="1000">
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button onclick="navigate('help')" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            취소
          </button>
          <button onclick="submitHelpRequest()" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <i class="fas fa-check mr-2"></i>
            등록하기
          </button>
        </div>
      </div>
    </div>
  `;
}

// 도움 요청 작성 제출
async function submitHelpRequest() {
  const category = document.getElementById('help-category-select').value;
  const title = document.getElementById('help-title-input').value.trim();
  const content = document.getElementById('help-content-input').value.trim();
  const location = document.getElementById('help-location-input').value.trim();
  const pay = parseInt(document.getElementById('help-pay-input').value) || 0;

  if (!title) {
    alert('제목을 입력해주세요');
    return;
  }

  if (!content) {
    alert('내용을 입력해주세요');
    return;
  }

  try {
    const response = await axios.post('/api/help/requests', {
      category,
      title,
      content,
      location,
      pay
    });

    alert('도움 요청이 등록되었습니다');
    navigate('help-detail', { helpRequestId: response.data.data.id });
  } catch (error) {
    console.error('Submit help request error:', error);
    alert(error.response?.data?.error || '도움 요청 등록에 실패했습니다');
  }
}

// 도움 요청 삭제
async function deleteHelpRequest(id) {
  if (!confirm('도움 요청을 삭제하시겠습니까?')) return;

  try {
    await axios.delete(`/api/help/requests/${id}`);
    alert('도움 요청이 삭제되었습니다');
    navigate('help');
  } catch (error) {
    console.error('Delete help request error:', error);
    alert('도움 요청 삭제에 실패했습니다');
  }
}

// 신청 모달 표시
function showApplyModal(requestId) {
  const modal = `
    <div id="apply-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeApplyModal(event)">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" onclick="event.stopPropagation()">
        <h3 class="text-xl font-bold mb-4">도움 신청하기</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">메시지 (선택)</label>
          <textarea id="apply-message-input" rows="4" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500" placeholder="신청 메시지를 입력해주세요"></textarea>
        </div>
        <div class="flex justify-end space-x-3">
          <button onclick="closeApplyModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            취소
          </button>
          <button onclick="submitHelpApplication(${requestId})" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            신청하기
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

function closeApplyModal(event) {
  if (!event || event.target.id === 'apply-modal') {
    const modal = document.getElementById('apply-modal');
    if (modal) modal.remove();
  }
}

// 도움 신청 제출
async function submitHelpApplication(requestId) {
  const message = document.getElementById('apply-message-input').value.trim();

  try {
    await axios.post(`/api/help/requests/${requestId}/apply`, { message });
    closeApplyModal();
    alert('신청이 완료되었습니다');
    state.currentHelpRequest = null;
    loadHelpRequest(requestId);
  } catch (error) {
    console.error('Submit help application error:', error);
    alert(error.response?.data?.error || '신청에 실패했습니다');
  }
}

// 도움 신청 취소
async function cancelHelpApplication(requestId) {
  if (!confirm('신청을 취소하시겠습니까?')) return;

  try {
    await axios.delete(`/api/help/requests/${requestId}/apply`);
    alert('신청이 취소되었습니다');
    state.currentHelpRequest = null;
    loadHelpRequest(requestId);
  } catch (error) {
    console.error('Cancel application error:', error);
    alert('신청 취소에 실패했습니다');
  }
}

// 신청 수락/거절
async function updateApplicationStatus(applicationId, status) {
  const message = status === 'accepted' ? '신청을 수락하시겠습니까?' : '신청을 거절하시겠습니까?';
  if (!confirm(message)) return;

  try {
    await axios.patch(`/api/help/applications/${applicationId}`, { status });
    alert(status === 'accepted' ? '신청이 수락되었습니다' : '신청이 거절되었습니다');
    state.currentHelpRequest = null;
    loadHelpRequest(state.helpRequestId);
  } catch (error) {
    console.error('Update application status error:', error);
    alert('처리에 실패했습니다');
  }
}
