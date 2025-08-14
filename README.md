# 🌟 Aurora Transit - Cosmic Journey Planner

Navigate Stockholm's transit galaxy with cosmic precision! Find the fastest public transport routes using SL integration APIs. Save your favorite cosmic destinations with Google Sign In authentication.

## ✨ Features
- **Cosmic Theme**: Beautiful aurora-themed UI with glass morphism effects
- **Google Authentication**: Sign in to save and manage your destinations
- **Smart Location Detection**: Auto-detects your current location
- **Fast Search**: BM25-powered typeahead search for Stockholm locations  
- **Route Planning**: Find optimal public transport routes with real-time data
- **Saved Addresses**: Personal address book with custom labels and descriptions
- **Responsive Design**: Works seamlessly on all devices

## 🚀 Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Animation**: Framer Motion for smooth cosmic transitions
- **Auth**: NextAuth.js with Google OAuth
- **Database**: Prisma ORM with PostgreSQL (production) / SQLite (development)
- **Search**: Lunr.js for BM25-style full-text search
- **Data Fetching**: SWR + Axios for optimal caching
- **Deployment**: Vercel with IaC setup

## APIs used (integration endpoints)
- SL Journey Planner v2: `https://journeyplanner.integration.sl.se/v2`
- SL Transport: `https://transport.integration.sl.se/v1`
- SL Deviations: `https://deviations.integration.sl.se/v1`

No API keys are required for these integration endpoints. Respect fair-use guidelines (avoid excessive requests).

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ 
- Yarn or npm
- Google OAuth credentials (for authentication)

### Setup Instructions

1. **Clone & Install**
```bash
git clone <repository-url>
cd travel-helper
yarn install
```

2. **Environment Setup**
```bash
cp .env.example .env
```

3. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API  
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
   - Copy Client ID and Secret to `.env`

4. **Database Setup**
```bash
yarn prisma generate
yarn prisma migrate dev --name init
```

5. **Generate NextAuth Secret**
```bash
openssl rand -base64 32
# Copy output to NEXTAUTH_SECRET in .env
```

6. **Start Development Server**
```bash
yarn dev
```

Open http://localhost:3000 and sign in with Google!

## 🚀 Deployment to Vercel

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/travel-helper)

### Manual Deployment

1. **Set up PostgreSQL Database**
   - Use Vercel Postgres (free tier: 512MB)
   - Or any PostgreSQL provider (Railway, Supabase, etc.)

2. **Configure Environment Variables in Vercel**
   ```
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   GOOGLE_CLIENT_ID=<from Google Cloud Console>
   GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
   DATABASE_URL=<PostgreSQL connection string>
   ```

3. **Update Google OAuth**
   - Add your Vercel domain to authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback/google`

4. **Deploy**
   ```bash
   git push origin main
   # Auto-deploys via GitHub Actions
   ```

### Infrastructure as Code (IaC)
The project includes:
- `vercel.json` - Vercel deployment configuration
- `.github/workflows/deploy.yml` - GitHub Actions CI/CD
- Environment variable management
- Automated database migrations

## 📡 API Routes
- `GET /api/sites/search?q=...&limit=10` — Smart typeahead search
- `GET /api/trips?fromLat=..&fromLon=..&toLat=..&toLon=..&when=ISO&num=3` — Route planning
- `GET /api/deviations?site=1234&line=14&future=true` — Service disruptions
- `GET /api/departures?siteId=1234` — Real-time departures
- `GET/POST /api/addresses` — User's saved destinations (auth required)
- `PUT/DELETE /api/addresses/:id` — Manage destinations (auth required)
- `GET/POST /api/auth/*` — NextAuth.js authentication endpoints

## 🔍 Search & Caching Strategy
- **Smart Caching**: Sites cache refreshes from SL Transport `/sites` API  
- **BM25 Search**: In-memory Lunr.js index for lightning-fast typeahead
- **Rate Limiting**: Respects SL API guidelines with configurable intervals
- **Persistence**: SQLite/PostgreSQL stores cache across server restarts

## 🔐 Security Features
- **Authentication**: Secure Google OAuth integration
- **Authorization**: User-scoped data access (addresses tied to user accounts)
- **Session Management**: Database sessions with NextAuth.js
- **Environment Security**: All secrets in environment variables
- **Input Validation**: Server-side validation for API endpoints

## 🌟 Future Enhancements
- **Real-time Updates**: WebSocket integration for live trip updates
- **Push Notifications**: Service worker for departure alerts  
- **Offline Support**: PWA capabilities with service worker caching
- **Map Integration**: Interactive route visualization
- **Trip History**: Save and share favorite routes
- **Dark Mode**: Theme switching support
