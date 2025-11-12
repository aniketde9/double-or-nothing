import { Pool, QueryResultRow } from 'pg';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️ Warning: DATABASE_URL not set. Database features will be disabled.');
}

// Create a connection pool
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('vercel') 
        ? { rejectUnauthorized: false } 
        : false,
    })
  : null;

// Test connection
if (pool) {
  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client:', err);
  });

  // Initialize database schema
  (async () => {
    try {
      await initializeSchema();
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database schema:', error);
    }
  })();
}

async function initializeSchema() {
  if (!pool) return;

  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      privy_did VARCHAR(255) UNIQUE NOT NULL,
      solana_pubkey VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create index on privy_did for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_privy_did ON users(privy_did)
  `);

  // Create index on solana_pubkey for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_solana_pubkey ON users(solana_pubkey)
  `);

  // Create vaults table
  await pool.query(`
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
    )
  `);

  // Create indexes for vaults
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vaults_user_id ON vaults(user_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vaults_vault_pubkey ON vaults(vault_pubkey)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vaults_is_unlocked ON vaults(is_unlocked)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vaults_unlock_timestamp ON vaults(unlock_timestamp)
  `);

  // Create price_history table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS price_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
      price DECIMAL(20, 8) NOT NULL,
      recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create index for price_history
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_price_history_vault_id ON price_history(vault_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at)
  `);

  // Create transaction_logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transaction_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      tx_signature VARCHAR(255) UNIQUE NOT NULL,
      action VARCHAR(50) NOT NULL,
      vault_id UUID REFERENCES vaults(id) ON DELETE SET NULL,
      status VARCHAR(20) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create indexes for transaction_logs
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_transaction_logs_tx_signature ON transaction_logs(tx_signature)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_transaction_logs_vault_id ON transaction_logs(vault_id)
  `);

  // Keep old gifts table for backward compatibility (can be removed later)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gifts (
      id VARCHAR(255) PRIMARY KEY,
      sender_did VARCHAR(255) NOT NULL,
      sender_email VARCHAR(255) NOT NULL,
      recipient_email VARCHAR(255) NOT NULL,
      token_mint VARCHAR(255) NOT NULL,
      token_symbol VARCHAR(50) NOT NULL,
      token_decimals INTEGER NOT NULL,
      amount DECIMAL(20, 9) NOT NULL,
      message TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'SENT',
      tiplink_url TEXT NOT NULL,
      tiplink_public_key VARCHAR(255) NOT NULL,
      transaction_signature VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      claimed_at TIMESTAMP,
      claimed_by VARCHAR(255),
      claim_signature VARCHAR(255)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_gifts_sender_did ON gifts(sender_did)
  `);
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  if (!pool) {
    throw new Error('Database not configured. Please set DATABASE_URL in your .env file.');
  }

  try {
    const result = await pool.query<T>(text, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
}

export async function insertGift(gift: {
  id: string;
  sender_did: string;
  sender_email: string;
  recipient_email: string;
  token_mint: string;
  token_symbol: string;
  token_decimals: number;
  amount: number;
  message: string;
  status: string;
  tiplink_url: string;
  tiplink_public_key: string;
  transaction_signature: string;
  created_at: string;
}): Promise<void> {
  await query(
    `INSERT INTO gifts (
      id, sender_did, sender_email, recipient_email, token_mint, token_symbol, 
      token_decimals, amount, message, status, tiplink_url, tiplink_public_key, 
      transaction_signature, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      gift.id,
      gift.sender_did,
      gift.sender_email,
      gift.recipient_email,
      gift.token_mint,
      gift.token_symbol,
      gift.token_decimals,
      gift.amount,
      gift.message || null,
      gift.status,
      gift.tiplink_url,
      gift.tiplink_public_key,
      gift.transaction_signature,
      gift.created_at,
    ]
  );
}

export async function getGiftsBySender(sender_did: string): Promise<any[]> {
  return await query(
    `SELECT * FROM gifts WHERE sender_did = $1 ORDER BY created_at DESC`,
    [sender_did]
  );
}

export async function getGiftById(giftId: string): Promise<any | null> {
  const results = await query(
    `SELECT * FROM gifts WHERE id = $1`,
    [giftId]
  );
  return results.length > 0 ? results[0] : null;
}

export async function updateGiftClaim(
  giftId: string,
  claimed_by: string,
  claim_signature: string
): Promise<void> {
  await query(
    `UPDATE gifts 
     SET status = 'CLAIMED', claimed_at = NOW(), claimed_by = $1, claim_signature = $2 
     WHERE id = $3`,
    [claimed_by, claim_signature, giftId]
  );
}

// Vault database functions
export async function getOrCreateUser(userData: {
  privy_did: string;
  solana_pubkey: string;
  email?: string;
}): Promise<any> {
  // Try to get existing user
  const existing = await query(
    `SELECT * FROM users WHERE privy_did = $1 OR solana_pubkey = $2`,
    [userData.privy_did, userData.solana_pubkey]
  );

  if (existing.length > 0) {
    // Update email if provided and different
    if (userData.email && existing[0].email !== userData.email) {
      await query(
        `UPDATE users SET email = $1 WHERE id = $2`,
        [userData.email, existing[0].id]
      );
      existing[0].email = userData.email;
    }
    return existing[0];
  }

  // Create new user
  const result = await query(
    `INSERT INTO users (privy_did, solana_pubkey, email) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [userData.privy_did, userData.solana_pubkey, userData.email || null]
  );

  return result[0];
}

export async function getUserVaults(userId: string): Promise<any[]> {
  return await query(
    `SELECT * FROM vaults WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
}

export async function getVaultById(vaultId: string): Promise<any | null> {
  const results = await query(
    `SELECT * FROM vaults WHERE id = $1`,
    [vaultId]
  );
  return results.length > 0 ? results[0] : null;
}

export async function getVaultByPubkey(vaultPubkey: string): Promise<any | null> {
  const results = await query(
    `SELECT * FROM vaults WHERE vault_pubkey = $1`,
    [vaultPubkey]
  );
  return results.length > 0 ? results[0] : null;
}

export async function createVault(vaultData: {
  user_id: string;
  vault_pubkey: string;
  token_mint: string;
  token_symbol: string;
  amount: number;
  initial_price: number;
  locked_at: Date;
  unlock_timestamp: Date;
  unlock_type: 'TimeOnly' | 'PriceDouble';
}): Promise<any> {
  const result = await query(
    `INSERT INTO vaults (
      user_id, vault_pubkey, token_mint, token_symbol, amount, 
      initial_price, locked_at, unlock_timestamp, unlock_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      vaultData.user_id,
      vaultData.vault_pubkey,
      vaultData.token_mint,
      vaultData.token_symbol,
      vaultData.amount,
      vaultData.initial_price,
      vaultData.locked_at,
      vaultData.unlock_timestamp,
      vaultData.unlock_type,
    ]
  );
  return result[0];
}

export async function updateVaultPrice(vaultId: string, currentPrice: number): Promise<void> {
  await query(
    `UPDATE vaults SET current_price = $1 WHERE id = $2`,
    [currentPrice, vaultId]
  );
}

export async function updateVaultUnlockStatus(
  vaultId: string,
  isUnlocked: boolean,
  unlockReason?: string
): Promise<void> {
  await query(
    `UPDATE vaults 
     SET is_unlocked = $1, unlock_reason = $2, unlocked_at = $3
     WHERE id = $4`,
    [isUnlocked, unlockReason || null, isUnlocked ? new Date() : null, vaultId]
  );
}

export async function addPriceHistory(vaultId: string, price: number): Promise<void> {
  await query(
    `INSERT INTO price_history (vault_id, price) VALUES ($1, $2)`,
    [vaultId, price]
  );
}

export async function getPriceHistory(vaultId: string, limit: number = 100): Promise<any[]> {
  return await query(
    `SELECT * FROM price_history 
     WHERE vault_id = $1 
     ORDER BY recorded_at DESC 
     LIMIT $2`,
    [vaultId, limit]
  );
}

export async function logTransaction(transactionData: {
  user_id?: string;
  tx_signature: string;
  action: string;
  vault_id?: string;
  status: string;
}): Promise<void> {
  await query(
    `INSERT INTO transaction_logs (user_id, tx_signature, action, vault_id, status)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      transactionData.user_id || null,
      transactionData.tx_signature,
      transactionData.action,
      transactionData.vault_id || null,
      transactionData.status,
    ]
  );
}

export { pool };


