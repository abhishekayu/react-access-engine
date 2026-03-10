import React from 'react';
import type { Metadata } from 'next';
import { AccessWrapper } from '@/components/AccessWrapper';

export const metadata: Metadata = {
  title: 'Next.js + react-access-control',
  description: 'Example of using react-access-control with Next.js App Router',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui', margin: 0, padding: 24 }}>
        <AccessWrapper>{children}</AccessWrapper>
      </body>
    </html>
  );
}
