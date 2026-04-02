# Backend Environment Variables

Add these to your project root `.env` (or `server/.env`):

## Required for Supabase Auth + Data

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- **SUPABASE_URL**: Same as `VITE_SUPABASE_URL` (your Supabase project URL)
- **SUPABASE_SERVICE_ROLE_KEY**: From Supabase Dashboard → Settings → API → `service_role` (keep secret!)

## Other (unchanged)

- `JWT_SECRET` - For signing JWTs (auth)
- `PORT` - Server port (default 3001)
- Fabric vars - See main project docs

## Create Admin (one-time)

Add to `server/.env`:
```
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=YourSecurePassword
```

Then run: `cd server && npm run create-admin`

Or use PowerShell env vars (see RUN_COMMANDS.md).

## No Local Database

The backend does NOT use PostgreSQL. All user/profile data comes from Supabase.
