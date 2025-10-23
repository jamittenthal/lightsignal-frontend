# Authentication & Public Routes Implementation

This implementation adds public landing page, demo mode, and auth flows to LightSignal.

## Routes

### Public Routes (no auth required)
- `/` - Landing page with Try Demo, Log in, Sign up buttons
- `/demo` - Full demo experience using sample data (company_id="demo")
- `/login` - Email/password login + Google OAuth option
- `/signup` - Name/email/password signup with terms agreement
- `/logout` - Ends session and redirects to /login
- `/legal/*` - Legal pages (privacy, terms, etc.)

### Protected Routes (auth required)
- All existing app routes: `/overview`, `/opportunities`, `/health`, etc.
- Middleware automatically redirects unauthenticated users to `/login`

## Authentication Flow

### Backend Integration
Frontend calls these backend endpoints:
- `GET /auth/session` - Check current session
- `POST /auth/login` - Login with email/password
- `POST /auth/signup` - Create account with name/email/password
- `POST /auth/logout` - End session
- `GET /auth/google` - OAuth with Google (optional)

### Session Management
- Backend sets HTTP-only cookies for session management
- Middleware checks session via backend API call with fallback to cookie presence
- Client components use `useSession()` hook for auth state
- `AuthGate` wrapper redirects to login for client-side protection

### Demo Mode
- Uses `company_id="demo"` or `NEXT_PUBLIC_DEMO_COMPANY_ID`
- Falls back to safe UI stubs when backend offline
- Shows demo banner: "Demo Mode — data is sample only"

## Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=https://your-backend.com

# Optional
NEXT_PUBLIC_DEMO_ENABLED=true
NEXT_PUBLIC_DEMO_COMPANY_ID=demo
```

## Cookie Names
Middleware looks for these session cookies:
- `ls_session` (preferred)
- `ls_jwt` 
- `session` (fallback)

Update `middleware.ts` if your backend uses different cookie names.

## Development

```bash
npm install
npm run dev
```

Visit:
- `http://localhost:3000/` - Landing page
- `http://localhost:3000/demo` - Demo (no login required)
- `http://localhost:3000/login` - Login form
- `http://localhost:3000/overview` - Redirects to login when not authenticated

## Implementation Notes

- Middleware provides server-side route protection
- Header component shows auth state and navigation
- Login/signup pages handle redirect URLs from protected routes
- Demo page reuses existing dashboard with sample data
- No secrets exposed in frontend (only NEXT_PUBLIC_* variables)