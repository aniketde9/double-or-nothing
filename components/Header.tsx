'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '@/context/AuthContext';
import { WalletIcon } from './icons';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { authenticated } = usePrivy();
  const pathname = usePathname();

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-slate-900/70 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-700/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors">
              <WalletIcon className="w-8 h-8" />
              <span className="text-xl font-bold">Double or Nothing</span>
            </Link>
            {authenticated && (
            <nav className="hidden md:flex items-center space-x-2 bg-slate-900/50 p-1 rounded-lg">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/')
                      ? 'bg-slate-800 text-sky-400'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <WalletIcon className="w-4 h-4" /> Dashboard
                </Link>
                <Link
                  href="/vaults"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/vaults')
                      ? 'bg-slate-800 text-sky-400'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Vaults
                </Link>
                <Link
                  href="/vaults/create"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/vaults/create')
                      ? 'bg-slate-800 text-sky-400'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Create Vault
                </Link>
            </nav>
            )}
          </div>
          <div className="flex items-center">
            {user && authenticated && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="text-sm font-medium text-slate-200">{user.email}</p>
                    <p className="text-xs text-slate-400">{truncateAddress(user.wallet_address)}</p>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
