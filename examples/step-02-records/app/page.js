import LibraryBrowser from './library-browser.js';
export const dynamic = 'force-dynamic';
export default function Home() {
  return <LibraryBrowser apiMode={process.env.DATA_MODE === 'live' ? 'live' : 'sample'} />;
}
