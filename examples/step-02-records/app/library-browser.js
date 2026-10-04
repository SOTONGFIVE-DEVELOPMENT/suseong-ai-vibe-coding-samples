'use client';
import { useEffect, useRef, useState } from 'react';
import stage from '../stage.json';
import { displayValue } from '../lib/filter.mjs';
import { describeData } from '../lib/provenance.mjs';
import DataSource from './data-source';

export default function LibraryBrowser() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);
  const description = data ? describeData(data.meta) : null;
  useEffect(() => {
    async function load() {
      const requestId = ++latestRequest.current;
      try {
        const response = await fetch('/api/libraries', { cache: 'no-store' });
        const result = await response.json();
        if (requestId !== latestRequest.current) return;
        if (!response.ok) throw new Error(result.error);
        setData(result);
      } catch (failure) { if (requestId === latestRequest.current) setError(failure.message || '자료를 불러오지 못했습니다.'); }
    }
    load();
    return () => { latestRequest.current += 1; };
  }, []);
  return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
    <header className="mb-7"><span className="badge badge-outline">STEP 02 · {stage.title}</span><h1 className="mt-4 text-3xl font-bold sm:text-4xl">{description?.title ?? '공공도서관 정보 조회'}</h1><p className="mt-3">파일 → 서버 API → 화면의 흐름을 확인합니다. {description?.intro ?? '자료를 확인하고 있습니다.'}</p></header>
    <div className="mb-6"><DataSource meta={data?.meta} /></div>
    {error && <div role="alert" className="alert alert-error mb-5"><span>{error}</span></div>}
    <section className="card card-border bg-base-100"><div className="card-body"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="card-title">{description?.tableLabel ?? '목록'}</h2><p aria-live="polite" className="text-sm font-semibold">{data ? `${data.count}건 / 전체 ${data.meta.totalCount}건` : '확인 중…'}</p></div><div className="overflow-x-auto"><table className="table min-w-[640px]"><caption className="sr-only">{description?.tableLabel ?? '목록'}</caption><thead><tr><th scope="col">{description?.nameLabel ?? '자료명'}</th><th scope="col">지역</th><th scope="col">유형</th><th scope="col">주소</th><th scope="col">데이터 기준일</th></tr></thead><tbody>{data?.items.map(item => <tr key={item.id}><th scope="row">{item.name}</th><td>{item.region}</td><td>{item.type}</td><td>{displayValue(item.address)}</td><td>{displayValue(item.referenceDate)}</td></tr>)}</tbody></table></div><p className="text-sm text-base-content/70">{description?.valueNote}</p></div></section>
    <section className="card card-border mt-6 bg-base-100"><div className="card-body"><h2 className="card-title text-base">이번 단계에서 확인할 것</h2><ul className="list-disc pl-5 text-sm">{(description?.kind === 'synthetic' ? ['가상 자료 3건', '선택한 조건의 입력·기대·결과 비교', '빈 주소·기준일의 정보 없음 표시', '가상 자료 표시와 기관 수집 근거 없음 확인'] : stage.success).map(item => <li key={item}>{item}</li>)}</ul></div></section>
    <footer className="mt-6 text-sm text-base-content/70">별도 실습 복사본에서 자료명을 바꾸고 새로고침해 반영을 확인하세요. CHECKLIST.md에 수행 상태를 기록하세요.</footer>
  </main>;
}
