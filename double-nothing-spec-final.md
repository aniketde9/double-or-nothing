**Double** **or** **Nothing** **-** **Solana** **dApp**
**Specification**

**Executive** **Summary**

**Double** **or** **Nothing** is a conviction-based vault dApp on Solana
that allows users to lock cryptocurrency assets with dual unlock
conditions: either when the token value doubles or when a user-selected
timeframe expires (1 month to 5 years), whichever comes first. The
platform emphasizes irreversibility and commitment, with three mandatory
confirmation steps before funds are locked on-chain.

**1.** **Product** **Overview**

**Core** **Value** **Proposition**

> **Conviction** **Mechanism**: Users commit to holdings with time-based
> or price-based unlocks
>
> **Non-Custodial** **Security**: Funds locked in smart contracts, no
> human intervention possible
>
> **Multiple** **Vaults**: Users can create unlimited independent vaults
> with different tokens/timeframes
>
> **Irreversibility**: Emphasizes finality through blockchain
> immutability

**Target** **Users**

> Long-term cryptocurrency believers
>
> HODL enthusiasts seeking forced holding mechanisms
>
> Risk-aware investors wanting accountability systems

**2.** **Technical** **Architecture**

**2.1** **Tech** **Stack**

**Smart** **Contract** **Development**

> **Language**: Rust
>
> **Framework**: Anchor Framework (v0.29+)
>
> **Compilation** **Target**: BPF (Berkeley Packet Filter)
>
> **Smart** **Contract** **Library**: Solana Program Library (SPL)

**Frontend**

> **Framework**: Next.js 14+ with TypeScript
>
> **UI** **Library**: React 18+
>
> **Styling**: Tailwind CSS 3+
>
> **State** **Management**: TanStack Query (React Query) + Zustand
>
> **Wallet** **Integration**: Privy SDK (for embedded wallets)
>
> **Additional** **Libraries**:
>
> @solana/web3.js: Core Solana interactions
>
> @solana/spl-token: SPL token operations
>
> react-hot-toast: User notifications
>
> date-fns: Date/time utilities
>
> zod: Schema validation

**Backend/Indexing**

> **Runtime**: Node.js 20+
>
> **API** **Framework**: Express.js or tRPC (for type-safe API)
>
> **Database**: PostgreSQL 15+ (for off-chain indexing)
>
> **Caching**: Redis (for rate limiting and session management)
>
> **ORM**: Prisma or TypeORM

**Price** **Oracle** **Integration**

> **Primary**: Pyth Network (real-time price feeds)
>
> **Fallback**: Switchboard Oracle Aggregator
>
> **Update** **Frequency**: Per-transaction validation

**Deployment** **&** **Hosting**

> **Frontend** **Hosting**: Vercel
>
> **Backend** **Hosting**: Render
>
> **Smart** **Contract** **Network**: Solana Devnet (testing) →
> Mainnet-Beta (production)
>
> **RPC** **Endpoint**: Helius (paid subscription for reliable node
> access and price data)

**Development** **Tools**

> **Smart** **Contract** **IDE**: Solana Playground or VS Code
>
> **Testing** **Framework**: Anchor test suite + Solana-specific testing
> utilities
>
> **CLI** **Tools**: Solana CLI, Anchor CLI
>
> **Version** **Control**: GitHub
>
> **CI/CD**: GitHub Actions

**3.** **Smart** **Contract** **Architecture**

**3.1** **Program** **Structure** **(Anchor** **Framework)**

> double-or-nothing-program/ ├── programs/
>
> │ └── double_or_nothing/ │ ├── src/
>
> │ │ ├── lib.rs (program entry) │ │ ├── instructions/
>
> │ │ │ ├── mod.rs
>
> │ │ │ ├── initialize_vault.rs │ │ │ ├── deposit.rs
>
> │ │ │ ├── check_unlock_conditions.rs │ │ │ ├── withdraw.rs
>
> │ │ │ └── emergency_cancel.rs │ │ ├── state/
>
> │ │ │ ├── mod.rs
>
> │ │ │ ├── vault_state.rs │ │ │ └── vault_config.rs │ │ ├── errors.rs
>
> │ │ └── utils.rs │ └── Cargo.toml ├── tests/
>
> │ └── integration.rs └── Anchor.toml

**3.2** **Account** **Structure** **&** **Data** **Models**

**VaultState** **(PDA** **-** **Program** **Derived** **Address)**

> \#\[account\]
>
> pub struct VaultState { pub owner: Pubkey,
>
> pub deposited_mint: Pubkey, pub deposited_amount: u64, pub
> initial_price: u128,
>
> pub locked_at_timestamp: i64, pub unlock_timestamp: i64, pub
> unlock_type: UnlockType, pub is_unlocked: bool,
>
> pub vault_bump: u8,
>
> pub token_account_bump: u8, pub confirmations_count: u8,
>
> }
>
> \#\[derive(Clone, Copy, PartialEq)\]
>
> pub enum UnlockType { TimeOnly, PriceDouble,
>
> }

**3.3** **Smart** **Contract** **Instructions**

**1.** **Initialize** **Vault** **(with** **3-step** **confirmation)**

**Purpose**: Create and lock user funds with confirmation gates

**Parameters**:

> token_mint: Pubkey of SPL token or native SOL
>
> amount: u64 (in smallest unit)
>
> unlock_timestamp: i64 (Unix timestamp)
>
> confirmation_stage: u8 (1, 2, or 3)

**Validation**:

> Confirmation stage progression (1 → 2 → 3)
>
> Unlock timestamp \> current time (at least 30 days)
>
> Amount \> 0 and \< user's balance
>
> Price oracle data freshness (\< 60 seconds old)

**State** **Changes**:

> **Stage** **1**: Initialize VaultState, set confirmations_count = 1
>
> **Stage** **2**: Validate user intent again, increment
> confirmations_count = 2
>
> **Stage** **3**: Execute token transfer, set locked_at_timestamp,
> confirmations_count = 3

**2.** **Check** **Unlock** **Conditions**

**Purpose**: Verify if vault qualifies for unlock based on time or price

**Logic**:

> If current_timestamp \>= vault.unlock_timestamp: UNLOCK_ELIGIBLE
> (time-based)
>
> If unlock_type == PriceDouble AND current_price \>= initial_price \*
> 2: UNLOCK_ELIGIBLE (price-based)

**3.** **Withdraw** **(Claim** **Funds)**

**Purpose**: Release locked funds upon unlock condition fulfillment

**Validation**:

> User is vault owner
>
> Unlock conditions met
>
> Token account balances match

**4.** **Emergency** **Cancel**

**Purpose**: Allow vault cancellation after set period (requires
multi-sig)

**4.** **Frontend** **Architecture**

**4.1** **Project** **Structure**

> double-or-nothing-frontend/ ├── app/
>
> │ ├── layout.tsx │ ├── page.tsx
>
> │ ├── auth/
>
> │ │ ├── login/page.tsx │ │ └── signup/page.tsx │ ├── vaults/
>
> │ │ ├── page.tsx
>
> │ │ ├── \[id\]/page.tsx
>
> │ │ └── create/page.tsx │ ├── dashboard/page.tsx │ └── api/
>
> │ ├── vaults/route.ts │ ├── auth/route.ts
>
> │ └── health/route.ts ├── components/
>
> │ ├── layout/ │ ├── auth/
>
> │ ├── vaults/ │ ├── ui/
>
> │ └── common/ ├── hooks/
>
> ├── lib/ ├── context/ ├── types/ ├── styles/ └── public/

**4.2** **Key** **Frontend** **Components**

**Authentication** **Flow** **(Privy** **Integration)**

> import { PrivyProvider } from '@privy-io/react-auth';
>
> export function AppPrivyProvider({ children }) { return (
>
> &lt;PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
>
> config={{ appearance: {
>
> theme: 'dark', accentColor: '#676FFF',
>
> }, embeddedWallets: {
>
> createOnLogin: 'users-without-wallets', },
>
> loginMethods: \['email', 'google', 'discord'\], solanaClusters: \[
>
> { name: 'mainnet-beta', rpcUrl: process.env.NEXT_PUBLIC_HELIUS_RPC_URL
> }, \],
>
> }} &gt;
>
> {children} &lt;/PrivyProvider&gt;
>
> ); }

**4.3** **State** **Management** **(Zustand** **+** **TanStack**
**Query)**

**Zustand** **Store**

> export const useVaultStore = create((set) =&gt; ({ vaults: \[\],
>
> selectedVaultId: null, isLoading: false, error: null,
>
> setVaults: (vaults) =&gt; set({ vaults }), setSelectedVault: (id)
> =&gt; set({ selectedVaultId: id }), addVault: (vault) =&gt;
> set((state) =&gt; ({
>
> vaults: \[...state.vaults, vault\], })),
>
> }));

**TanStack** **Query**

> export function useVaults() { return useQuery({
>
> queryKey: \['vaults'\], queryFn: async () =&gt; {
>
> const response = await fetch('/api/vaults'); return response.json();
>
> }, });
>
> }

**5.** **Backend/Indexing** **Architecture**

**5.1** **Backend** **Purpose**

> **Off-chain** **Indexing**: Mirror on-chain vault state for faster
> queries
>
> **API** **Gateway**: Serve indexed data to frontend
>
> **Price** **Caching**: Cache Pyth price data to reduce oracle calls
>
> **Event** **Monitoring**: Listen for blockchain events and update
> database

**5.2** **Database** **Schema** **(PostgreSQL)**

> CREATE TABLE users ( id UUID PRIMARY KEY,
>
> solana_pubkey TEXT UNIQUE NOT NULL, email TEXT,
>
> created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
>
> CREATE TABLE vaults ( id UUID PRIMARY KEY,
>
> user_id UUID REFERENCES users(id), vault_pubkey TEXT UNIQUE NOT NULL,
> token_mint TEXT NOT NULL,
>
> amount BIGINT NOT NULL,
>
> initial_price DECIMAL(20, 8) NOT NULL, locked_at TIMESTAMP NOT NULL,
> unlock_timestamp TIMESTAMP NOT NULL, unlock_type TEXT NOT NULL,
> current_price DECIMAL(20, 8), is_unlocked BOOLEAN DEFAULT FALSE,
> unlock_reason TEXT,
>
> unlocked_at TIMESTAMP,
>
> created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_user_id
> (user_id)
>
> );
>
> CREATE TABLE price_history ( id UUID PRIMARY KEY,
>
> vault_id UUID REFERENCES vaults(id), price DECIMAL(20, 8) NOT NULL,
>
> recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
>
> CREATE TABLE transaction_logs ( id UUID PRIMARY KEY,
>
> user_id UUID REFERENCES users(id), tx_signature TEXT UNIQUE NOT NULL,
> action TEXT NOT NULL,
>
> vault_id UUID REFERENCES vaults(id), status TEXT NOT NULL,
>
> created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );

**5.3** **API** **Endpoints**

**Authentication**

> POST /api/auth/verify - Verify Privy JWT token
>
> GET /api/auth/user - Get authenticated user profile

**Vaults**

> GET /api/vaults - List user's vaults (paginated)
>
> GET /api/vaults/:id - Get vault details with current price
>
> POST /api/vaults - Create vault (prepare transaction)
>
> GET /api/vaults/:id/unlock-status - Check if vault is unlocked
>
> GET /api/vaults/:id/price-history - Get price history for vault

**Price** **Data** **(via** **Helius)**

> GET /api/prices/:mint - Get current price for token from Helius
>
> GET /api/prices/:mint/history - Historical price data

**Indexing**

> POST /api/webhook/helius-event - Receive blockchain events from Helius
> webhook

**6.** **Helius** **RPC** **Integration**

**6.1** **Configuration**

> // lib/helius.ts
>
> export const HELIUS_CONFIG = {
>
> RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL, API_KEY:
> process.env.HELIUS_API_KEY, WEBHOOK_SECRET:
> process.env.HELIUS_WEBHOOK_SECRET,
>
> };
>
> // Create Helius RPC client
>
> import { Connection } from '@solana/web3.js';
>
> export const heliusConnection = new Connection( HELIUS_CONFIG.RPC_URL,
>
> 'confirmed' );

**6.2** **Helius** **Features** **Utilized**

**Price** **Data** **via** **Helius** **API**

> // Fetch token prices from Helius
>
> async function getPriceFromHelius(mint: string) { const response =
> await fetch(
>
> \`https://api.helius.xyz/v0/addresses/\${mint}?api-key=\${HELIUS_API_KEY}\`
> );
>
> const data = await response.json(); return
> data.tokens\[0\]?.token_info?.price;
>
> }

**Webhook** **Integration** **for** **Transaction** **Monitoring**

> // Configure webhook in Helius dashboard to send transaction events //
> Endpoint: https://yourdomain.com/api/webhook/helius-event
>
> // Events: Any transaction involving vault program ID
>
> export async function POST(req: Request) { const payload = await
> req.json();
>
> // Helius sends transaction signatures if (payload.type ===
> 'TRANSACTION') {
>
> // Parse transaction to detect DEPOSIT or WITHDRAW // Update database
> accordingly
>
> } }

**Enhanced** **RPC** **Features**

> Faster block confirmation times (Helius optimized nodes)
>
> Built-in rate limiting management
>
> Real-time webhook notifications for transactions
>
> Historical data indexing
>
> DAS API for token metadata

**6.3** **Environment** **Variables**

> \# Frontend (.env.local)
>
> NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet-beta.helius-rpc.com/?api-key=YOUR_API_KEY
> NEXT_PUBLIC_HELIUS_API_KEY=YOUR_API_KEY
>
> \# Backend (.env) HELIUS_API_KEY=YOUR_API_KEY
> HELIUS_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
>
> HELIUS_RPC_URL=https://mainnet-beta.helius-rpc.com/?api-key=YOUR_API_KEY

**7.** **User** **Flow** **&** **UI** **Specifications**

**7.1** **Main** **User** **Journeys**

**New** **User** **Journey**

> 1\. Land on homepage
>
> 2\. Click "Create Account"
>
> 3\. Privy modal: choose authentication method
>
> 4\. Auto-wallet creation by Privy
>
> 5\. Redirect to dashboard

**Create** **Vault** **Flow**

> 1\. Click "Create Vault" button
>
> 2\. Token selection modal
>
> 3\. Enter amount
>
> 4\. Select timeframe
>
> 5\. Stage 1 Confirmation: Display warnings
>
> 6\. Stage 2 Confirmation: Re-display terms
>
> 7\. Stage 3 Confirmation: Final irreversible step
>
> 8\. Transaction signing
>
> 9\. Success and redirect

**Manage** **Vault** **Flow**

> 1\. Click on vault from list
>
> 2\. View detailed status with live price from Helius
>
> 3\. If unlocked: Click "Withdraw" button
>
> 4\. Confirm and sign transaction
>
> 5\. Success notification

**8.** **Deployment** **&** **DevOps**

**8.1** **Smart** **Contract** **Deployment**

> \# Build program anchor build
>
> \# Deploy to Devnet
>
> anchor deploy --provider.cluster devnet
>
> \# Deploy to Mainnet-Beta
>
> anchor deploy --provider.cluster mainnet-beta

**8.2** **Frontend** **Deployment** **(Vercel)**

> \# Environment variables
>
> NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet-beta.helius-rpc.com/?api-key=...
> NEXT_PUBLIC_PRIVY_APP_ID=...
>
> NEXT_PUBLIC_PROGRAM_ID=... NEXT_PUBLIC_BACKEND_URL=...
>
> \# Deploy
>
> git push origin main

**8.3** **Backend** **Deployment** **(Render)**

> \# Environment variables DATABASE_URL=postgresql://...
> REDIS_URL=redis://... HELIUS_API_KEY=...
>
> HELIUS_RPC_URL=https://mainnet-beta.helius-rpc.com/?api-key=...
> HELIUS_WEBHOOK_SECRET=...

**9.** **Security** **Checklist**

**Smart** **Contract** **Security**

> ✓ Use Anchor framework (automatic safety checks)
>
> ✓ Validate all user inputs
>
> ✓ Check price oracle staleness (\< 60 seconds)
>
> ✓ Use checked arithmetic (no overflow)
>
> ✓ Implement rate limiting on oracle calls
>
> ✓ Test extensively on devnet before mainnet
>
> ✓ Get security audit before mainnet launch

**Frontend** **Security**

> ✓ Validate forms with Zod
>
> ✓ Use HTTPS everywhere
>
> ✓ Implement CORS properly
>
> ✓ Store sensitive keys in environment variables
>
> ✓ Use Content Security Policy headers

**Backend** **Security**

> ✓ Implement rate limiting
>
> ✓ Validate JWT tokens from Privy
>
> ✓ Use HTTPS for all endpoints
>
> ✓ Implement database encryption
>
> ✓ Set up database backups
>
> ✓ Validate Helius webhook signatures

**10.** **Testing** **Strategy**

**Smart** **Contract** **Tests** **(Anchor)**

> anchor test

Test cases:

> Initialize vault with valid params
>
> Reject invalid timeframes
>
> Reject zero amount
>
> Verify price oracle integration
>
> Test unlock by time
>
> Test unlock by price
>
> Test withdrawal conditions

**Frontend** **Tests**

> npm run test

Test cases:

> Privy wallet connection flow
>
> Form validation (create vault)
>
> Display vault details correctly
>
> Handle network errors gracefully

**Integration** **Tests**

> npm run e2e

Full user journey:

> Sign up with Privy
>
> Create vault
>
> View vault details
>
> Withdraw funds

**11.** **Key** **Constants**

> export const PROGRAM_ID = new PublicKey("...");
>
> export const TIMEFRAMES = { ONE_MONTH: 30 \* 24 \* 60 \* 60,
> THREE_MONTHS: 90 \* 24 \* 60 \* 60, SIX_MONTHS: 180 \* 24 \* 60 \* 60,
> ONE_YEAR: 365 \* 24 \* 60 \* 60, TWO_YEARS: 2 \* 365 \* 24 \* 60 \*
> 60, FIVE_YEARS: 5 \* 365 \* 24 \* 60 \* 60,
>
> };
>
> export const PRICE_ORACLE = { PROVIDER: "PYTH", STALENESS_THRESHOLD:
> 60, FALLBACK: "SWITCHBOARD",
>
> };
>
> export const SOL_DECIMALS = 9; export const USDC_DECIMALS = 6; export
> const MIN_VAULT_AMOUNT = 1;
>
> export const MAX_VAULTS_PER_USER = 100;

**12.** **Monitoring** **&** **Analytics**

**Key** **Metrics**

> Total value locked (TVL) by token
>
> Average vault unlock time
>
> Unlock success rate
>
> User retention
>
> Transaction success rate
>
> Gas fees

**Tools**

> Vercel Analytics
>
> Sentry (error tracking)
>
> Mixpanel or Amplitude (analytics)

**Document** **Version**: 1.1

**Last** **Updated**: November 10, 2025 **Status**: Ready for
Implementation

**RPC** **Provider**: Helius (Paid Subscription)
