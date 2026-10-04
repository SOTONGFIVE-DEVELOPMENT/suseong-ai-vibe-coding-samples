const elements = Object.fromEntries([
  'search-form', 'search-name', 'search-region', 'search-type', 'search-button',
  'reset-button', 'empty-reset-button', 'refresh-button', 'results', 'data-notice',
  'data-mode', 'data-notice-text', 'result-count', 'query-summary', 'count-summary',
  'error-message', 'error-detail', 'loading-state', 'empty-state', 'unavailable-state',
  'table-wrapper', 'library-rows', 'result-announcement', 'source-value', 'scope-value',
  'sync-value', 'upstream-value', 'connection-value',
].map((id) => [id, document.getElementById(id)]));

const numberFormat = new Intl.NumberFormat('ko-KR');
const dateTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul',
});
let activeController = null;
let requestNumber = 0;
let lastSuccess = null;
let health = { status: 'checking', apiConfigured: false };

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function node(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function conditionsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    name: text(params.get('name')).slice(0, 100),
    region: text(params.get('region')).slice(0, 100),
    type: text(params.get('type')).slice(0, 100),
  };
}

function currentConditions() {
  return {
    name: elements['search-name'].value.trim(),
    region: elements['search-region'].value,
    type: elements['search-type'].value,
  };
}

function ensureOption(select, value) {
  if (value && !Array.from(select.options).some((option) => option.value === value)) {
    select.append(new Option(value, value));
  }
}

function restoreForm(conditions) {
  elements['search-name'].value = conditions.name;
  for (const key of ['region', 'type']) {
    const select = elements[`search-${key}`];
    ensureOption(select, conditions[key]);
    select.value = conditions[key];
  }
}

function saveConditions(conditions) {
  const url = new URL(window.location.href);
  for (const key of ['name', 'region', 'type']) {
    if (conditions[key]) url.searchParams.set(key, conditions[key]);
    else url.searchParams.delete(key);
  }
  if (url.href !== window.location.href) window.history.pushState({}, '', url);
}

function describeConditions(conditions) {
  const parts = [];
  if (conditions.name) parts.push(`이름 ‘${conditions.name}’`);
  if (conditions.region) parts.push(conditions.region);
  if (conditions.type) parts.push(conditions.type);
  return parts.length ? parts.join(' · ') : '전체 도서관';
}

function populateSelect(select, values) {
  const selected = select.value;
  const firstOption = select.options[0].cloneNode(true);
  select.replaceChildren(firstOption);
  const sorted = [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))].sort((a, b) => a.localeCompare(b, 'ko'));
  for (const value of sorted) select.append(new Option(value, value));
  ensureOption(select, selected);
  select.value = selected;
}

function bookIcon() {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('width', '21');
  icon.setAttribute('height', '21');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M4 5c3-1 5.5-.5 8 1.5V21c-2.5-2-5-2.5-8-1.5V5Zm16 0c-3-1-5.5-.5-8 1.5V21c2.5-2 5-2.5 8-1.5V5Z');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.3');
  path.setAttribute('stroke-linejoin', 'round');
  icon.append(path);
  return icon;
}

function referenceDate(value) {
  const date = text(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.replaceAll('-', '.') : date;
}

function cell(value, label) {
  const td = node('td');
  td.dataset.label = label;
  if (value) td.textContent = value;
  else td.append(node('span', 'missing-value', '정보 없음'));
  return td;
}

function renderRows(items) {
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const tr = node('tr');
    const nameCell = node('td');
    const nameLayout = node('div', 'library-name-cell');
    const icon = node('span', 'library-book-icon');
    icon.append(bookIcon());
    const nameText = node('div', 'library-name-text');
    nameText.append(node('p', 'library-name', text(item.name) || '이름 정보 없음'));
    nameText.append(node('p', 'library-type', text(item.type) || '유형 정보 없음'));
    nameLayout.append(icon, nameText);
    nameCell.append(nameLayout);
    const phoneCell = cell(text(item.phone), '연락처');
    const phone = text(item.phone);
    if (/^\+?[\d\s()\-]{6,25}$/.test(phone)) {
      const phoneLink = node('a', 'phone-link', phone);
      phoneLink.href = `tel:${phone.replace(/[\s()\-]/g, '')}`;
      phoneLink.setAttribute('aria-label', `${text(item.name) || '도서관'}에 전화 ${phone}`);
      phoneCell.replaceChildren(phoneLink);
    }
    tr.append(nameCell, cell(text(item.region), '지역'), cell(text(item.address), '주소'), phoneCell, cell(referenceDate(item.referenceDate), '자료 기준일'));
    fragment.append(tr);
  }
  elements['library-rows'].replaceChildren(fragment);
}

function updateConnectionDescription() {
  if (health.status === 'checking') elements['connection-value'].textContent = 'API 설정 상태 확인 중';
  else if (health.status === 'unknown') elements['connection-value'].textContent = 'API 설정 상태 미확인';
  else if (health.apiConfigured) elements['connection-value'].textContent = lastSuccess?.data.meta.dataMode === 'live' ? '공공데이터 API 키 설정됨' : 'API 키 설정됨 · 저장된 예제 자료 표시 중';
  else elements['connection-value'].textContent = lastSuccess?.data.meta.dataMode === 'sample' ? 'API 키 없이 저장된 실제 자료 조회 중' : '공공데이터 API 키 등록 대기';
}

function renderMetadata(meta) {
  const sample = meta.dataMode === 'sample';
  elements['data-mode'].textContent = sample ? '실제 데이터 예제' : '실제 자료';
  elements['data-notice'].classList.toggle('is-live', !sample);
  elements['data-notice-text'].textContent = sample
    ? `저장된 실제 자료 ${numberFormat.format(meta.totalCount)}건입니다. 공공데이터 API 응답에서 선정한 예제로, 조회 시 새로 수집하지 않습니다.`
    : '저장된 공공도서관 자료입니다. 방문 전에 해당 기관의 최신 운영 정보를 확인해 주세요.';
  elements['source-value'].textContent = text(meta.source) || '출처 미확인';
  elements['scope-value'].textContent = text(meta.scope) || '범위 미확인';
  const syncStat = elements['sync-value'].closest('.stat');
  syncStat.querySelector('.stat-title').textContent = sample ? '이 PC 재생·저장' : '최근 수집 성공';
  syncStat.querySelector('.stat-desc').textContent = sample && meta.recordedAt && Number.isFinite(Date.parse(meta.recordedAt))
    ? `원본 수집 ${dateTimeFormat.format(new Date(meta.recordedAt))} KST`
    : '각 도서관의 자료 기준일도 확인해 주세요.';
  if (meta.syncedAt && Number.isFinite(Date.parse(meta.syncedAt))) {
    elements['sync-value'].textContent = `${dateTimeFormat.format(new Date(meta.syncedAt))} KST`;
  } else elements['sync-value'].textContent = sample ? '이 PC에서 재생·저장하기 전' : '수집 일시 미확인';
  const total = numberFormat.format(meta.totalCount);
  elements['upstream-value'].textContent = typeof meta.upstreamTotalCount === 'number'
    ? `원본 ${numberFormat.format(meta.upstreamTotalCount)}개 중 ${total}개 저장`
    : `${total}개 저장 · 원본 전체 건수 미확인`;
  updateConnectionDescription();
}

function validateData(data) {
  if (!data || !Array.isArray(data.items) || !data.meta || !['sample', 'live'].includes(data.meta.dataMode)
    || !Number.isInteger(data.matchedCount) || data.matchedCount < 0
    || !Number.isInteger(data.meta.totalCount) || data.meta.totalCount < 0
    || data.matchedCount !== data.items.length || data.matchedCount > data.meta.totalCount
    || data.items.some((item) => !item || typeof item !== 'object')
    || !data.facets || !Array.isArray(data.facets.regions) || !Array.isArray(data.facets.types)) {
    throw new Error('INVALID_RESPONSE');
  }
  return data;
}

function showLastSuccess(prefix = '') {
  if (!lastSuccess) return;
  const { data, conditions } = lastSuccess;
  elements['query-summary'].textContent = `${prefix}${describeConditions(conditions)}`;
  elements['result-count'].textContent = numberFormat.format(data.matchedCount);
  elements['count-summary'].textContent = `저장된 ${numberFormat.format(data.meta.totalCount)}개 중 ${numberFormat.format(data.matchedCount)}개`;
  elements['table-wrapper'].hidden = data.items.length === 0;
  elements['empty-state'].hidden = data.items.length !== 0;
}

function setBusy(busy) {
  elements.results.setAttribute('aria-busy', String(busy));
  elements['search-button'].disabled = busy;
  elements['refresh-button'].disabled = busy;
  elements['loading-state'].hidden = !busy;
}

async function loadLibraries(conditions, updateUrl = true) {
  if (updateUrl) saveConditions(conditions);
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  const thisRequest = ++requestNumber;
  let timedOut = false;
  const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
  const params = new URLSearchParams();
  for (const key of ['name', 'region', 'type']) if (conditions[key]) params.set(key, conditions[key]);
  elements['error-message'].hidden = true;
  elements['empty-state'].hidden = true;
  elements['unavailable-state'].hidden = true;
  elements['table-wrapper'].hidden = true;
  elements['query-summary'].textContent = `조회 중 · ${describeConditions(conditions)}`;
  elements['result-announcement'].textContent = '도서관 자료를 조회하고 있습니다.';
  setBusy(true);
  try {
    const response = await fetch(`/api/libraries${params.size ? `?${params}` : ''}`, {
      signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store',
    });
    if (!response.ok) throw new Error('REQUEST_FAILED');
    const data = validateData(await response.json());
    if (thisRequest !== requestNumber) return;
    lastSuccess = { data, conditions: { ...conditions } };
    renderRows(data.items);
    populateSelect(elements['search-region'], data.facets.regions);
    populateSelect(elements['search-type'], data.facets.types);
    renderMetadata(data.meta);
    showLastSuccess();
    elements['result-announcement'].textContent = `${describeConditions(conditions)}, 저장된 ${data.meta.totalCount}개 중 ${data.matchedCount}개를 찾았습니다.`;
  } catch (error) {
    if (thisRequest !== requestNumber || (error.name === 'AbortError' && !timedOut)) return;
    elements['error-message'].hidden = false;
    const reason = timedOut ? '응답이 늦어 조회를 중단했습니다. 잠시 후 다시 조회해 주세요.' : '네트워크 연결을 확인한 뒤 다시 조회해 주세요.';
    elements['error-detail'].textContent = lastSuccess
      ? `${reason} 아래 목록은 마지막으로 성공한 조회 결과입니다.`
      : reason;
    if (lastSuccess) showLastSuccess('이전 성공 결과 · ');
    else {
      elements['query-summary'].textContent = `조회 실패 · ${describeConditions(conditions)}`;
      elements['count-summary'].textContent = '결과 건수를 확인할 수 없습니다.';
      elements['result-count'].textContent = '—';
      elements['unavailable-state'].hidden = false;
      elements['data-mode'].textContent = '자료 미확인';
      elements['data-notice-text'].textContent = '자료를 불러오지 못해 출처와 저장 범위를 확인할 수 없습니다.';
      elements['source-value'].textContent = '미확인';
      elements['scope-value'].textContent = '미확인';
      elements['sync-value'].textContent = '미확인';
    }
    elements['result-announcement'].textContent = `조회에 실패했습니다. ${lastSuccess ? '마지막 성공 결과를 표시합니다.' : '다시 조회해 주세요.'}`;
  } finally {
    window.clearTimeout(timeout);
    if (thisRequest === requestNumber) {
      setBusy(false);
      activeController = null;
    }
  }
}

async function checkHealth() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch('/api/health', { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error('REQUEST_FAILED');
    const data = await response.json();
    if (!data || typeof data.apiConfigured !== 'boolean' || data.ok !== true) throw new Error('INVALID_RESPONSE');
    health = { status: 'known', apiConfigured: data.apiConfigured };
  } catch {
    health = { status: 'unknown', apiConfigured: false };
  } finally {
    window.clearTimeout(timeout);
    updateConnectionDescription();
  }
}

function resetSearch() {
  const conditions = { name: '', region: '', type: '' };
  restoreForm(conditions);
  void loadLibraries(conditions);
}

elements['search-form'].addEventListener('submit', (event) => {
  event.preventDefault();
  const conditions = currentConditions();
  elements['search-name'].value = conditions.name;
  void loadLibraries(conditions);
});
elements['reset-button'].addEventListener('click', resetSearch);
elements['empty-reset-button'].addEventListener('click', resetSearch);
elements['refresh-button'].addEventListener('click', () => void loadLibraries(currentConditions()));
window.addEventListener('popstate', () => {
  const conditions = conditionsFromUrl();
  restoreForm(conditions);
  void loadLibraries(conditions, false);
});

const initialConditions = conditionsFromUrl();
restoreForm(initialConditions);
void checkHealth();
void loadLibraries(initialConditions, false);
