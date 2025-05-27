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
  title: 'LearningHub',
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
      <body className={`${sora.variable} antialiased bg-black`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
