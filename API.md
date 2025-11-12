# API Documentation - Double or Nothing

## Base URL

- **Development:** `http://localhost:3001/api`
- **Production:** `https://your-backend-url.com/api`

## Authentication

All endpoints (except health check) require authentication via Privy JWT token.

Include the token in the Authorization header:

```
Authorization: Bearer <privy_jwt_token>
```

## Endpoints

### Authentication

#### POST /api/auth/verify

Verify a Privy JWT token.

**Request:**
```json
{
  "token": "privy_jwt_token_here"
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "privy_did",
    "email": "user@example.com",
    "wallet": {
      "address": "solana_wallet_address"
    }
  }
}
```

#### GET /api/auth/user

Get authenticated user profile.

**Response:**
```json
{
  "id": "privy_did",
  "email": "user@example.com",
  "wallet": {
    "address": "solana_wallet_address"
  }
}
```

### Vaults

#### GET /api/vaults

List user's vaults (paginated).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "vaults": [
    {
      "id": "uuid",
      "vault_pubkey": "solana_pubkey",
      "token_mint": "token_mint_address",
      "token_symbol": "SOL",
      "amount": 10.5,
      "initial_price": 150.0,
      "current_price": 155.0,
      "locked_at": "2024-01-01T00:00:00Z",
      "unlock_timestamp": "2024-07-01T00:00:00Z",
      "unlock_type": "PriceDouble",
      "is_unlocked": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### GET /api/vaults/:id

Get vault details with current price.

**Response:**
```json
{
  "id": "uuid",
  "vault_pubkey": "solana_pubkey",
  "token_mint": "token_mint_address",
  "token_symbol": "SOL",
  "amount": 10.5,
  "initial_price": 150.0,
  "current_price": 155.0,
  "locked_at": "2024-01-01T00:00:00Z",
  "unlock_timestamp": "2024-07-01T00:00:00Z",
  "unlock_type": "PriceDouble",
  "is_unlocked": false,
  "unlock_reason": null,
  "unlocked_at": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST /api/vaults

Create vault record (after on-chain creation).

**Request:**
```json
{
  "vault_pubkey": "solana_pubkey",
  "token_mint": "token_mint_address",
  "token_symbol": "SOL",
  "amount": 10.5,
  "unlock_timestamp": 1722470400,
  "unlock_type": "PriceDouble",
  "initial_price": 150.0,
  "transaction_signature": "tx_signature_here"
}
```

**Response:**
```json
{
  "vault_id": "uuid",
  "vault": {
    "id": "uuid",
    "vault_pubkey": "solana_pubkey",
    ...
  }
}
```

#### GET /api/vaults/:id/unlock-status

Check if vault is unlocked.

**Response:**
```json
{
  "is_unlocked": false,
  "unlock_reason": null,
  "unlocked_at": null
}
```

#### GET /api/vaults/:id/price-history

Get price history for vault.

**Query Parameters:**
- `limit` (optional): Number of records (default: 100)

**Response:**
```json
[
  {
    "price": 150.0,
    "recorded_at": "2024-01-01T00:00:00Z"
  },
  {
    "price": 155.0,
    "recorded_at": "2024-01-01T05:00:00Z"
  }
]
```

### Prices

#### GET /api/prices/:mint

Get current token price from Helius.

**Response:**
```json
{
  "mint": "token_mint_address",
  "price": 150.0,
  "timestamp": 1704067200000
}
```

### Webhooks

#### POST /api/webhook/helius-event

Receive blockchain events from Helius webhook.

**Request:**
```json
{
  "type": "TRANSACTION",
  "signature": "tx_signature",
  "accountData": {...}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event processed"
}
```

### Health Check

#### GET /health

Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "environment": "production"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "message": "Detailed error message (optional)"
}
```

**Status Codes:**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Current limits:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Scheduled Jobs

The backend runs scheduled jobs:

- **Price Updates:** Every 5 minutes
  - Updates prices for all locked vaults
  - Checks unlock conditions
  - Records price history

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All prices are in USD
- All amounts are in token units (not smallest units)
- `unlock_type` can be `"TimeOnly"` or `"PriceDouble"`

