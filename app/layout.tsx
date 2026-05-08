import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tim Lin - Web Designer Portfolio',
  description: 'Tim Lin 的個人作品集。資深 UI/UX 設計師與前端開發者，專精於 Figma 介面設計、React/Vue 網頁開發，以及 Spline 3D 互動網頁體驗。',
  keywords: 'UI/UX Design, Web Development, Tim Lin, Portfolio, 網頁設計, 前端開發, 台灣設計師, React, Figma, Spline 3D',
  authors: [{ name: 'Tim Lin' }],
  openGraph: {
    type: 'website',
    url: 'https://timlin-design.vercel.app/',
    title: 'Tim Lin | UI/UX Designer & Web Developer',
    description: '結合嚴謹邏輯與前瞻技術的資深產品設計師。查看我的 UI/UX 設計與 3D 網頁開發作品。',
    images: ['https://timlin-design.vercel.app/img/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tim Lin | UI/UX Designer & Web Developer',
    description: '致力於打造兼具美學與功能的數位體驗。',
    images: ['https://timlin-design.vercel.app/img/og-image.jpg'],
  },
  alternates: { canonical: 'https://timlin-design.vercel.app/' },
  icons: { icon: '/img/favicon/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Momo+Trust+Display&family=Noto+Sans+TC:wght@100..900&family=Quicksand:wght@300..700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>
        {children}
        <Script src="https://unpkg.com/@phosphor-icons/web" strategy="lazyOnload" />
        <Script
          src="https://unpkg.com/@splinetool/viewer@1.10.96/build/spline-viewer.js"
          type="module"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
