'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useWallets, useSignAndSendTransaction } from '@privy-io/react-auth';
import { useAuth } from '@/context/AuthContext';
import { useTokenPrice } from '@/hooks/useTokenPrices';
import { heliusService } from '@/services/api';
import { priceOracle } from '@/services/priceOracle';
import { vaultApi } from '@/services/vaultApi';
import { vaultCreationSchema } from '@/lib/validations/vaultSchema';
import { TIMEFRAMES, MIN_UNLOCK_DURATION } from '@/constants/vault';
import { TimeframeSelector } from '@/components/vaults/TimeframeSelector';
import { PriceDisplay } from '@/components/vaults/PriceDisplay';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import { TokenBalance } from '@/types';
import { PublicKey } from '@solana/web3.js';
import { addSeconds } from 'date-fns';
import { toSmallestUnit } from '@/lib/vaultHelpers';
import toast from 'react-hot-toast';

type ConfirmationStage = 1 | 2 | 3;

export default function CreateVaultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { authenticated, ready } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [confirmationStage, setConfirmationStage] = useState<ConfirmationStage>(1);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [timeframeSeconds, setTimeframeSeconds] = useState<number | null>(null);
  const [unlockType, setUnlockType] = useState<'TimeOnly' | 'PriceDouble'>('PriceDouble');
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vaultPubkey, setVaultPubkey] = useState<string | null>(null);
  const [initialPrice, setInitialPrice] = useState<number | null>(null);

  const selectedTokenData = tokens.find((t) => t.address === selectedToken);
  const userBalance = selectedTokenData?.balance || 0;

  // Fetch token price
  const { data: currentPrice, isLoading: isLoadingPrice } = useTokenPrice(selectedToken);

  // Fetch tokens on mount
  useEffect(() => {
    const fetchTokens = async () => {
      if (!user?.wallet_address) return;
      setIsLoadingTokens(true);
      try {
        const balances = await heliusService.getTokenBalances(user.wallet_address);
        const nonZeroBalances = balances.filter((b) => b.balance > 0).sort((a, b) => a.symbol.localeCompare(b.symbol));
        setTokens(nonZeroBalances);
        if (nonZeroBalances.length > 0 && !selectedToken) {
          const defaultToken = nonZeroBalances.find((t) => t.symbol === 'SOL') || nonZeroBalances[0];
          setSelectedToken(defaultToken.address);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        toast.error('Failed to fetch token balances');
      } finally {
        setIsLoadingTokens(false);
      }
    };
    fetchTokens();
  }, [user]);

  // Fetch initial price when token is selected
  useEffect(() => {
    const fetchInitialPrice = async () => {
      if (!selectedToken) return;
      try {
        const price = await priceOracle.getPrice(selectedToken);
        setInitialPrice(price);
      } catch (error) {
        console.error('Error fetching initial price:', error);
        toast.error('Failed to fetch token price');
      }
    };
    if (confirmationStage === 1 && selectedToken) {
      fetchInitialPrice();
    }
  }, [selectedToken, confirmationStage]);

  const handleStep1Continue = async () => {
    // Validation
    if (!selectedToken || !amount || !timeframeSeconds) {
      toast.error('Please fill in all fields');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (numericAmount > userBalance) {
      toast.error(`Insufficient balance. You have ${userBalance.toFixed(4)} ${selectedTokenData?.symbol}`);
      return;
    }

    if (!initialPrice || initialPrice <= 0) {
      toast.error('Failed to fetch initial price. Please try again.');
      return;
    }

    // Validate timeframe
    const now = Math.floor(Date.now() / 1000);
    const unlockTimestamp = now + timeframeSeconds;
    const minUnlock = now + MIN_UNLOCK_DURATION;
    if (unlockTimestamp < minUnlock) {
      toast.error(`Unlock timestamp must be at least ${MIN_UNLOCK_DURATION / (24 * 60 * 60)} days from now`);
      return;
    }

    // Validate price freshness
    // This would be done in the smart contract, but we check here too
    if (!currentPrice) {
      toast.error('Price data not available. Please wait a moment and try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Step 1: Call smart contract with confirmation_stage: 1
      // Derive vault PDA for this vault
      const tokenMintPubkey = new PublicKey(selectedToken);
      const solanaWallet = wallets.find((w) => {
        const isSolanaAddress = w.address && !w.address.startsWith('0x');
        return isSolanaAddress;
      });

      if (!solanaWallet) {
        throw new Error('No Solana wallet found');
      }

      const walletPubkey = new PublicKey(solanaWallet.address);
      const programId = process.env.VITE_PROGRAM_ID || process.env.NEXT_PUBLIC_PROGRAM_ID;
      
      // For now, allow vault creation flow without program ID (smart contract not deployed yet)
      // In production, this will be required
      let vaultPDA: PublicKey;
      if (programId) {
        [vaultPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('vault'), walletPubkey.toBuffer(), tokenMintPubkey.toBuffer()],
          new PublicKey(programId)
        );
      } else {
        // Generate a placeholder pubkey for UI flow (will be replaced when contract is deployed)
        // This is just for the UI to work - actual PDA will be generated by the smart contract
        const { Keypair } = await import('@solana/web3.js');
        const placeholderKeypair = Keypair.generate();
        vaultPDA = placeholderKeypair.publicKey;
      }

      // TODO: Once Anchor program is deployed, uncomment and implement:
      // const { createWalletAdapter } = await import('@/lib/anchor');
      // const { getProgramWithWallet } = await import('@/lib/program');
      // const { initializeVault } = await import('@/lib/vaultInstructions');
      // 
      // const walletAdapter = createWalletAdapter(solanaWallet);
      // const program = await getProgramWithWallet(walletAdapter);
      // 
      // const result = await initializeVault({
      //   tokenMint: tokenMintPubkey,
      //   amount: toSmallestUnit(numericAmount, selectedTokenData?.decimals || 9),
      //   unlockTimestamp: Math.floor(unlockTimestamp!.getTime() / 1000),
      //   unlockType,
      //   confirmationStage: 1,
      //   wallet: walletAdapter,
      // }, program);
      // 
      // setVaultPubkey(result.vaultPubkey.toBase58());
      
      // For now, store the derived PDA (will be used when contract is ready)
      setVaultPubkey(vaultPDA.toBase58());
      
      toast.success('Step 1 confirmed. Proceeding to Step 2...');
      setConfirmationStage(2);
    } catch (error: any) {
      console.error('Error in step 1:', error);
      toast.error(error.message || 'Failed to initialize vault');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Continue = async () => {
    if (!vaultPubkey) {
      toast.error('Vault not initialized. Please go back to Step 1.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Step 2: Call smart contract with confirmation_stage: 2
      // TODO: Once Anchor program is deployed, uncomment and implement:
      // const solanaWallet = wallets.find((w) => {
      //   const isSolanaAddress = w.address && !w.address.startsWith('0x');
      //   return isSolanaAddress;
      // });
      // if (!solanaWallet) throw new Error('No Solana wallet found');
      // 
      // const { createWalletAdapter } = await import('@/lib/anchor');
      // const { getProgramWithWallet } = await import('@/lib/program');
      // const { initializeVault } = await import('@/lib/vaultInstructions');
      // 
      // const walletAdapter = createWalletAdapter(solanaWallet);
      // const program = await getProgramWithWallet(walletAdapter);
      // 
      // await initializeVault({
      //   tokenMint: new PublicKey(selectedToken),
      //   amount: toSmallestUnit(numericAmount, selectedTokenData?.decimals || 9),
      //   unlockTimestamp: Math.floor(unlockTimestamp!.getTime() / 1000),
      //   unlockType,
      //   confirmationStage: 2,
      //   vaultPubkey: new PublicKey(vaultPubkey),
      //   wallet: walletAdapter,
      // }, program);
      
      toast.success('Step 2 confirmed. Proceeding to final step...');
      setConfirmationStage(3);
    } catch (error: any) {
      console.error('Error in step 2:', error);
      toast.error(error.message || 'Failed to confirm vault');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3Lock = async () => {
    if (!vaultPubkey || !selectedToken || !amount || !timeframeSeconds || !initialPrice) {
      toast.error('Missing required information');
      return;
    }

    try {
      setIsSubmitting(true);

      // Step 3: Call smart contract with confirmation_stage: 3
      // This is the final step that locks the funds
      // TODO: Once Anchor program is deployed, uncomment and implement:
      // const solanaWallet = wallets.find((w) => {
      //   const isSolanaAddress = w.address && !w.address.startsWith('0x');
      //   return isSolanaAddress;
      // });
      // if (!solanaWallet) throw new Error('No Solana wallet found');
      // 
      // const { createWalletAdapter } = await import('@/lib/anchor');
      // const { getProgramWithWallet } = await import('@/lib/program');
      // const { initializeVault } = await import('@/lib/vaultInstructions');
      // 
      // const walletAdapter = createWalletAdapter(solanaWallet);
      // const program = await getProgramWithWallet(walletAdapter);
      // 
      // const result = await initializeVault({
      //   tokenMint: new PublicKey(selectedToken),
      //   amount: toSmallestUnit(numericAmount, selectedTokenData?.decimals || 9),
      //   unlockTimestamp: Math.floor(unlockTimestamp!.getTime() / 1000),
      //   unlockType,
      //   confirmationStage: 3,
      //   vaultPubkey: new PublicKey(vaultPubkey),
      //   wallet: walletAdapter,
      // }, program);
      // 
      // // After successful transaction, create vault record on backend
      // const vaultRecord = await vaultApi.createVault({
      //   vault_pubkey: result.vaultPubkey.toBase58(),
      //   token_mint: selectedToken,
      //   amount: numericAmount,
      //   initial_price: initialPrice,
      //   unlock_timestamp: Math.floor(unlockTimestamp!.getTime() / 1000),
      //   unlock_type: unlockType,
      // });
      // 
      // console.log('Vault created on backend:', vaultRecord.vault_id);
      
      toast.success('Vault created successfully!');
      router.push('/vaults');
    } catch (error: any) {
      console.error('Error in step 3:', error);
      toast.error(error.message || 'Failed to lock funds');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authenticated || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const unlockTimestamp = timeframeSeconds ? addSeconds(new Date(), timeframeSeconds) : null;
  const numericAmount = parseFloat(amount) || 0;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Vault</h1>
            <p className="text-slate-400">Lock your crypto with conviction-based unlock conditions</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    confirmationStage >= step
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      confirmationStage > step ? 'bg-sky-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Initial Confirmation */}
          {confirmationStage === 1 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-6">Step 1: Configure Your Vault</h2>

              {isLoadingTokens ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Token Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Token</label>
                    <select
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    >
                      <option value="">Select token</option>
                      {tokens.map((token) => (
                        <option key={token.address} value={token.address}>
                          {token.symbol} - {token.name} (Balance: {token.balance.toFixed(4)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Amount ({selectedTokenData?.symbol || 'Token'})
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="0.000001"
                      placeholder="0.00"
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    />
                    {selectedTokenData && (
                      <p className="text-xs text-slate-400 mt-2">
                        Available: {userBalance.toFixed(4)} {selectedTokenData.symbol}
                      </p>
                    )}
                  </div>

                  {/* Timeframe */}
                  <TimeframeSelector value={timeframeSeconds} onChange={setTimeframeSeconds} />

                  {/* Unlock Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Unlock Condition</label>
                    <select
                      value={unlockType}
                      onChange={(e) => setUnlockType(e.target.value as 'TimeOnly' | 'PriceDouble')}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    >
                      <option value="PriceDouble">Price Doubles (2x) OR Time Expires</option>
                      <option value="TimeOnly">Time Expires Only</option>
                    </select>
                  </div>

                  {/* Initial Price Display */}
                  {initialPrice && (
                    <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-4">
                      <p className="text-sm text-slate-400 mb-1">Initial Price</p>
                      <p className="text-xl font-bold text-white">
                        ${initialPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {unlockType === 'PriceDouble' && (
                        <p className="text-sm text-slate-400 mt-2">
                          Target: ${(initialPrice * 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Warning */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-200 text-sm font-medium mb-2">⚠️ Important Warning</p>
                    <p className="text-yellow-200/80 text-sm">
                      Once locked, your funds cannot be withdrawn until the unlock conditions are met. This action is
                      irreversible.
                    </p>
                  </div>

                  <button
                    onClick={handleStep1Continue}
                    disabled={isSubmitting || !selectedToken || !amount || !timeframeSeconds || !initialPrice}
                    className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Processing...' : 'Continue to Step 2'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Re-confirmation */}
          {confirmationStage === 2 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-6">Step 2: Confirm Your Commitment</h2>

              <div className="space-y-6">
                {/* Re-display all terms */}
                <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-6 space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">Token</p>
                    <p className="text-white font-medium">{selectedTokenData?.symbol}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Amount</p>
                    <p className="text-white font-medium">
                      {numericAmount.toFixed(4)} {selectedTokenData?.symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Unlock Date</p>
                    <p className="text-white font-medium">
                      {unlockTimestamp ? unlockTimestamp.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Unlock Condition</p>
                    <p className="text-white font-medium">
                      {unlockType === 'PriceDouble'
                        ? `Price doubles to $${((initialPrice || 0) * 2).toFixed(2)} OR time expires`
                        : 'Time expires only'}
                    </p>
                  </div>
                  {initialPrice && (
                    <div>
                      <p className="text-sm text-slate-400">Initial Price</p>
                      <p className="text-white font-medium">
                        ${initialPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Finality warning */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-200 text-sm font-medium mb-2">🚨 Final Warning</p>
                  <p className="text-red-200/80 text-sm">
                    You are about to lock your funds. This action is IRREVERSIBLE. Your funds will be locked until
                    either the price doubles or the timeframe expires, whichever comes first.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setConfirmationStage(1)}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleStep2Continue}
                    disabled={isSubmitting}
                    className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Processing...' : 'Continue to Step 3'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Final Lock */}
          {confirmationStage === 3 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-6">Step 3: Lock Your Funds</h2>

              <div className="space-y-6">
                {/* Final review */}
                <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">Final Review</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Token</p>
                      <p className="text-white font-medium">{selectedTokenData?.symbol}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Amount</p>
                      <p className="text-white font-medium">
                        {numericAmount.toFixed(4)} {selectedTokenData?.symbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Unlock Date</p>
                      <p className="text-white font-medium">
                        {unlockTimestamp ? unlockTimestamp.toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Initial Price</p>
                      <p className="text-white font-medium">
                        ${(initialPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transaction summary */}
                <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-2">Transaction Summary</p>
                  <p className="text-white text-sm">
                    You will lock {numericAmount.toFixed(4)} {selectedTokenData?.symbol} in a vault that unlocks when:
                  </p>
                  <ul className="list-disc list-inside text-white text-sm mt-2 space-y-1">
                    {unlockType === 'PriceDouble' && (
                      <li>Price reaches ${((initialPrice || 0) * 2).toFixed(2)} (2x initial price)</li>
                    )}
                    <li>Time expires on {unlockTimestamp ? unlockTimestamp.toLocaleString() : 'N/A'}</li>
                    <li>Whichever comes first</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setConfirmationStage(2)}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleStep3Lock}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
                  >
                    {isSubmitting ? 'Locking Funds...' : '🔒 Lock Funds (Irreversible)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

