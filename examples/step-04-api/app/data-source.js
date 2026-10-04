import { describeData } from '../lib/provenance.mjs';

export default function DataSource({ meta }) {
  const description = meta ? describeData(meta) : null;
  return <section className="card card-border bg-base-100"><div className="card-body gap-2">
    <h2 className="card-title text-base">자료 출처</h2>
    <p>{description?.source ?? '자료를 확인하고 있습니다.'}</p>
    {description?.details.map(([label, value]) => <p key={label} className="text-sm text-base-content/70">{label}: {value}</p>)}
    {description && <span className="badge badge-outline">{description.badge}</span>}
  </div></section>;
}
