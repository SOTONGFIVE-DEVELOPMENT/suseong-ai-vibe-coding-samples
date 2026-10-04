export const SYNTHETIC_SOURCE = '직접 만든 가상 연습 자료 (기관 원본 아님)';
export function dataKind(meta) {
  return meta.dataKind ?? (meta.dataMode === 'live' ? 'live' : 'recorded');
}
const at = value => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' (한국 시간)' : null;
export function describeData(meta) {
  const kind = dataKind(meta);
  if (kind === 'synthetic') return {
    kind, title: '가상 업무 목록 조회', nameLabel: '자료명', tableLabel: '가상 업무 목록',
    intro: '별도 복사본에서 만든 가상 자료입니다. 실제 기관 정보와 연결되지 않습니다. 이름과 조건을 바꾼 뒤 기대값과 결과를 비교하세요.',
    valueNote: '빈 주소·기준일은 ‘정보 없음’으로 표시합니다. 기준일도 가상 연습 값이며 기관 기준일을 뜻하지 않습니다.',
    badge: '가상 연습 자료 · 외부 호출 없음', source: SYNTHETIC_SOURCE,
    details: [['범위', meta.scope], ['현재 저장', `${meta.totalCount}건`], ['직접 기관 API 호출', '하지 않음 · 기관 응답이 아닙니다.']],
  };
  const details = [['범위', meta.scope]];
  if (kind === 'live') details.push(['수집·저장 시각', at(meta.syncedAt) ?? '별도 기록 없음']);
  else {
    details.push(['이 PC 재생·저장 시각', at(meta.syncedAt) ?? '이 PC에서 재생·저장하기 전']);
    if (meta.recordedAt) details.push(['원본 수집 시각', at(meta.recordedAt)]);
  }
  if (meta.upstreamTotalCount != null) details.push(['API 원본 전체', `${meta.upstreamTotalCount}건`]);
  details.push(['현재 저장', `${meta.totalCount}건`]);
  return {
    kind, title: '공공도서관 정보 조회', nameLabel: '도서관명', tableLabel: '도서관 목록',
    intro: '이름과 조건을 입력하고 결과를 확인하세요. 기본 자료는 실제 공개 응답에서 선정한 3곳의 저장 예제입니다. sample 실행은 외부 접속 없이 진행합니다.',
    valueNote: '빈 주소·기준일은 ‘정보 없음’으로 표시합니다. 기관 원본값을 보존하며 빈 값 시험은 가상 자료 복사본에서 합니다.',
    badge: kind === 'live' ? '실제 API 응답 · live 모드' : '실제 저장 예제 · sample 모드',
    source: meta.source, details,
  };
}
