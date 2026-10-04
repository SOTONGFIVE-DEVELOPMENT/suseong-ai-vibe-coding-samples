import { filterRecords } from './filter.mjs';

export function parseFinalFilters(url) {
  const allowed = new Set(['name', 'region', 'type']);
  if (url.search.length > 2048) throw new Error('검색 조건이 너무 깁니다.');
  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key) || url.searchParams.getAll(key).length !== 1) throw new Error('검색 조건을 확인하세요.');
  }
  const filters = { name: '', region: '', type: '' };
  for (const key of allowed) {
    const value = (url.searchParams.get(key) ?? '').trim();
    if (value.length > 100 || /[\u0000-\u001f\u007f\ufffd]/u.test(value)) throw new Error('검색 조건을 확인하세요.');
    filters[key] = value;
  }
  return filters;
}

// 선택지의 범위와 총 건수는 검색 결과가 아닌 저장 파일 전체에서 구합니다.
export function finalLibraryResponse(data, filters) {
  const items = filterRecords(data.items, { query: filters.name, region: filters.region, type: filters.type });
  const values = key => [...new Set(data.items.map(item => item[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
  return { ...data, items, matchedCount: items.length, facets: { regions: values('region'), types: values('type') } };
}
