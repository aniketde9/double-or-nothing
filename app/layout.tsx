import './polyfills';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PrivyProviderWrapper } from '@/components/PrivyProviderWrapper';
import { ReactQueryProvider } from '@/lib/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Double or Nothing',
  description: 'Lock your crypto with conviction-based vaults',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyProviderWrapper>
          <ReactQueryProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" />
            </AuthProvider>
          </ReactQueryProvider>
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}

