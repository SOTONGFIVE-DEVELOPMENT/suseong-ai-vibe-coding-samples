'use client';
import { useEffect, useRef, useState } from 'react';
import stage from '../stage.json';
import { displayValue } from '../lib/filter.mjs';

export default function LibraryBrowser({ apiMode }) {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [type, setType] = useState('');
  const [facets, setFacets] = useState({ regions: [], types: [] });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const latestRequest = useRef(0);

  function updateFacets(items) {
    setFacets({ regions: [...new Set(items.map(item => item.region))].sort(), types: [...new Set(items.map(item => item.type))].sort() });
  }
  async function load(criteria = {}, initial = false) {
    const requestId = ++latestRequest.current;
    setBusy(true); setError('');
    try {
      const params = new URLSearchParams({ q: criteria.query ?? '', region: criteria.region ?? '', type: criteria.type ?? '' });
      const response = await fetch(`/api/libraries?${params}`, { cache: 'no-store' });
      const result = await response.json();
      if (requestId !== latestRequest.current) return;
      if (!response.ok) throw new Error(result.error);
      setData(result);
      if (initial) updateFacets(result.items);
    } catch (failure) { if (requestId === latestRequest.current) setError(failure.message || '자료를 불러오지 못했습니다.'); }
    finally { if (requestId === latestRequest.current) setBusy(false); }
  }
  useEffect(() => {
    load({}, true);
    return () => { latestRequest.current += 1; };
  }, []);

  function search(event) {
    event.preventDefault(); setMessage('');
    load({ query, region, type });
  }
  function reset() {
    setQuery(''); setRegion(''); setType(''); setMessage(''); load();
  }
  return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
    <header className="mb-7">
      <div className="flex flex-wrap items-center gap-3"><span className="badge badge-outline">STEP {String(stage.number).padStart(2, '0')} · {stage.title}</span><span className="text-sm text-base-content/70">AI 바이브 코딩 실습</span></div>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">공공도서관 정보 조회</h1>
      <p className="mt-3 max-w-3xl text-base-content/80">이름과 조건을 입력하고 실제 결과를 확인하세요. 기본 자료의 도서관 A·B·C는 교육용 가상 자료입니다.</p>
    </header>
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <section className="card card-border bg-base-100"><div className="card-body gap-2"><h2 className="card-title text-base">자료 출처</h2><p>{data?.meta.source ?? '자료를 확인하고 있습니다.'}</p><p className="text-sm text-base-content/70">범위: {data?.meta.scope ?? '확인 중'}</p><p className="text-sm text-base-content/70">저장 시각: {data?.meta.syncedAt ? new Date(data.meta.syncedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' (한국 시간)' : 'API 복사 전 시작 자료'}</p><span className="badge badge-outline">{data?.meta.dataMode === 'live' ? '실제 API 응답' : '가상 자료 · sample 모드'}</span></div></section>
      <section className="card card-border bg-base-100"><div className="card-body gap-2"><h2 className="card-title text-base">이번 단계에서 확인할 것</h2><ul className="list-disc pl-5 text-sm">{stage.success.map(item => <li key={item} className="my-1">{item}</li>)}</ul></div></section>
    </div>
    <form onSubmit={search} className="card card-border mb-6 bg-base-100"><div className="card-body"><div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"><label htmlFor="query" className="grid gap-2 text-sm">도서관 이름<input id="query" name="query" type="search" className="input w-full" placeholder="예: 도서관 B" maxLength={200} value={query} onChange={event => setQuery(event.target.value)} disabled={busy} /></label><div className="flex flex-wrap gap-2"><button className="btn" type="submit" disabled={busy}>검색</button><button className="btn" type="button" disabled={busy} onClick={reset}>초기화</button></div></div></div></form>
    {error && <div role="alert" className="alert alert-error mb-5"><span>{error}</span></div>}
    {message && <div role="status" className="alert mb-5"><span>{message}</span></div>}
    <section className="card card-border bg-base-100"><div className="card-body"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="card-title">도서관 목록</h2><p aria-live="polite" className="text-sm font-semibold">{busy ? '확인 중…' : `${data?.count ?? 0}건 / 전체 ${data?.meta.totalCount ?? 0}건`}</p></div><div className="overflow-x-auto"><table className="table"><caption className="sr-only">검색 결과와 자료 파일에서 확인한 도서관 정보</caption><thead><tr><th scope="col">도서관명</th><th scope="col">지역</th><th scope="col">유형</th><th scope="col">주소</th><th scope="col">데이터 기준일</th></tr></thead><tbody>{data?.items.map(item => <tr key={item.id}><th scope="row">{item.name}</th><td>{item.region}</td><td>{item.type}</td><td>{displayValue(item.address)}</td><td>{displayValue(item.referenceDate)}</td></tr>)}{data?.items.length === 0 && <tr><td colSpan={5} className="py-10 text-center">조건에 맞는 도서관이 없습니다. 다른 이름이나 조건을 입력하거나 초기화하세요.</td></tr>}</tbody></table></div><p className="text-sm text-base-content/70">빈 주소·기준일은 ‘정보 없음’으로 표시합니다. 가상 자료에는 실제 데이터 기준일이 없습니다.</p></div></section>
    <footer className="mt-6 text-sm text-base-content/70">README.md의 성공 기준을 직접 확인하고 CHECKLIST.md에 독립 수행·도움 받음·미완료를 기록하세요.</footer>
  </main>;
}
