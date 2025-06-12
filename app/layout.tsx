import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import './globals.css';
import Header from './_components/Header';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Learning Hub',
    template: 'Learning Hub - %s',
  },
  description: 'Your ultimate destination for learning.',
  icons: [{ url: '/logo-main.png', type: 'image/png' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} antialiased bg-black flex flex-col h-[100dvh]`}>
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
