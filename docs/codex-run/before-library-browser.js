'use client';
import { useEffect, useState } from 'react';
import stage from '../stage.json';
import { displayValue } from '../lib/filter.mjs';

export default function LibraryBrowser() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/libraries', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setData(result);
      } catch (failure) { setError(failure.message || '자료를 불러오지 못했습니다.'); }
    }
    load();
  }, []);
  return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
    <header className="mb-7"><span className="badge badge-outline">STEP 02 · {stage.title}</span><h1 className="mt-4 text-3xl font-bold sm:text-4xl">공공도서관 정보 조회</h1><p className="mt-3">파일 → 서버 API → 화면의 흐름을 확인합니다. 도서관 A·B·C는 교육용 가상 자료입니다.</p></header>
    <section className="card card-border mb-6 bg-base-100"><div className="card-body"><h2 className="card-title text-base">자료 출처</h2><p>{data?.meta.source ?? '자료를 확인하고 있습니다.'}</p><p className="text-sm">범위: {data?.meta.scope ?? '확인 중'}</p><span className="badge badge-outline">가상 자료 · sample 모드</span></div></section>
    {error && <div role="alert" className="alert alert-error mb-5"><span>{error}</span></div>}
    <section className="card card-border bg-base-100"><div className="card-body"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="card-title">도서관 목록</h2><p aria-live="polite" className="text-sm font-semibold">{data ? `${data.count}건 / 전체 ${data.meta.totalCount}건` : '확인 중…'}</p></div><div className="overflow-x-auto"><table className="table"><caption className="sr-only">가상 도서관 목록</caption><thead><tr><th scope="col">도서관명</th><th scope="col">지역</th><th scope="col">유형</th><th scope="col">주소</th><th scope="col">데이터 기준일</th></tr></thead><tbody>{data?.items.map(item => <tr key={item.id}><th scope="row">{item.name}</th><td>{item.region}</td><td>{item.type}</td><td>{displayValue(item.address)}</td><td>{displayValue(item.referenceDate)}</td></tr>)}</tbody></table></div><p className="text-sm text-base-content/70">빈 주소·기준일은 ‘정보 없음’으로 표시합니다.</p></div></section>
    <section className="card card-border mt-6 bg-base-100"><div className="card-body"><h2 className="card-title text-base">이번 단계에서 확인할 것</h2><ul className="list-disc pl-5 text-sm">{stage.success.map(item => <li key={item}>{item}</li>)}</ul></div></section>
    <footer className="mt-6 text-sm text-base-content/70">data/records.json에서 A의 이름을 바꾸고 새로고침해 반영을 확인하세요. CHECKLIST.md에 수행 상태를 기록하세요.</footer>
  </main>;
}
