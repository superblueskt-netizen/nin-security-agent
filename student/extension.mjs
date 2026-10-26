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

// ---------- 15단계: 접속 기록·XDR 경보 목록과 상세 ----------
const KIND_TEXT = { access: '접속 기록', xdr: 'XDR 경보' };
const ACCESS_STATE_TEXT = { allowed: '허용됨', denied: '거부됨', unknown: '확인 불가' };
const MISSING_APP = '__missing_app__';

function codeText(map, value) {
  const code = Object.prototype.hasOwnProperty.call(map, value) ? value : 'unknown';
  const extra = code !== value ? ` · 받은 값 ${String(value)}` : '';
  return `${map[code]}(${code})${extra}`;
}

function eventTime(value) {
  if (typeof value !== 'string' || !value) return '시각 정보 없음';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : `${d.toLocaleString('ko-KR')} (${value})`;
}

function timeValue(value) {
  const t = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isNaN(t) ? -Infinity : t;
}

function appKey(event) {
  return typeof event.appId === 'string' && event.appId ? event.appId : MISSING_APP;
}

function appText(event) {
  return appKey(event) === MISSING_APP ? '앱 확인 불가(appId 없음)' : event.appId;
}

function filterSelect(id, labelText, options, value, onChange) {
  const wrap = node('div');
  const label = node('label', labelText, { for: id });
  const select = node('select', null, { id, 'aria-label': labelText });
  for (const [v, t] of options) {
    const opt = node('option', t, { value: v });
    if (v === value) opt.setAttribute('selected', '');
    select.append(opt);
  }
  select.value = value;
  select.addEventListener('change', () => onChange(select.value));
  wrap.append(label, select);
  return wrap;
}

function renderEventDetail(event) {
  const box = node('section', null, { 'data-student-event-detail': event.id });
  box.append(node('h4', `${event.id} 상세`));
  box.append(node('p', `사건 ID: ${event.id}`));
  box.append(node('p', `앱: ${appText(event)}`));

  box.append(node('h5', '근거(evidence)'));
  const ev = Array.isArray(event.evidence) ? event.evidence : [];
  if (ev.length === 0) box.append(node('p', '근거 정보 없음'));
  else { const ul = node('ul'); for (const e of ev) ul.append(node('li', `${e.id}: ${e.text}`)); box.append(ul); }

  box.append(node('h5', '규칙(rules)'));
  const rules = Array.isArray(event.rules) ? event.rules : [];
  if (rules.length === 0) box.append(node('p', '규칙 정보 없음'));
  else { const ul = node('ul'); for (const r of rules) ul.append(node('li', `${r.id}: ${r.text}`)); box.append(ul); }

  box.append(node('h5', '상태(state)'));
  const st = event.state || {};
  const ul = node('ul');
  ul.append(node('li', `접속(access): ${codeText(ACCESS_STATE_TEXT, st.access)}`, { 'data-state': st.access ?? 'unknown' }));
  ul.append(node('li', `세션(session): ${codeText(SESSION_STATUS_TEXT, st.session)}`, { 'data-state': st.session ?? 'unknown' }));
  ul.append(node('li', `기기(device): ${codeText(DEVICE_STATUS_TEXT, st.device)}`, { 'data-state': st.device ?? 'unknown' }));
  box.append(ul);
  // 16단계: 연결되지 않은 조치가 넘어온 경우에만 비활성 안내 버튼을 둔다. 비어 있으면 버튼을 만들지 않는다.
  const actions = Array.isArray(event.supportedActions) ? event.supportedActions : [];
  if (actions.length > 0) {
    box.append(node('h5', '조치'));
    for (const action of actions) {
      const btn = node('button', `${action} 미지원`, { type: 'button', disabled: '', 'aria-disabled': 'true', 'data-student-unsupported-action': String(action) });
      btn.disabled = true; // 클릭 이벤트를 연결하지 않으며 어떤 요청도 보내지 않는다.
      box.append(btn);
    }
    box.append(node('p', '아직 지원하지 않는 조치입니다. 조치 실행 연결은 준비 중이며, 이 버튼은 요청을 보내지 않습니다.', { class: 'muted' }));
  }
  return box;
}

// 필터·상세 선택 상태는 이 렌더러 안에만 둔다. app.js가 새 자료로 호출하면 모두 초기화한다.
function createEventsRenderer() {
  return function renderEvents({ status, mode, data, error } = {}) {
    const root = node('div', null, { 'data-testid': 'student-events-view', 'data-status': status || 'unknown' });
    const ui = { kind: 'all', app: 'all', access: 'all', selectedId: null };
    const events = Array.isArray(data) ? data.slice().sort((a, b) => timeValue(b.at) - timeValue(a.at)) : [];

    function draw() {
      const children = [];
      const notice = modeNotice({ mode });
      if (notice) children.push(notice);

      if (status === 'loading') {
        children.push(node('p', '기록을 불러오는 중', { role: 'status', class: 'state state-loading' }));
      } else if (status === 'error') {
        const unverified = error && error.code === 'CONTRACT_MISMATCH';
        const message = error && error.message ? error.message : '서버 응답 없음';
        children.push(node('p', `${unverified ? '확인 불가 · ' : ''}기록을 불러오지 못했습니다: ${message}`, { role: 'alert', class: 'state state-error', 'data-events-state': unverified ? 'unverified' : 'error' }));
        children.push(node('p', '이전 목록은 표시하지 않습니다. 기록이 없다는 뜻이 아닙니다.', { class: 'muted' }));
      } else if (status === 'ok' && Array.isArray(data) && events.length === 0) {
        children.push(node('p', '표시할 기록이 없습니다.', { role: 'status', 'data-events-state': 'empty' }));
        children.push(node('p', '조회는 성공했고 본인의 최근 기록이 0건입니다.', { class: 'muted' }));
      } else if (status === 'ok' && Array.isArray(data)) {
        const kinds = [...new Set(events.map((e) => e.kind))];
        const apps = [...new Set(events.map(appKey))];
        const accesses = [...new Set(events.map((e) => (e.state || {}).access))];
        const filters = node('div', null, { 'data-student-event-filters': '' });
        filters.append(
          filterSelect('student-filter-kind', '기록 종류', [['all', '전체(all)'], ...kinds.map((k) => [k, `${KIND_TEXT[k] || '알 수 없는 종류'}(${k})`])], ui.kind, (v) => { ui.kind = v; ui.selectedId = null; draw(); }),
          filterSelect('student-filter-app', '업무 앱', [['all', '전체(all)'], ...apps.map((a) => [a, a === MISSING_APP ? '앱 확인 불가(appId 없음)' : a])], ui.app, (v) => { ui.app = v; ui.selectedId = null; draw(); }),
          filterSelect('student-filter-access', '접속 상태', [['all', '전체(all)'], ...accesses.map((a) => [a, codeText(ACCESS_STATE_TEXT, a)])], ui.access, (v) => { ui.access = v; ui.selectedId = null; draw(); }),
        );
        children.push(filters);

        const shown = events.filter((e) => (ui.kind === 'all' || e.kind === ui.kind)
          && (ui.app === 'all' || appKey(e) === ui.app)
          && (ui.access === 'all' || (e.state || {}).access === ui.access));
        children.push(node('p', `표시 ${shown.length}건 / 받은 기록 ${events.length}건 (본인의 최근 기록, 최대 40건)`, { 'data-student-event-count': String(shown.length) }));

        if (shown.length === 0) {
          children.push(node('p', '필터 조건에 맞는 기록이 없습니다.', { role: 'status' }));
        } else {
          const ul = node('ul');
          for (const e of shown) {
            const li = node('li', null, { 'data-student-event-id': e.id });
            li.append(node('p', `${e.id} · ${eventTime(e.at)} · ${KIND_TEXT[e.kind] ? `${KIND_TEXT[e.kind]}(${e.kind})` : `알 수 없는 종류(${e.kind})`} · 앱: ${appText(e)}`));
            li.append(node('p', `요약: ${e.summary ?? '요약 없음'}`));
            const btn = node('button', `${e.id} 상세`, { type: 'button', 'aria-label': `${e.id} 상세`, 'aria-expanded': String(ui.selectedId === e.id) });
            btn.addEventListener('click', () => { ui.selectedId = ui.selectedId === e.id ? null : e.id; draw(); });
            li.append(btn);
            if (ui.selectedId === e.id) li.append(renderEventDetail(e));
            ul.append(li);
          }
          children.push(ul);
        }
      } else {
        children.push(node('p', '확인 불가: 기록 응답 상태를 알 수 없습니다.', { class: 'state state-error' }));
      }
      root.replaceChildren(...children);
    }

    draw();
    return root;
  };
}

// ---------- 16단계: 알림·빈 상태·오류·도움정보 ----------
const TIMEOUT_CODES = new Set(['TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT']);
const RETRY_TEXT = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요. 자동으로 다시 요청하지 않습니다.';

function statusFailure(what, resource) {
  const error = resource.error || {};
  const message = error.message || '서버 응답 없음';
  const timeout = TIMEOUT_CODES.has(error.code);
  const out = [node('p', `${what}을(를) 불러오지 못했습니다${timeout ? '(시간 초과)' : ''}: ${message}`, { role: 'alert', class: 'state state-error', 'data-status-state': timeout ? 'timeout' : 'error' })];
  out.push(node('p', RETRY_TEXT, { class: 'muted' }));
  return out;
}

function statusSection(key, title, resource, emptyText, renderItem, scopeNote) {
  const box = node('section', null, { 'data-student-status-part': key, 'data-status': resource ? resource.status : 'unknown' });
  box.append(node('h3', title));
  const notice = resource && resource.status !== 'idle' ? modeNotice(resource) : null;
  if (notice) box.append(notice);
  if (!resource || resource.status === 'loading') {
    box.append(node('p', `${title} 불러오는 중`, { role: 'status', class: 'state state-loading', 'data-status-state': 'loading' }));
  } else if (resource.status === 'error') {
    box.append(...statusFailure(title, resource));
  } else if (resource.status === 'ok' && Array.isArray(resource.data)) {
    if (resource.data.length === 0) box.append(node('p', emptyText, { role: 'status', 'data-status-state': 'empty' }));
    else { const ul = node('ul'); for (const item of resource.data) ul.append(renderItem(item)); box.append(ul); }
  } else {
    box.append(node('p', `확인 불가: ${title} 응답 상태를 알 수 없습니다.`, { class: 'state state-error' }));
  }
  if (scopeNote) box.append(node('p', scopeNote, { class: 'muted' }));
  return box;
}

// 진단 결과에서 허용된 6개 값만 고른다. 그 밖의 필드(키·토큰 등)는 화면에도 복사본에도 넣지 않는다.
function safeDiagnostics(data) {
  const d = data && typeof data === 'object' ? data : {};
  const engine = d.engine && typeof d.engine === 'object' ? d.engine : {};
  const pick = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '확인 불가');
  return {
    requestId: pick(d.requestId),
    component: pick(d.component),
    version: pick(d.version),
    checkedAt: pick(d.checkedAt),
    'engine.mode': pick(engine.mode),
    'engine.code': pick(engine.code),
  };
}

export function renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
  const root = node('div', null, { 'data-testid': 'student-status-view' });
  const overall = modeNotice({ mode });
  if (overall) root.append(overall);

  root.append(statusSection('devices', '등록 기기', devices, '등록된 기기가 없습니다.',
    (d) => node('li', `${WARN_DEVICE.has(d.status) || !DEVICE_STATUS_TEXT[d.status] ? '주의: ' : ''}${d.label || '(이름 없음)'} · ${deviceStatusText(d.status)}`, { 'data-state': d.status || 'unknown' }),
    '내 이름으로 등록된 기기(최대 100개)만 표시합니다.'));

  root.append(statusSection('sessions', '현재 세션', sessions, '현재 연결 없음: 검증된 세션이 없습니다.',
    (s) => node('li', `${WARN_SESSION.has(s.status) || !SESSION_STATUS_TEXT[s.status] ? '주의: ' : ''}세션 ID ${s.id} · ${sessionStatusText(s.status)}`, { 'data-state': s.status || 'unknown' }),
    '세션은 지금 검증된 연결 하나만 표시합니다. 지난 세션 목록이 아닙니다.'));

  // 알림
  const notes = node('section', null, { 'data-student-status-part': 'notifications' });
  notes.append(node('h3', '알림'));
  const list = Array.isArray(notifications) ? notifications : [];
  if (list.length === 0) notes.append(node('p', '주의할 알림이 없습니다.', { role: 'status', 'data-status-state': 'no-notifications' }));
  else {
    const ul = node('ul');
    for (const n of list) ul.append(node('li', `[${n.resource ?? '알 수 없는 자료'}] ${n.code ?? 'UNKNOWN'}: ${n.message ?? ''}`, { 'data-notification-resource': String(n.resource ?? 'unknown') }));
    notes.append(ul);
  }
  root.append(notes);

  // 도움정보(진단)
  const diag = node('section', null, { 'data-student-status-part': 'diagnostics', 'data-status': diagnostics ? diagnostics.status : 'unknown' });
  diag.append(node('h3', '도움정보'));
  let safe = null;
  if (!diagnostics || diagnostics.status === 'idle') {
    diag.append(node('p', '도움정보를 아직 불러오지 않았습니다. 필요하면 아래쪽 제공 도움정보 칸의 「도움정보 불러오기」 버튼을 직접 누르세요.', { 'data-status-state': 'idle' }));
  } else if (diagnostics.status === 'loading') {
    diag.append(node('p', '도움정보 불러오는 중', { role: 'status', class: 'state state-loading', 'data-status-state': 'loading' }));
  } else if (diagnostics.status === 'error') {
    diag.append(...statusFailure('도움정보', diagnostics));
  } else if (diagnostics.status === 'ok') {
    safe = safeDiagnostics(diagnostics.data);
    const dl = node('ul');
    for (const [k, v] of Object.entries(safe)) dl.append(node('li', `${k}: ${v}`));
    diag.append(dl);
  } else {
    diag.append(node('p', '확인 불가: 도움정보 응답 상태를 알 수 없습니다.', { class: 'state state-error' }));
  }
  const copyStatus = node('p', '', { role: 'status', 'aria-live': 'polite' });
  const copyBtn = node('button', '도움정보 복사', { type: 'button' });
  if (!safe) { copyBtn.disabled = true; copyBtn.setAttribute('disabled', ''); }
  copyBtn.addEventListener('click', async () => {
    if (!safe) return;
    const text = JSON.stringify(safe, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = '도움정보를 클립보드에 복사했습니다. 붙여 넣기 전에 내용을 직접 확인하세요.';
    } catch {
      copyStatus.textContent = '클립보드에 복사하지 못했습니다. 위의 값을 직접 선택해 복사하세요.';
    }
  });
  diag.append(node('p', '이 버튼은 도움을 요청할 때 쓸 비밀 없는 점검 값(requestId·component·version·checkedAt·engine.mode·engine.code)만 누를 때 한 번 복사합니다.', { class: 'muted' }));
  diag.append(copyBtn, copyStatus);
  root.append(diag);
  return root;
}

// ---------- 17단계: 앱 내부 AI 연결 상태 ----------
const AI_MANUAL = '다시 점검은 「현재 API 연결 점검」 버튼을 직접 누르세요. 자동으로 다시 점검하지 않습니다.';
const AI_ERROR_GROUPS = [
  { key: 'provisioning', label: '권한 준비 중·확인 불가', codes: ['ON_AI_PROVISIONING_PENDING', 'ON_AI_AUTHORIZATION_CHANGED', 'AI_REQUEST_UNVERIFIED', 'SUBJECT_SCOPE_UNVERIFIED'],
    guide: '학생 잘못이 아닙니다. 담당자에게 계정 연결과 앱 이용 권한 확인을 요청하세요.' },
  { key: 'auth', label: '인증 실패', codes: ['WB_CLCO_AUTH_REQUIRED'],
    guide: '계정 연결을 다시 확인하고, 계속되면 담당자에게 확인하세요. 열쇠를 복사해 붙이지 마세요.' },
  { key: 'access', label: '접근 제한', codes: ['WB_CLCO_ACCESS_BLOCKED'],
    guide: '계정 연결을 다시 확인하고, 담당자에게 앱 이용 권한을 확인하세요.' },
  { key: 'limit', label: '사용량·이용 한도', codes: ['WB_CLCO_COHORT_BUDGET_EXHAUSTED', 'WB_CLCO_LIMIT_REACHED'],
    guide: '반 사용량 또는 이용 한도 문제입니다. 담당자에게 확인하세요.' },
  { key: 'session', label: '이용 시간 아님', codes: ['WB_CLCO_SESSION_CLOSED'],
    guide: '현재 AI 이용 시간이 아닙니다. 이용 시간을 확인하세요.' },
  { key: 'retry', label: '요청 제한·시간 초과·네트워크', codes: ['WB_CLCO_RATE_LIMITED', 'WB_CLCO_TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT', 'TIMEOUT', 'NETWORK', 'NETWORK_ERROR', 'SERVICE_UNAVAILABLE'],
    guide: '잠시 뒤 직접 다시 점검하세요.' },
  { key: 'cancelled', label: '취소됨', codes: ['WB_CLCO_CANCELLED', 'CANCELLED', 'REQUEST_CANCELLED'],
    guide: '점검을 취소했습니다. 이전 결과는 현재 결과가 아닙니다.' },
  { key: 'no-model', label: '쓸 수 있는 모델 없음', codes: ['ON_AI_MODEL_LIST_EMPTY', 'MODEL_NOT_CONFIGURED'],
    guide: '담당자에게 모델 허용 설정 확인을 요청하세요.' },
];

function aiErrorGroup(code) {
  return AI_ERROR_GROUPS.find((g) => g.codes.includes(code))
    || { key: 'unknown', label: '확인 불가', guide: '원인을 확인할 수 없습니다. 담당자에게 계정 연결과 앱 이용 권한 확인을 요청하세요.' };
}

// 호출할 때마다 새 DOM을 돌려준다. 다시 점검·idle 복귀 시 이전 결과·오류는 남지 않는다.
export function renderAiConnection({ status, mode, data, error, checkedAt } = {}) {
  const root = node('div', null, { 'data-testid': 'student-ai-connection-view', 'data-status': status || 'unknown' });
  if (status && status !== 'idle') { const n = modeNotice({ mode }); if (n) root.append(n); }

  if (!status || status === 'idle') {
    root.setAttribute('data-ai-state', 'idle');
    root.append(node('p', 'AI 연결 점검 전', { role: 'status' }));
    root.append(node('p', '계정 연결과 AI 연결을 마친 뒤 「현재 API 연결 점검」을 직접 누르세요.', { class: 'muted' }));
  } else if (status === 'loading') {
    root.setAttribute('data-ai-state', 'loading');
    root.append(node('p', 'AI 연결 점검 중', { role: 'status', class: 'state state-loading' }));
  } else if (status === 'ok' && data) {
    const verified = data.audienceAuthorization === 'verified';
    const test = data.audienceAuthorization === 'test';
    root.setAttribute('data-ai-state', verified ? 'verified' : test ? 'test' : 'unknown');
    root.append(node('p', verified ? '앱 권한 확인 후 점검(verified)' : test ? '시험 연결 점검(test)' : `확인 불가(${String(data.audienceAuthorization)})`,
      verified ? {} : { class: 'state state-error' }));
    root.append(node('p', `앱 서버 경유 연결 확인: ${data.transportChecked === true ? '예' : '확인 불가'}`));
    root.append(node('p', `응답한 모델 수: ${Number.isInteger(data.modelCount) ? data.modelCount : '확인 불가'}`));
    root.append(node('p', `점검 시각: ${formatCheckedAt(checkedAt)}`));
    if (test) root.append(node('p', '시험 연결입니다. 앱 이용 권한은 아직 준비 중(pending)이며 연결 완료로 보지 않습니다.', { class: 'muted' }));
    root.append(node('p', '연결만 점검했습니다. 사건 설명은 아직 실행하지 않았습니다. 사건 설명은 보안 기록에서 따로 요청하고 확인합니다.', { 'data-ai-explanation': 'not-run' }));
  } else if (status === 'error') {
    const code = error && typeof error.code === 'string' ? error.code : 'AI_REQUEST_UNVERIFIED';
    const message = error && error.message ? error.message : '응답을 확인할 수 없습니다.';
    const g = aiErrorGroup(code);
    root.setAttribute('data-ai-state', `error-${g.key}`);
    root.append(node('p', g.key === 'cancelled' ? 'AI 연결 점검 취소됨' : `AI 연결 점검 실패 · ${g.label}`, { role: 'alert', class: 'state state-error' }));
    root.append(node('p', `오류 코드: ${code}`));
    root.append(node('p', `안내: ${message}`));
    root.append(node('p', `조치: ${g.guide}`));
    root.append(node('p', AI_MANUAL, { class: 'muted' }));
  } else {
    root.setAttribute('data-ai-state', 'unknown');
    root.append(node('p', '확인 불가: AI 점검 응답 상태를 알 수 없습니다.', { class: 'state state-error' }));
    root.append(node('p', AI_MANUAL, { class: 'muted' }));
  }
  return root;
}

// ---------- 18단계: 근거에 연결된 AI 사건 설명 ----------
// 호출할 때마다 새 DOM을 돌려준다. 다른 기록 선택·다시 불러오기·실패 시 이전 설명과 성공 속성은 남지 않는다.
const EXPLAIN_STATE_NAMES = [['access', '접속'], ['session', '세션'], ['device', '기기']];
const EXPLAIN_FAIL_REASON = {
  ON_AI_INVALID_INPUT: '근거 부족: 설명에 필요한 사건 근거·규칙을 확인할 수 없습니다.',
  ON_AI_INVALID_OUTPUT: '근거 불일치: AI가 인용한 근거·조치·응답 형식이 이 기록과 맞지 않습니다.',
  WB_CLCO_CANCELLED: '취소됨: 이전 설명은 현재 결과가 아닙니다.',
  CANCELLED: '취소됨: 이전 설명은 현재 결과가 아닙니다.',
  REQUEST_CANCELLED: '취소됨: 이전 설명은 현재 결과가 아닙니다.',
};

function explanationFailure(event, code, message, reason) {
  // 실패·근거 불일치 화면에는 data-student-explanation-event를 붙이지 않는다.
  const root = node('div', null, { 'data-testid': 'student-explanation-view', 'data-status': 'error' });
  root.append(node('p', `AI 설명 실패: ${code} · ${message}`, { role: 'alert', class: 'state state-error' }));
  root.append(node('p', `실패 이유: ${reason}`));
  if (event && event.id != null) root.append(node('p', `선택한 기록 ID: ${event.id}`));
  root.append(node('p', '기록은 그대로입니다. AI 설명 실패는 과제 실패가 아니며, 업무 앱 판정과 보안 기록은 계속 동작합니다.', { class: 'muted' }));
  return root;
}

// 설명이 이 기록의 근거·조치와 맞는지 다시 대조한다. 맞지 않으면 까닭을, 맞으면 null을 돌려준다.
function explanationMismatch(event, data, evidenceText) {
  if (!data || typeof data !== 'object') return '설명 자료가 없습니다.';
  if (data.executed === true) return 'AI가 이미 실행했다고 답한 설명은 쓸 수 없습니다.';
  if (data.executed !== false || data.requiresHumanConfirmation !== true) return '사람 확인·미실행 표시가 없는 설명은 쓸 수 없습니다.';
  if (typeof data.summary !== 'string' || !data.summary) return 'AI 요약이 없습니다.';
  const ids = data.evidenceIds;
  if (!Array.isArray(ids) || ids.length === 0) return '인용한 근거 ID가 없습니다.';
  if (new Set(ids).size !== ids.length) return '같은 근거 ID를 중복 인용했습니다.';
  const missing = ids.filter((id) => !evidenceText.has(id)).length;
  if (missing > 0) return `근거가 맞지 않음: 이 기록(${event.id})에 없는 근거 ID ${missing}개를 인용했습니다.`;
  if (!Array.isArray(data.proposals)) return '조치 제안 형식을 확인할 수 없습니다.';
  const actions = Array.isArray(event.supportedActions) ? event.supportedActions : [];
  for (const p of data.proposals) {
    if (!p || !actions.includes(p.action)) return '이 기록에서 지원하지 않는 조치를 제안했습니다.';
    if (!Array.isArray(p.evidenceIds) || p.evidenceIds.length === 0 || p.evidenceIds.some((id) => !evidenceText.has(id))) return `근거가 맞지 않음: 조치 제안이 이 기록(${event.id})에 없는 근거를 인용했습니다.`;
  }
  return null;
}

export function renderExplanation({ event, explanation, checkedAt } = {}) {
  const res = explanation && typeof explanation === 'object' ? explanation : {};

  // 1) 오류는 event가 null이어도 먼저 보여 준다.
  if (res.status === 'error') {
    const code = res.error && typeof res.error.code === 'string' ? res.error.code : 'AI_REQUEST_UNVERIFIED';
    const message = res.error && res.error.message ? res.error.message : '응답을 확인할 수 없습니다.';
    return explanationFailure(event, code, message, EXPLAIN_FAIL_REASON[code] || 'AI 연결 또는 응답 문제로 설명을 받지 못했습니다.');
  }

  // 2) 오류 없이 기록이 없으면 먼저 고르도록 안내한다.
  if (!event || event.id == null) {
    const root = node('div', null, { 'data-testid': 'student-explanation-view', 'data-status': 'no-event' });
    root.append(node('p', '보안 기록에서 기록을 먼저 고르세요.'));
    root.append(node('p', '보안 기록의 「AI 설명 요청」 버튼을 직접 눌러야 설명을 요청합니다.', { class: 'muted' }));
    return root;
  }

  if (res.status === 'loading') {
    const root = node('div', null, { 'data-testid': 'student-explanation-view', 'data-status': 'loading' });
    root.append(node('p', `AI 설명 요청 중: ${event.id}`, { role: 'status', class: 'state state-loading' }));
    return root;
  }

  if (res.status !== 'ok') {
    const root = node('div', null, { 'data-testid': 'student-explanation-view', 'data-status': 'idle' });
    root.append(node('p', `선택한 기록 ID: ${event.id} · 아직 AI 설명을 받지 않았습니다.`));
    return root;
  }

  // 3) 성공 응답도 이 기록의 근거와 다시 대조한다. 없는 근거 ID를 만들어 맞추지 않는다.
  const evidence = Array.isArray(event.evidence) ? event.evidence : [];
  const evidenceText = new Map(evidence.map((e) => [e.id, e.text]));
  const data = res.data;
  const mismatch = explanationMismatch(event, data, evidenceText);
  if (mismatch) return explanationFailure(event, 'ON_AI_INVALID_OUTPUT', '설명을 이 기록에 쓸 수 없습니다.', mismatch);

  const root = node('div', null, { 'data-student-explanation-event': String(event.id), 'data-status': 'ok' });
  const mode = modeNotice(res); if (mode) root.append(mode);
  root.append(node('h4', 'AI 설명(참고용)'));
  root.append(node('p', `사건 ID: ${event.id}`));
  root.append(node('p', `AI 요약: ${data.summary}`));
  root.append(node('p', 'AI 설명은 해석입니다. 사실 판단은 아래 근거 글과 연동 시스템이 알려 준 상태로 하세요.', { class: 'muted' }));

  root.append(node('h5', '인용한 근거'));
  const evList = node('ul');
  for (const id of data.evidenceIds) evList.append(node('li', `${id} — ${evidenceText.get(id)}`));
  root.append(evList);

  root.append(node('h5', '규칙'));
  const rules = Array.isArray(event.rules) ? event.rules : [];
  if (rules.length === 0) root.append(node('p', '없음'));
  else { const ul = node('ul'); for (const r of rules) ul.append(node('li', `${r.id} — ${r.text}`)); root.append(ul); }

  // 4) unknown은 확인 불가로만 적고 정상·안전으로 바꾸지 않는다.
  root.append(node('h5', '확인 불가 상태'));
  const state = event.state && typeof event.state === 'object' ? event.state : {};
  const unknowns = EXPLAIN_STATE_NAMES.filter(([key]) => state[key] === 'unknown' || state[key] == null);
  if (unknowns.length === 0) root.append(node('p', '없음'));
  else {
    const ul = node('ul');
    for (const [key, label] of unknowns) ul.append(node('li', `${label}: 확인 불가(${state[key] == null ? '값 없음' : 'unknown'})`, { 'data-state': 'unknown' }));
    root.append(ul);
  }

  // 5) 제안은 이유와 미실행 상태만 보여 준다. 실행 버튼은 만들지 않는다.
  root.append(node('h5', '조치 제안'));
  if (data.proposals.length === 0) {
    const noActions = !Array.isArray(event.supportedActions) || event.supportedActions.length === 0;
    root.append(node('p', noActions
      ? '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).'
      : 'AI가 이 기록에 제안한 조치가 없습니다. 필요하면 근거를 보고 담당자와 판단하세요.'));
  } else {
    const ul = node('ul');
    for (const p of data.proposals) {
      const li = node('li', `${p.action} — ${p.reason} (근거 ${p.evidenceIds.join(', ')})`);
      li.append(node('p', '사람 확인이 필요하며 실행되지 않았습니다.', { 'data-executed': 'false' }));
      ul.append(li);
    }
    root.append(ul);
  }

  root.append(node('p', `설명 시각: ${formatCheckedAt(checkedAt)}`, { class: 'muted' }));
  root.append(node('p', '설명·제안만으로 보안 조치가 실행되지는 않습니다.', { class: 'muted' }));
  return root;
}

export function createStudentView() {
  return {
    renderIdentity,
    renderDecision,
    renderEvents: createEventsRenderer(),
    renderStatus,
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection,
    renderExplanation,
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
