// 확장 기능들 (검색, 투표, 좋아요, 파일 업로드)

// 검색 함수
function searchPosts() {
  const input = document.getElementById('search-input');
  state.searchKeyword = input ? input.value.trim() : '';
  loadPosts(state.currentCategory);
}

// 검색 초기화
function clearSearch() {
  state.searchKeyword = '';
  loadPosts(state.currentCategory);
}

// 좋아요 토글
async function toggleLike(postId) {
  if (!state.user) {
    alert('로그인이 필요합니다');
    navigate('login');
    return;
  }

  try {
    const response = await axios.post(`/api/likes/posts/${postId}`);
    // 게시글 상세 페이지에서만 즉시 반영
    if (state.currentPage === 'post') {
      loadPostLikes(postId);
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    alert('좋아요 처리 중 오류가 발생했습니다');
  }
}

// 좋아요 정보 로드
async function loadPostLikes(postId) {
  try {
    const response = await axios.get(`/api/likes/posts/${postId}`);
    const likesData = response.data.data;
    
    // 좋아요 버튼 업데이트
    const likeBtn = document.getElementById('like-btn');
    if (likeBtn) {
      likeBtn.innerHTML = `
        <i class="fas fa-heart ${likesData.liked ? 'text-red-500' : 'text-gray-400'}"></i>
        <span class="ml-1">${likesData.like_count}</span>
      `;
    }
  } catch (error) {
    console.error('Load likes error:', error);
  }
}

// 투표 생성 모달 표시
function showCreateVoteModal() {
  if (!state.currentPost) return;
  
  const modal = `
    <div id="vote-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeVoteModal(event)">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" onclick="event.stopPropagation()">
        <h2 class="text-2xl font-bold mb-4">투표 만들기</h2>
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">투표 제목</label>
          <input type="text" id="vote-title" class="w-full border border-gray-300 rounded-lg p-3" placeholder="투표 제목을 입력하세요">
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">투표 설명 (선택)</label>
          <textarea id="vote-description" rows="2" class="w-full border border-gray-300 rounded-lg p-3" placeholder="투표에 대한 설명"></textarea>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">투표 방식</label>
          <select id="vote-type" class="w-full border border-gray-300 rounded-lg p-3">
            <option value="single">단일 선택</option>
            <option value="multiple">복수 선택</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">마감일 (선택)</label>
          <input type="datetime-local" id="vote-end-date" class="w-full border border-gray-300 rounded-lg p-3">
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">선택지 (최소 2개)</label>
          <div id="vote-options-container"></div>
          <button onclick="addVoteOption()" class="mt-2 text-blue-600 hover:text-blue-700">
            <i class="fas fa-plus mr-1"></i>
            선택지 추가
          </button>
        </div>

        <div class="flex justify-end space-x-3">
          <button onclick="closeVoteModal()" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button onclick="submitVote()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            투표 만들기
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
  
  // 초기 선택지 2개 추가
  addVoteOption();
  addVoteOption();
}

// 투표 선택지 추가
function addVoteOption() {
  const container = document.getElementById('vote-options-container');
  if (!container) return;
  
  const index = container.children.length;
  const optionHtml = `
    <div class="flex items-center mb-2" data-option-index="${index}">
      <input type="text" class="vote-option flex-1 border border-gray-300 rounded-lg p-2" placeholder="선택지 ${index + 1}">
      <button onclick="removeVoteOption(this)" class="ml-2 text-red-600 hover:text-red-700">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', optionHtml);
}

// 투표 선택지 제거
function removeVoteOption(button) {
  const container = document.getElementById('vote-options-container');
  if (container.children.length <= 2) {
    alert('최소 2개의 선택지가 필요합니다');
    return;
  }
  button.parentElement.remove();
}

// 투표 모달 닫기
function closeVoteModal(event) {
  if (event && event.target.id !== 'vote-modal') return;
  const modal = document.getElementById('vote-modal');
  if (modal) modal.remove();
}

// 투표 제출
async function submitVote() {
  const title = document.getElementById('vote-title').value.trim();
  const description = document.getElementById('vote-description').value.trim();
  const voteType = document.getElementById('vote-type').value;
  const endDate = document.getElementById('vote-end-date').value;
  
  const optionInputs = document.querySelectorAll('.vote-option');
  const options = Array.from(optionInputs)
    .map(input => input.value.trim())
    .filter(text => text.length > 0);

  if (!title) {
    alert('투표 제목을 입력해주세요');
    return;
  }

  if (options.length < 2) {
    alert('최소 2개의 선택지를 입력해주세요');
    return;
  }

  try {
    await axios.post('/api/votes', {
      post_id: state.currentPost.id,
      title,
      description: description || null,
      vote_type: voteType,
      end_date: endDate || null,
      options
    });

    alert('투표가 생성되었습니다');
    closeVoteModal();
    
    // 게시글 다시 로드
    state.currentPost = null;
    loadPost(state.postId);
  } catch (error) {
    console.error('Submit vote error:', error);
    alert(error.response?.data?.error || '투표 생성에 실패했습니다');
  }
}

// 투표 로드
async function loadVote(postId) {
  try {
    const response = await axios.get(`/api/votes/post/${postId}`);
    state.currentVote = response.data.data;
    
    // 투표가 있으면 UI 업데이트
    if (state.currentVote) {
      updateVoteUI();
    }
  } catch (error) {
    console.error('Load vote error:', error);
  }
}

// 투표 UI 업데이트
function updateVoteUI() {
  const container = document.getElementById('vote-container');
  if (!container || !state.currentVote) return;

  const vote = state.currentVote;
  const totalVotes = vote.total_votes || 0;
  const isClosed = vote.status === 'closed' || (vote.end_date && new Date(vote.end_date) < new Date());
  const hasVoted = vote.my_votes && vote.my_votes.length > 0;
  const isAuthor = state.user && state.user.id === state.currentPost.user_id;
  const isAdmin = state.user && state.user.role === 'admin';

  container.innerHTML = `
    <div class="bg-blue-50 rounded-lg p-6 mb-6">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            <i class="fas fa-poll text-blue-600 mr-2"></i>
            ${vote.title}
          </h3>
          ${vote.description ? `<p class="text-gray-600 text-sm">${vote.description}</p>` : ''}
        </div>
        ${(isAuthor || isAdmin) && !isClosed ? `
          <button onclick="closeVote(${vote.id})" class="text-sm text-red-600 hover:text-red-700">
            <i class="fas fa-times-circle mr-1"></i>
            투표 종료
          </button>
        ` : ''}
      </div>

      <div class="space-y-3 mb-4">
        ${vote.options.map(option => {
          const voteCount = option.vote_count || 0;
          const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
          const isSelected = vote.my_votes && vote.my_votes.includes(option.id);
          
          return `
            <div class="relative">
              <div class="absolute inset-0 bg-blue-200 rounded" style="width: ${percentage}%; opacity: 0.3;"></div>
              <div class="relative flex items-center justify-between p-3 border border-gray-300 rounded ${isSelected ? 'border-blue-500 bg-blue-100' : 'bg-white'}">
                <label class="flex items-center flex-1 cursor-pointer">
                  ${!isClosed && state.user ? `
                    <input 
                      type="${vote.vote_type === 'single' ? 'radio' : 'checkbox'}" 
                      name="vote-option" 
                      value="${option.id}"
                      ${isSelected ? 'checked' : ''}
                      onchange="handleVoteChange()"
                      class="mr-3"
                    >
                  ` : ''}
                  <span class="font-medium">${option.option_text}</span>
                </label>
                <div class="text-sm text-gray-600">
                  <span class="font-semibold">${voteCount}표</span>
                  <span class="ml-2">(${percentage}%)</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="flex items-center justify-between text-sm text-gray-600">
        <div>
          <i class="fas fa-users mr-1"></i>
          총 ${totalVotes}명 참여
          ${isClosed ? '<span class="ml-3 text-red-600"><i class="fas fa-lock mr-1"></i>투표 종료</span>' : ''}
          ${vote.end_date ? `<span class="ml-3"><i class="fas fa-clock mr-1"></i>마감: ${new Date(vote.end_date).toLocaleDateString('ko-KR')}</span>` : ''}
        </div>
        ${!isClosed && state.user && !hasVoted ? `
          <button onclick="submitVoteCast()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            투표하기
          </button>
        ` : ''}
        ${hasVoted ? '<span class="text-green-600"><i class="fas fa-check mr-1"></i>투표 완료</span>' : ''}
      </div>
    </div>
  `;
}

// 투표 변경 처리
function handleVoteChange() {
  // 라디오/체크박스 변경만 처리, 실제 제출은 버튼 클릭 시
}

// 투표 제출
async function submitVoteCast() {
  const selectedOptions = Array.from(document.querySelectorAll('input[name="vote-option"]:checked'))
    .map(input => parseInt(input.value));

  if (selectedOptions.length === 0) {
    alert('선택지를 선택해주세요');
    return;
  }

  try {
    await axios.post(`/api/votes/${state.currentVote.id}/cast`, {
      option_ids: selectedOptions
    });

    alert('투표가 완료되었습니다');
    
    // 투표 다시 로드
    loadVote(state.currentPost.id);
  } catch (error) {
    console.error('Cast vote error:', error);
    alert(error.response?.data?.error || '투표에 실패했습니다');
  }
}

// 투표 종료
async function closeVote(voteId) {
  if (!confirm('투표를 종료하시겠습니까?')) return;

  try {
    await axios.post(`/api/votes/${voteId}/close`);
    alert('투표가 종료되었습니다');
    loadVote(state.currentPost.id);
  } catch (error) {
    console.error('Close vote error:', error);
    alert('투표 종료에 실패했습니다');
  }
}

// 파일 업로드 UI 표시
function showFileUpload() {
  const container = document.getElementById('file-upload-container');
  if (!container) return;

  container.innerHTML = `
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        파일 첨부 (이미지/동영상, 최대 50MB)
      </label>
      <input 
        type="file" 
        id="file-input" 
        accept="image/*,video/*" 
        multiple
        class="w-full border border-gray-300 rounded-lg p-2"
        onchange="handleFileSelect()"
      >
      <div id="file-preview" class="mt-2 grid grid-cols-2 gap-2"></div>
    </div>
  `;
}

// 파일 선택 처리
function handleFileSelect() {
  const input = document.getElementById('file-input');
  const preview = document.getElementById('file-preview');
  if (!input || !input.files || !preview) return;

  preview.innerHTML = '';

  Array.from(input.files).forEach((file, index) => {
    const div = document.createElement('div');
    div.className = 'relative border border-gray-300 rounded p-2';
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        div.innerHTML = `
          <img src="${e.target.result}" class="w-full h-32 object-cover rounded">
          <div class="text-xs text-gray-600 mt-1 truncate">${file.name}</div>
        `;
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      div.innerHTML = `
        <div class="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
          <i class="fas fa-video text-4xl text-gray-400"></i>
        </div>
        <div class="text-xs text-gray-600 mt-1 truncate">${file.name}</div>
      `;
    }
    
    preview.appendChild(div);
  });
}

// 파일 업로드 (게시글 작성 시)
async function uploadFiles(postId) {
  const input = document.getElementById('file-input');
  if (!input || !input.files || input.files.length === 0) return;

  const uploadPromises = Array.from(input.files).map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('post_id', postId);

    try {
      await axios.post('/api/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
    }
  });

  await Promise.all(uploadPromises);
}
