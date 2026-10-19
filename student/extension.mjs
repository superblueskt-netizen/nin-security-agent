// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
// ---------- 13단계: 로그인 사용자·기기·세션 표시 ----------
const DEVICE_STATUS_TEXT = { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' };
const SESSION_STATUS_TEXT = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
const MODE_TEXT = { demo: '예제 자료', disconnected: '연결 없음', unknown: '확인 불가' };
// 정상처럼 보이면 안 되는 상태(경고 표시 대상)
const WARN_DEVICE = new Set(['noncompliant', 'unknown']);
const WARN_SESSION = new Set(['expired', 'revoked', 'unknown']);

function node(tag, text, attrs = {}) {
  const e = document.createElement(tag);
  if (text != null) e.textContent = String(text);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function deviceStatusText(status) {
  return `${DEVICE_STATUS_TEXT[status] || DEVICE_STATUS_TEXT.unknown} (${status ?? 'unknown'})`;
}

function sessionStatusText(status) {
  return `${SESSION_STATUS_TEXT[status] || SESSION_STATUS_TEXT.unknown} (${status ?? 'unknown'})`;
}

// demo·disconnected·unknown 모드는 loading·error 상태에서도 함께 표시한다.
function modeNotice(resource) {
  const mode = resource && resource.mode;
  if (mode === 'connected') return null;
  const text = MODE_TEXT[mode] || MODE_TEXT.unknown;
  return node('p', `모드: ${text}`, { 'data-mode': mode || 'unknown', class: 'tag' });
}

// 상태 텍스트 + data-state 속성. 색이 아니라 글자로 구분하며, 경고 대상은 "주의:"를 붙인다.
function statusLine(label, text, warn, state) {
  const p = node('p', `${warn ? '주의: ' : ''}${label}: ${text}`, { 'data-state': state });
  if (warn) p.className = 'state state-error';
  return p;
}

function failureBox(resource) {
  const message = resource.error && resource.error.message ? resource.error.message : '서버 응답 없음';
  const code = resource.error && resource.error.code;
  const head = code === 'UNVERIFIED' ? '확인 불가' : '연결 실패';
  return node('p', `${head}: ${message}`, { role: 'alert', class: 'state state-error', 'data-status': 'error' });
}

function section(title, resource, renderOk) {
  const box = node('section', null, { 'data-identity-part': title.key, 'data-status': resource ? resource.status : 'unknown' });
  box.append(node('h3', title.text));
  const notice = modeNotice(resource);
  if (notice) box.append(notice);
  if (!resource || resource.status === 'loading') {
    box.append(node('p', '불러오는 중', { role: 'status', class: 'state state-loading' }));
  } else if (resource.status === 'error') {
    // 오류일 때 이전 사용자·기기·세션 값은 그리지 않는다(새 DOM으로 교체).
    box.append(failureBox(resource));
  } else if (resource.status === 'ok' && resource.data != null) {
    renderOk(box, resource.data);
  } else {
    box.append(node('p', '확인 불가: 응답 상태를 알 수 없습니다.', { class: 'state state-error' }));
  }
  return box;
}

// 매 호출마다 새 DOM 하나를 만들어 돌려준다. app.js가 학생 칸을 replaceChildren으로 교체하므로
// 다시 불러오기 시 이전 사용자·기기·세션 DOM이 남지 않는다.
export function renderIdentity({ me, devices, sessions } = {}) {
  const root = node('div', null, { 'data-testid': 'student-identity-view' });

  root.append(section({ key: 'me', text: '현재 로그인' }, me, (box, data) => {
    const user = data.user || {};
    const device = data.device || {};
    const session = data.session || {};
    box.append(node('p', `사용자: ${user.label || '(이름 없음)'} · ID ${user.id ?? '확인 불가'}`, { 'data-field': 'user' }));
    box.append(statusLine('현재 기기', `${device.label || '(이름 없음)'} · ID ${device.id ?? '확인 불가'} · ${deviceStatusText(device.status)}`,
      WARN_DEVICE.has(device.status) || !DEVICE_STATUS_TEXT[device.status], device.status || 'unknown'));
    box.append(statusLine('현재 세션', `ID ${session.id ?? '확인 불가'} · ${sessionStatusText(session.status)}`,
      WARN_SESSION.has(session.status) || !SESSION_STATUS_TEXT[session.status], session.status || 'unknown'));
  }));

  root.append(section({ key: 'devices', text: '내 기기' }, devices, (box, data) => {
    if (!Array.isArray(data) || data.length === 0) { box.append(node('p', '표시할 기기가 없습니다.')); return; }
    const ul = node('ul');
    for (const d of data) {
      const li = node('li', `${WARN_DEVICE.has(d.status) || !DEVICE_STATUS_TEXT[d.status] ? '주의: ' : ''}${d.label || '(이름 없음)'} · ID ${d.id} · ${deviceStatusText(d.status)}`, { 'data-state': d.status || 'unknown' });
      ul.append(li);
    }
    box.append(ul);
  }));

  root.append(section({ key: 'sessions', text: '로그인 세션' }, sessions, (box, data) => {
    if (!Array.isArray(data) || data.length === 0) { box.append(node('p', '표시할 세션이 없습니다.')); return; }
    const ul = node('ul');
    for (const s of data) {
      ul.append(node('li', `${WARN_SESSION.has(s.status) || !SESSION_STATUS_TEXT[s.status] ? '주의: ' : ''}세션 ID ${s.id} · ${sessionStatusText(s.status)}`, { 'data-state': s.status || 'unknown' }));
    }
    box.append(ul);
  }));

  root.append(node('p', '기기 보안 상태 표시는 악성코드 검사나 치료 기능이 아닙니다.', { class: 'muted' }));
  return root;
}

// ---------- 14단계: 업무 앱 접근 판정 표시 ----------
const DECISION_TEXT = {
  allow: { label: '허용', note: '정책상 접근 허용입니다. 실제 앱 접속 성공을 보장하지 않습니다.' },
  deny: { label: '거부', note: '정책상 접근이 거부되었습니다.' },
  challenge: { label: '추가 확인 필요', note: '추가 인증 또는 확인이 필요합니다. 이 앱이 확인 절차를 대신 수행하지 않습니다.' },
  unknown: { label: '확인 불가', note: '판정을 확인할 수 없습니다. 접근이 허용되지 않은 상태로 취급하세요.' },
};

function formatCheckedAt(value) {
  if (typeof value !== 'string' || !value) return '시각 정보 없음';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('ko-KR');
}

export function renderDecision({ status, mode, data, error, appId } = {}) {
  const root = node('div', null, { 'data-testid': 'student-decision-view', 'data-status': status || 'unknown' });
  const target = (data && data.appId) || appId;
  if (status !== 'idle') {
    const notice = modeNotice({ mode });
    if (notice) root.append(notice);
  }

  if (status === 'idle') {
    root.setAttribute('data-decision', 'none');
    root.append(node('p', '앱을 골라 접속을 요청하세요.', { role: 'status' }));
    return root;
  }
  if (status === 'loading') {
    root.setAttribute('data-decision', 'pending');
    root.append(node('p', `판정 확인 중: ${target ?? '앱 정보 없음'}`, { role: 'status', class: 'state state-loading' }));
    return root;
  }
  if (status === 'error') {
    // 요청 실패는 거부 판정이 아니다. 판정 값으로 표시하지 않는다.
    root.setAttribute('data-decision', 'request-failed');
    const message = error && error.message ? error.message : '서버 응답 없음';
    root.append(node('p', `요청 실패: ${message}`, { role: 'alert', class: 'state state-error' }));
    root.append(node('p', `앱: ${target ?? '앱 정보 없음'}`));
    root.append(node('p', '이것은 거부 판정이 아니며, 접근이 허용된 것도 아닙니다. 필요하면 다시 요청하세요.', { class: 'muted' }));
    return root;
  }
  if (status !== 'ok' || !data) {
    root.setAttribute('data-decision', 'unknown');
    root.append(node('p', '주의: 확인 불가(unknown) · 응답 상태를 알 수 없습니다. 허용되지 않음', { class: 'state state-error' }));
    return root;
  }

  // 목록에 없는 decision은 unknown으로 처리해 허용처럼 보이지 않게 한다.
  const code = Object.prototype.hasOwnProperty.call(DECISION_TEXT, data.decision) ? data.decision : 'unknown';
  const info = DECISION_TEXT[code];
  root.setAttribute('data-decision', code);
  const warn = code !== 'allow';
  const head = node('p', `${warn ? '주의: ' : ''}판정: ${info.label}(${code})${code === 'unknown' && data.decision !== 'unknown' ? ` · 받은 값 ${String(data.decision)}` : ''}`, { 'data-state': code });
  if (warn) head.className = 'state state-error';
  root.append(head);
  root.append(node('p', info.note));
  root.append(node('p', `앱: ${target ?? '앱 정보 없음'}`));
  root.append(node('p', `판정 이유: ${data.reason || '이유 정보 없음'}`, { 'data-field': 'reason' }));
  root.append(node('p', `판정 시각: ${formatCheckedAt(data.checkedAt)}`, { 'data-field': 'checkedAt' }));
  return root;
}

export function createStudentView() {
  return {
    renderIdentity,
    renderDecision,
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
