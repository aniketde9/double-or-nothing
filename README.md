# Double or Nothing - Solana Vault dApp

A conviction-based vault dApp on Solana that allows users to lock cryptocurrency assets with dual unlock conditions: either when the token value doubles or when a user-selected timeframe expires (1 month to 5 years), whichever comes first.

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript, React 18+
- **Styling**: Tailwind CSS 3+
- **State Management**: TanStack Query + Zustand
- **Wallet Integration**: Privy SDK (embedded Solana wallets)
- **Smart Contracts**: Anchor Framework (v0.29+)
- **RPC**: Helius (paid subscription)
- **Price Oracle**: Pyth Network (primary), Helius API (fallback)

## Features

- **3-Step Confirmation**: Mandatory confirmation process before locking funds
- **Dual Unlock Conditions**: 
  - Price doubles (2x initial price) OR
  - Timeframe expires (1 month to 5 years)
  - Whichever comes first
- **Multiple Vaults**: Create unlimited independent vaults
- **Non-Custodial**: Funds locked in smart contracts
- **Real-time Price Tracking**: Live price updates via Helius/Pyth

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Helius API key
- Privy App ID
- Anchor program deployed (for smart contract integration)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Fill in your environment variables:
- `NEXT_PUBLIC_PRIVY_APP_ID`: Your Privy app ID
- `NEXT_PUBLIC_HELIUS_RPC_URL`: Helius RPC URL with API key
- `NEXT_PUBLIC_HELIUS_API_KEY`: Helius API key
- `NEXT_PUBLIC_PROGRAM_ID`: Anchor program ID (once deployed)
- `NEXT_PUBLIC_BACKEND_URL`: Backend API URL

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Dashboard/homepage
│   ├── login/             # Login page
│   └── vaults/             # Vault pages
│       ├── page.tsx       # Vault list
│       ├── create/        # Vault creation (3-step)
│       └── [id]/          # Vault details
├── components/            # React components
│   ├── vaults/           # Vault-specific components
│   └── ...
├── constants/            # App constants
├── context/              # React contexts (Auth)
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and helpers
│   ├── anchor.ts         # Anchor program setup
│   ├── vaultInstructions.ts  # Smart contract calls
│   └── validations/      # Zod schemas
├── services/             # API services
│   ├── vaultApi.ts       # Vault API client
│   └── priceOracle.ts    # Price oracle integration
└── store/                # Zustand stores
```

## Smart Contract Integration

The frontend is ready to integrate with the Anchor program. The smart contract should implement:

- `initialize_vault`: 3-step confirmation process
- `check_unlock_conditions`: Verify unlock eligibility
- `withdraw`: Withdraw funds when unlocked

See `lib/vaultInstructions.ts` for the integration interface.

## Backend API

The backend provides these endpoints:

### Authentication
- `POST /api/auth/verify` - Verify Privy JWT token
- `GET /api/auth/user` - Get authenticated user profile

### Vaults
- `GET /api/vaults` - List user vaults (paginated)
- `GET /api/vaults/:id` - Get vault details with current price
- `POST /api/vaults` - Create vault record (after on-chain creation)
- `GET /api/vaults/:id/unlock-status` - Check if vault is unlocked
- `GET /api/vaults/:id/price-history` - Get price history for vault

### Prices
- `GET /api/prices/:mint` - Get current token price (proxy to Helius)

### Webhooks
- `POST /api/webhook/helius-event` - Handle Helius webhook events for transaction monitoring

### Health
- `GET /health` - Health check endpoint

## Development

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Backend Setup

The backend server is located in the `server/` directory.

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

4. Set up PostgreSQL database:
```bash
# Create database
createdb double_or_nothing

# Run schema (or let the app auto-create on startup)
psql double_or_nothing < schema.sql
```

5. Start the backend server:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## Notes

- Smart contract (Anchor program) needs to be developed and deployed separately
- Backend API endpoints are implemented and ready to use
- Price oracle integration uses Helius API (configured via HELIUS_API_KEY)
- Database schema is auto-created on first startup if using the database.ts initialization
- 3-step confirmation is critical - each step calls the smart contract

## License

MIT
