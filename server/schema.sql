-- Double or Nothing Database Schema
-- PostgreSQL 15+

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_did VARCHAR(255) UNIQUE NOT NULL,
  solana_pubkey VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_privy_did ON users(privy_did);
CREATE INDEX IF NOT EXISTS idx_users_solana_pubkey ON users(solana_pubkey);

-- Vaults table
CREATE TABLE IF NOT EXISTS vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vault_pubkey VARCHAR(255) UNIQUE NOT NULL,
  token_mint VARCHAR(255) NOT NULL,
  token_symbol VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  initial_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  locked_at TIMESTAMP NOT NULL,
  unlock_timestamp TIMESTAMP NOT NULL,
  unlock_type VARCHAR(20) NOT NULL CHECK (unlock_type IN ('TimeOnly', 'PriceDouble')),
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlock_reason TEXT,
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaults_user_id ON vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_vaults_vault_pubkey ON vaults(vault_pubkey);
CREATE INDEX IF NOT EXISTS idx_vaults_is_unlocked ON vaults(is_unlocked);
CREATE INDEX IF NOT EXISTS idx_vaults_unlock_timestamp ON vaults(unlock_timestamp);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
  price DECIMAL(20, 8) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_vault_id ON price_history(vault_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at);

-- Transaction logs table
CREATE TABLE IF NOT EXISTS transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tx_signature VARCHAR(255) UNIQUE NOT NULL,
  action VARCHAR(50) NOT NULL,
  vault_id UUID REFERENCES vaults(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_tx_signature ON transaction_logs(tx_signature);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_vault_id ON transaction_logs(vault_id);

