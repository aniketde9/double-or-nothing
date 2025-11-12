'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && authenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authenticated, router]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
          Double or Nothing
        </h1>
        <p className="text-slate-300 text-center mb-8">
          Lock your crypto with conviction-based vaults
        </p>

        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg text-lg"
        >
          Sign in
        </button>

        <p className="text-xs text-slate-400 text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

