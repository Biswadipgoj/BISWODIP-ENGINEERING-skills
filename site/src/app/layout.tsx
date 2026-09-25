import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Biswodip Goj — Autonomous Engineering',
  description: 'AI-powered autonomous engineering platform. Discover, plan, implement, verify, and ship production-ready software with evidence-driven workflows.',
  keywords: 'engineering, AI, autonomous, security, code quality, design, animation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230a0a0f'/><text y='70' x='10' font-size='60' font-family='monospace' fill='%2300d4ff'>BG</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}