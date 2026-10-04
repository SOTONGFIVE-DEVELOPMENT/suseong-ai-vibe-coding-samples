// 문자열을 안전하게 정리한 뒤 이름·지역·유형 조건을 모두 만족하는 항목을 고릅니다.
export function filterRecords(items, { query = '', region = '', type = '' } = {}) {
  const needle = query.trim().normalize('NFC').toLocaleLowerCase('ko-KR');
  return items.filter(item =>
    item.name.normalize('NFC').toLocaleLowerCase('ko-KR').includes(needle) &&
    (!region || item.region === region) && (!type || item.type === type));
}
export function displayValue(value) { return typeof value === 'string' && value.trim() ? value : '정보 없음'; }

export function browseRecords(data, criteria = {}) {
  const items = filterRecords(data.items, criteria);
  // 검색 결과가 비어도 조건 선택 목록은 전체 저장 자료에서 만듭니다.
  const facets = { regions: [...new Set(data.items.map(item => item.region))].sort(), types: [...new Set(data.items.map(item => item.type))].sort() };
  return { ...data, items, count: items.length, facets };
}
