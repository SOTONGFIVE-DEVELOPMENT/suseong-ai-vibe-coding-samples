'use client';
import { useEffect, useRef, useState } from 'react';
import stage from '../stage.json';
import { displayValue } from '../lib/filter.mjs';
import { describeData } from '../lib/provenance.mjs';
import { criteriaFromSearch, normalizeCriteria, searchUrl, telephoneHref } from '../lib/search-state.mjs';
import DataSource from './data-source';

export default function LibraryBrowser({ apiMode }) {
  const searchable = stage.number >= 3;
  const importable = stage.number >= 4;
  const advanced = stage.number >= 5;
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [type, setType] = useState('');
  const [facets, setFacets] = useState({ regions: [], types: [] });
  const [exercise, setExercise] = useState('timeout');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const latestRequest = useRef(0);
  const appliedCriteria = useRef({ query: '', region: '', type: '' });
  const description = data ? describeData(data.meta) : null;

  function updateFacets(items) {
    setFacets({ regions: [...new Set(items.map(item => item.region))].sort(), types: [...new Set(items.map(item => item.type))].sort() });
  }
  async function load(criteria = {}) {
    const requestId = ++latestRequest.current;
    setBusy(true); setError('');
    try {
      const params = new URLSearchParams({ q: criteria.query ?? '', region: criteria.region ?? '', type: criteria.type ?? '' });
      const response = await fetch(`/api/libraries?${params}`, { cache: 'no-store' });
      const result = await response.json();
      if (requestId !== latestRequest.current) return;
      if (!response.ok) throw new Error(result.error);
      setData(result);
      setFacets(result.facets);
    } catch (failure) { if (requestId === latestRequest.current) { setData(null); setError(failure.message || '자료를 불러오지 못했습니다.'); } }
    finally { if (requestId === latestRequest.current) setBusy(false); }
  }
  useEffect(() => {
    function restore() {
      const criteria = advanced ? criteriaFromSearch(window.location.search) : { query: '', region: '', type: '' };
      appliedCriteria.current = criteria;
      setQuery(criteria.query); setRegion(criteria.region); setType(criteria.type); setMessage('');
      load(criteria);
    }
    restore();
    window.addEventListener('popstate', restore);
    return () => { latestRequest.current += 1; window.removeEventListener('popstate', restore); };
  }, []);

  function apply(criteria) {
    const values = normalizeCriteria(criteria);
    appliedCriteria.current = values;
    setQuery(values.query); setRegion(values.region); setType(values.type); setMessage('');
    if (advanced) {
      const url = searchUrl(window.location.href, values);
      if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.pushState(null, '', url);
    }
    load(values);
  }
  function search(event) {
    event.preventDefault(); apply({ query, region, type });
  }
  function reset() {
    apply({ query: '', region: '', type: '' });
  }
  async function importData(selectedExercise = 'success') {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exercise: selectedExercise }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      updateFacets(result.items);
      setMessage(`${result.items.length}건을 data/records.json에 저장했습니다. 서버를 재시작해도 남습니다.`);
      await load(appliedCriteria.current);
    } catch (failure) { setError(failure.message || 'API 복사에 실패했습니다. 기존 자료를 유지합니다.'); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
    <header className="mb-7">
      <div className="flex flex-wrap items-center gap-3"><span className="badge badge-outline">STEP {String(stage.number).padStart(2, '0')} · {stage.title}</span><span className="text-sm text-base-content/70">AI 바이브 코딩 실습</span></div>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{description?.title ?? '공공도서관 정보 조회'}</h1>
      <p className="mt-3 max-w-3xl text-base-content/80">{description?.intro ?? '자료를 확인하고 있습니다.'}</p>
    </header>
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <DataSource meta={data?.meta} />
      <section className="card card-border bg-base-100"><div className="card-body gap-2"><h2 className="card-title text-base">이번 단계에서 확인할 것</h2><ul className="list-disc pl-5 text-sm">{(description?.kind === 'synthetic' ? ['직접 정한 가상 목록의 건수와 실제 건수 비교', '선택한 조건의 입력·기대·결과 비교', '빈 주소·기준일의 정보 없음 표시', '가상 자료 표시와 기관 수집 근거 없음 확인'] : stage.success).map(item => <li key={item} className="my-1">{item}</li>)}</ul></div></section>
    </div>
    {importable && description && description.kind !== 'synthetic' && <section className="card card-border mb-6 bg-base-100"><div className="card-body"><h2 className="card-title text-lg">{apiMode === 'live' ? '공식 API 연결 (선택 활동)' : '실제 저장 응답을 재생하기'}</h2><p className="text-sm">{apiMode === 'live' ? '서버의 인증키로 대구광역시 응답 전체 페이지를 검증한 뒤 저장합니다. 실제 전체 건수는 교육용 선정 3건과 다릅니다.' : '키 없이 보관한 실제 응답 3건을 읽고 검증합니다. 현재 실행은 공공데이터포털에 접속하지 않습니다.'}</p><div className="card-actions mt-2 items-end"><button className="btn btn-primary" disabled={busy} onClick={() => importData()}>{apiMode === 'live' ? '공식 API 가져오기' : '저장 응답 재생'}</button>{apiMode === 'sample' && <><label className="grid gap-1 text-sm" htmlFor="exercise">오류 연습<select id="exercise" className="select" value={exercise} onChange={event => setExercise(event.target.value)} disabled={busy}><option value="timeout">시간 초과</option><option value="malformed">응답 형식 오류</option><option value="auth">인증 오류</option></select></label><button className="btn" disabled={busy} onClick={() => importData(exercise)}>선택 오류 재현</button></>}</div><p className="text-sm text-base-content/70">오류 연습도 가상입니다. 실패하면 기존 파일과 표가 유지되는지 비교하세요.</p></div></section>}
    {searchable && <form onSubmit={search} className="card card-border mb-6 bg-base-100"><div className="card-body"><div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"><label htmlFor="query" className="grid gap-2 text-sm">{description?.nameLabel ?? '자료명'} 검색<input id="query" name="query" type="search" className="input w-full" placeholder={description?.kind === 'synthetic' ? '예: 시설 B' : '예: 사월'} maxLength={200} value={query} onChange={event => setQuery(event.target.value)} disabled={busy} /></label>{advanced && <><label htmlFor="region" className="grid gap-2 text-sm">지역<select id="region" className="select w-full" value={region} onChange={event => setRegion(event.target.value)} disabled={busy}><option value="">전체 지역</option>{facets.regions.map(value => <option key={value}>{value}</option>)}</select></label><label htmlFor="type" className="grid gap-2 text-sm">유형<select id="type" className="select w-full" value={type} onChange={event => setType(event.target.value)} disabled={busy}><option value="">전체 유형</option>{facets.types.map(value => <option key={value}>{value}</option>)}</select></label></>}<div className="flex flex-wrap gap-2"><button className="btn" type="submit" disabled={busy}>{advanced ? '조건 검색' : '검색'}</button><button className="btn" type="button" disabled={busy} onClick={reset}>초기화</button></div></div>{advanced && <p className="text-sm text-base-content/70">입력한 이름·지역·유형을 모두 만족하는 결과를 표시합니다. 적용한 조건은 주소에 남아 새로고침·뒤로 가기·앞으로 가기로 복원됩니다.</p>}</div></form>}
    {error && <div role="alert" className="alert alert-error mb-5"><span>{error}</span></div>}
    {message && <div role="status" className="alert mb-5"><span>{message}</span></div>}
    <section className="card card-border bg-base-100"><div className="card-body"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="card-title">{description?.tableLabel ?? '목록'}</h2><p aria-live="polite" className="text-sm font-semibold">{busy ? '확인 중…' : data ? `${data.count}건 / 전체 ${data.meta.totalCount}건` : '조회 결과 미확인'}</p></div><div className="overflow-x-auto"><table className="table min-w-[640px]"><caption className="sr-only">{description?.tableLabel ?? '목록'} 검색 결과</caption><thead><tr><th scope="col">{description?.nameLabel ?? '자료명'}</th><th scope="col">지역</th><th scope="col">유형</th><th scope="col">주소</th><th scope="col">전화번호</th><th scope="col">데이터 기준일</th></tr></thead><tbody>{data?.items.map(item => <tr key={item.id}><th scope="row">{item.name}</th><td>{item.region}</td><td>{item.type}</td><td>{displayValue(item.address)}</td><td>{telephoneHref(item.phone) ? <a className="link" href={telephoneHref(item.phone)}>{item.phone}</a> : displayValue(item.phone)}</td><td>{displayValue(item.referenceDate)}</td></tr>)}{data?.items.length === 0 && <tr><td colSpan={6} className="py-10 text-center">조건에 맞는 자료가 없습니다. 다른 이름이나 조건을 입력하거나 초기화하세요.</td></tr>}</tbody></table></div><p className="text-sm text-base-content/70">{description?.valueNote}</p></div></section>
    <footer className="mt-6 text-sm text-base-content/70">README.md의 성공 기준을 직접 확인하고 CHECKLIST.md에 독립 수행·도움 받음·미완료를 기록하세요.</footer>
  </main>;
}
