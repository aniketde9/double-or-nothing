# Deployment Guide - Double or Nothing

This guide covers deploying the Double or Nothing dApp to production.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL database (local or cloud)
- Helius API key
- Privy App ID and Secret
- Vercel account (for frontend)
- Render account or similar (for backend)

## Environment Variables

### Frontend (.env.local)

Create a `.env.local` file in the root directory:

```bash
# Privy Authentication (Required)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Helius API Configuration (Required)
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key_here

# Solana Program ID (Optional - set after smart contract deployment)
NEXT_PUBLIC_PROGRAM_ID=

# Backend API URL
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com/api
```

### Backend (server/.env)

Create a `.env` file in the `server/` directory:

```bash
# Database Configuration (Required)
DATABASE_URL=postgresql://user:password@host:port/database

# Privy Authentication (Required)
PRIVY_APP_ID=your_privy_app_id_here
PRIVY_APP_SECRET=your_privy_app_secret_here

# Helius API Configuration (Required)
HELIUS_API_KEY=your_helius_api_key_here
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key_here

# Helius Webhook Secret (Optional)
HELIUS_WEBHOOK_SECRET=your_webhook_secret_here

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
```

## Database Setup

### 1. Create PostgreSQL Database

Create a new PostgreSQL database:

```bash
# Using psql
createdb double_or_nothing

# Or using SQL
CREATE DATABASE double_or_nothing;
```

### 2. Run Schema Migration

The database schema is automatically created on server startup. Alternatively, you can run the SQL file manually:

```bash
psql -d double_or_nothing -f server/schema.sql
```

### 3. Verify Database Connection

Test the connection by starting the server:

```bash
cd server
npm run dev
```

You should see: `✅ Connected to PostgreSQL database`

## Frontend Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy to Vercel

```bash
# From project root
vercel
```

### 3. Set Environment Variables in Vercel

1. Go to your project settings in Vercel dashboard
2. Navigate to "Environment Variables"
3. Add all variables from `.env.local` (without `NEXT_PUBLIC_` prefix for public vars)
4. Redeploy

### 4. Configure Custom Domain (Optional)

1. Go to project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS as instructed

## Backend Deployment (Render)

### 1. Create New Web Service

1. Go to Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `server/` directory as root

### 2. Configure Build Settings

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment:** Node

### 3. Set Environment Variables

Add all environment variables from `server/.env` in the Render dashboard.

### 4. Add PostgreSQL Database

1. Create a new PostgreSQL database in Render
2. Copy the connection string
3. Add it as `DATABASE_URL` in environment variables

### 5. Deploy

Click "Deploy" and wait for the build to complete.

## Helius Webhook Configuration

### 1. Set Up Webhook in Helius Dashboard

1. Go to Helius dashboard
2. Navigate to "Webhooks"
3. Create a new webhook with:
   - **URL:** `https://your-backend-url.com/api/webhook/helius-event`
   - **Events:** Transaction events for your program ID
   - **Secret:** (optional, but recommended)

### 2. Update Environment Variables

Add `HELIUS_WEBHOOK_SECRET` to your backend environment variables.

## Post-Deployment Checklist

- [ ] Frontend is accessible and loads correctly
- [ ] Backend health check works: `GET https://your-backend-url.com/health`
- [ ] Database connection is working
- [ ] Authentication flow works (Privy login)
- [ ] Price fetching works (Helius API)
- [ ] Vault creation flow works (UI)
- [ ] Scheduled price updates are running (check backend logs)
- [ ] Webhook is receiving events (if configured)

## Monitoring

### Backend Logs

Check Render logs for:
- Scheduled price updates
- API errors
- Database connection issues

### Frontend Analytics

Set up Vercel Analytics to track:
- Page views
- User interactions
- Error rates

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database firewall settings
- Ensure database is accessible from Render IPs

### Helius API Issues

- Verify API key is correct
- Check API rate limits
- Verify RPC URL format

### CORS Issues

- Ensure `FRONTEND_URL` in backend matches actual frontend URL
- Check CORS configuration in `server/main.ts`

### Environment Variable Issues

- Ensure all required variables are set
- Check variable names match exactly (case-sensitive)
- Verify `NEXT_PUBLIC_` prefix for frontend variables

## Security Considerations

1. **Never commit `.env` files** - They contain sensitive keys
2. **Use environment variables** - Don't hardcode secrets
3. **Enable HTTPS** - Both frontend and backend should use HTTPS
4. **Set up rate limiting** - Protect API endpoints from abuse
5. **Validate webhook signatures** - Verify Helius webhook requests

## Next Steps

After deployment:

1. Test all user flows
2. Monitor error rates
3. Set up alerts for critical errors
4. Deploy smart contract (when ready)
5. Update `NEXT_PUBLIC_PROGRAM_ID` after contract deployment

