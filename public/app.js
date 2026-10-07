const form = document.querySelector('#chatForm');
const input = document.querySelector('#messageInput');
const sendButton = document.querySelector('#sendButton');
const resetButton = document.querySelector('#resetButton');
const welcome = document.querySelector('#welcome');
const messages = document.querySelector('#messages');
const scroll = document.querySelector('#chatScroll');
const note = document.querySelector('#connectionNote');
const toast = document.querySelector('#toast');
const chatWindow = document.querySelector('.chat-window');
const launcher = document.querySelector('#launcher');
const conversation = [];
const isPages = location.hostname.endsWith('.github.io') || location.protocol === 'file:';
const apiUrl = window.SAJU_CONFIG?.apiUrl || (isPages ? '' : '/api/chat');
let busy = false;
let toastTimer;
note.hidden = Boolean(apiUrl);

function syncInput() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  sendButton.disabled = busy || !input.value.trim();
}
function notify(text) {
  clearTimeout(toastTimer);
  toast.textContent = text;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
}
function addMessage(role, content) {
  const row = document.createElement('article');
  row.className = `message ${role}`;
  if (role !== 'user') {
    const avatar = document.createElement('span');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<svg aria-hidden="true"><use href="#spark"/></svg>';
    row.append(avatar);
  }
  const body = document.createElement('div');
  body.className = 'message-body';
  if (role !== 'user') {
    const name = document.createElement('div');
    name.className = 'message-name';
    name.textContent = '사주팔자 풀이';
    body.append(name);
  }
  const text = document.createElement('div');
  text.className = 'message-text';
  text.textContent = content;
  body.append(text);
  row.append(body);
  messages.append(row);
  scroll.scrollTop = scroll.scrollHeight;
  return row;
}
document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => {
    input.value = button.dataset.prompt;
    syncInput();
    input.focus();
  });
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const content = input.value.trim();
  if (!content || busy) return;
  if (!apiUrl) {
    notify('현재는 디자인 미리보기입니다. 아래의 “기존 챗봇에서 상담하기”로 실제 대화를 이용할 수 있어요.');
    return;
  }
  busy = true;
  resetButton.disabled = true;
  input.value = '';
  input.disabled = true;
  syncInput();
  welcome.hidden = true;
  addMessage('user', content);
  const pending = addMessage('pending', '이야기를 살펴보고 있어요…');
  const requestMessages = [...conversation, { role: 'user', content }];
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: requestMessages }),
      signal: AbortSignal.timeout(90000),
    });
    const data = await response.json().catch(() => { throw new Error('대화 서버가 올바른 응답을 보내지 않았습니다.'); });
    if (!response.ok) throw new Error(data.error || '답변을 불러오지 못했습니다.');
    if (typeof data.content !== 'string' || !data.content.trim()) throw new Error('답변 내용이 비어 있습니다.');
    conversation.push({ role: 'user', content }, { role: 'assistant', content: data.content });
    pending.remove();
    addMessage('assistant', data.content);
  } catch (error) {
    pending.remove();
    addMessage('error', error.name === 'TimeoutError' ? '답변이 지연되고 있어요. 잠시 후 다시 시도해주세요.' : error.message);
    input.value = content;
  } finally {
    busy = false;
    resetButton.disabled = false;
    input.disabled = false;
    syncInput();
    input.focus();
  }
});
input.addEventListener('input', syncInput);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    form.requestSubmit();
  }
});
resetButton.addEventListener('click', () => {
  if (busy) return;
  conversation.length = 0;
  messages.replaceChildren();
  welcome.hidden = false;
  input.value = '';
  syncInput();
  scroll.scrollTop = 0;
  input.focus();
});
document.querySelector('#minimizeButton').addEventListener('click', () => {
  chatWindow.hidden = true;
  launcher.hidden = false;
  launcher.focus();
});
launcher.addEventListener('click', () => {
  chatWindow.hidden = false;
  launcher.hidden = true;
  input.focus();
});
