# 🚨 IMMEDIATE FIX - Database Connection

## Problem
`password authentication failed for user "productledger"`

## Quick Fix (Choose One)

### Option 1: Use Postgres Superuser (Fastest - 30 seconds)

**Update `server/.env` file:**

Change this line:
```env
DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
```

To this:
```env
DATABASE_URL=postgresql://postgres:productledger123@localhost:5432/product_ledger_users
```

**Then restart backend:**
```powershell
# Press Ctrl+C to stop current server
# Then run again:
cd server
npm run dev
```

### Option 2: Recreate Database Container (Recommended - 1 minute)

**Stop and remove:**
```powershell
docker stop product-ledger-db
docker rm product-ledger-db
```

**Create new with proper setup:**
```powershell
docker run -d --name product-ledger-db -e POSTGRES_USER=productledger -e POSTGRES_PASSWORD=productledger123 -e POSTGRES_DB=product_ledger_users -e POSTGRES_HOST_AUTH_METHOD=md5 -p 5432:5432 postgres:15-alpine
```

**Wait 5 seconds, then restart backend:**
```powershell
cd server
npm run dev
```

### Option 3: Create User Manually (If container already has data)

```powershell
# Connect as postgres
docker exec -it product-ledger-db psql -U postgres

# Run these commands:
ALTER USER productledger WITH PASSWORD 'productledger123';
ALTER USER productledger WITH SUPERUSER;
\q
```

Then restart backend.

---

## ✅ Verify Fix

After applying fix, you should see:
```
✅ Database connection established
✅ Database schema initialized
🚀 Server running on port 3001
```

## 🎯 Recommended: Use Option 1 (Fastest)

Just change `productledger` to `postgres` in the DATABASE_URL and restart!

