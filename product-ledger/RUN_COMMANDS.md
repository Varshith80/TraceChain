# TraceChain Run Commands

## 1. Create Admin User (PowerShell)

From `server/` directory:

```powershell
$env:ADMIN_EMAIL="manivarshithkudithyala@gmail.com"
$env:ADMIN_PASSWORD="Vaishnavi_08"
npm run create-admin
```

Or add to `server/.env` temporarily:
```
ADMIN_EMAIL=manivarshithkudithyala@gmail.com
ADMIN_PASSWORD=Vaishnavi_08
```
Then run: `cd server && npm run create-admin`

---

## 2. Start Backend Server

Prerequisites:
- Fabric test-network running
- Supabase URL + Service Role Key in `.env`

```powershell
cd server
npm run build
npm start
```

---

## 3. Start Frontend (Consumer Scanning App)

```powershell
cd C:\Users\Maniv\TraceChain\product-ledger
npm run dev
```

Then open: **http://localhost:8080**

---

## 4. Test Consumer Flow

1. **Sign up as Consumer** (or use "Continue with Google" if enabled)
2. After signup → you go to `/consumer`
3. **Scan a QR** or verify a product
4. Public verify page: `http://localhost:8080/verify/{childID}`

---

## 5. Test Manufacturer Flow

1. **Sign up as Manufacturer** (email/password only)
2. See "Your account is pending admin approval"
3. **Admin** logs in → Admin Dashboard → Pending tab → Approve
4. Manufacturer can now sign in and access dashboard

---

## 6. Google Auth (Optional)

To enable "Continue with Google" for consumers:

1. **Supabase Dashboard** → Authentication → URL Configuration → Redirect URLs: add `http://localhost:8080/auth`
2. **Supabase** → Authentication → Providers → Enable **Google**, add Client ID + Secret from Google Cloud Console
3. **Google Cloud Console** → Create OAuth 2.0 credentials, add `https://<your-supabase-project>.supabase.co/auth/v1/callback` as authorized redirect URI
