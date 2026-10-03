import './globals.css';
export const metadata = { title: '수성구 도서관 찾기 · 교육용 실습', description: '가상 자료로 배우는 AI 바이브 코딩' };
export default function RootLayout({ children }) {
  return <html lang="ko" data-theme="light"><body className="bg-base-200 min-h-screen">{children}</body></html>;
}
