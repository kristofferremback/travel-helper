# 🚀 Deployment Guide

## Prerequisites
- GitHub repository with the code
- Google Cloud Console project with OAuth credentials
- Vercel account

## Step-by-Step Deployment

### 1. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local development)
   - `https://your-app-name.vercel.app/api/auth/callback/google` (for production)
7. Save the Client ID and Client Secret

### 2. Database Setup (PostgreSQL)
Choose one of these options:

#### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel dashboard
2. Create a new project or select existing
3. Go to "Storage" tab
4. Click "Create Database" > "Postgres"
5. Copy the DATABASE_URL from the connection details

#### Option B: External Provider (Railway/Supabase)
1. Create account on Railway.app or Supabase
2. Create a new PostgreSQL database
3. Copy the connection string

### 3. Vercel Deployment

#### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kristofferremback/travel-helper)

#### Option B: Manual Setup
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables (see below)
6. Deploy!

### 4. Environment Variables Configuration

In your Vercel project settings, add these environment variables:

```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
DATABASE_URL=<PostgreSQL connection string>
SL_JP2_BASE_URL=https://journeyplanner.integration.sl.se/v2
SL_TRANSPORT_BASE_URL=https://transport.integration.sl.se/v1
SL_DEVIATIONS_BASE_URL=https://deviations.integration.sl.se/v1
SL_MIN_FETCH_INTERVAL_MS=60000
```

### 5. Database Migration

After deployment, run the database migration:

1. Go to your Vercel project dashboard
2. Navigate to "Functions" tab
3. Find any API function and click "View Function Logs"
4. Or use Vercel CLI:
   ```bash
   npx vercel env pull .env.local
   npx prisma migrate deploy
   ```

### 6. Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update Google OAuth redirect URIs to use your custom domain
4. Update NEXTAUTH_URL environment variable

## GitHub Actions (Automated Deployment)

The project includes automated deployment via GitHub Actions. To set up:

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" > "Actions"
3. Add these secrets:
   ```
   VERCEL_TOKEN=<get from Vercel account settings>
   ORG_ID=<your Vercel organization ID>
   PROJECT_ID=<your Vercel project ID>
   ```

Now every push to `main` branch will automatically deploy to Vercel!

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check if database allows external connections
   - Run `npx prisma migrate deploy` if tables are missing

2. **Google OAuth Errors**
   - Verify redirect URIs match exactly
   - Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   - Ensure NEXTAUTH_URL matches your domain

3. **Build Failures**
   - Check for TypeScript errors in local development
   - Verify all environment variables are set
   - Review build logs in Vercel dashboard

4. **API Route Errors**
   - Check function logs in Vercel dashboard
   - Verify SL API endpoints are accessible
   - Check rate limiting configuration

### Getting Help

- Check the [GitHub Issues](https://github.com/kristofferremback/travel-helper/issues)
- Review [Vercel Documentation](https://vercel.com/docs)
- Check [NextAuth.js Documentation](https://next-auth.js.org)

## Security Checklist

- [ ] All secrets in environment variables (never committed to git)
- [ ] Google OAuth redirect URIs configured correctly
- [ ] Database connection secured (SSL enabled)
- [ ] NEXTAUTH_SECRET is cryptographically secure (32+ characters)
- [ ] Rate limiting configured for API endpoints
- [ ] User data properly scoped (addresses tied to user accounts)

## Performance Optimization

- [ ] Enable Vercel Edge Functions for better global performance
- [ ] Configure caching headers for static assets
- [ ] Implement proper error boundaries
- [ ] Monitor function execution times
- [ ] Set up proper logging and monitoring
