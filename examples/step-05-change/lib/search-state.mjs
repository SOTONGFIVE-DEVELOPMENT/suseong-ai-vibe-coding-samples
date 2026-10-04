// 검색 조건과 주소를 같은 값으로 보관해 새로고침·뒤로 가기로 복원합니다.
export function normalizeCriteria({ query = '', region = '', type = '' } = {}) {
  return { query: String(query).trim().slice(0, 200), region: String(region).trim().slice(0, 200), type: String(type).trim().slice(0, 200) };
}
export function criteriaFromSearch(search) {
  const params = new URLSearchParams(search);
  return normalizeCriteria({ query: params.get('q') ?? '', region: params.get('region') ?? '', type: params.get('type') ?? '' });
}
export function searchUrl(currentHref, criteria) {
  const url = new URL(currentHref);
  const values = normalizeCriteria(criteria);
  for (const [key, value] of [['q', values.query], ['region', values.region], ['type', values.type]]) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
export function telephoneHref(value) {
  const phone = typeof value === 'string' ? value.trim() : '';
  if (!/^\+?[\d\s()-]+$/.test(phone) || !/\d/.test(phone)) return null;
  return `tel:${phone.replace(/[\s()-]/g, '')}`;
}
