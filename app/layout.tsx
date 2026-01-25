import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Your Tailwind CSS
import { AuthProvider } from '@/lib/AuthContext'; // 👈 Connects Firebase Auth
import { Toaster } from 'react-hot-toast'; // 👈 Global Notifications

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EdifyStudent | Teacher',
  description: 'Master Algebra, Geometry, and more with gamified lessons.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-slate-900`}>
        {/* Wrap everything in AuthProvider so we can access 'user' anywhere */}
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}