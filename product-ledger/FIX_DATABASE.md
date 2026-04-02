# 🔧 Fix Database Connection Issue

## Problem
Error: `password authentication failed for user "productledger"`

## Solution Options

### Option 1: Recreate Database Container (Recommended)

**Stop and remove existing container:**
```powershell
docker stop product-ledger-db
docker rm product-ledger-db
```

**Create new container with correct credentials:**
```powershell
docker run -d --name product-ledger-db -e POSTGRES_USER=productledger -e POSTGRES_PASSWORD=productledger123 -e POSTGRES_DB=product_ledger_users -p 5432:5432 postgres:15-alpine
```

**Verify it's running:**
```powershell
docker ps
```

**Wait 5 seconds for initialization, then test:**
```powershell
docker exec product-ledger-db psql -U productledger -d product_ledger_users -c "SELECT version();"
```

### Option 2: Use Default PostgreSQL User

If you have local PostgreSQL installed, update `server/.env`:

**Change DATABASE_URL to:**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/product_ledger_users
```

Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

### Option 3: Create User in Existing Database

If database exists but user doesn't:

```powershell
# Connect to PostgreSQL
docker exec -it product-ledger-db psql -U postgres

# Then run these SQL commands:
CREATE USER productledger WITH PASSWORD 'productledger123';
CREATE DATABASE product_ledger_users OWNER productledger;
GRANT ALL PRIVILEGES ON DATABASE product_ledger_users TO productledger;
\q
```

## Verify Connection

After fixing, test the connection:

```powershell
# Test from command line
docker exec product-ledger-db psql -U productledger -d product_ledger_users -c "SELECT 1;"
```

Should return: `?column?` with value `1`

## Restart Backend

After fixing database:

```powershell
cd server
npm run dev
```

Should now see:
```
✅ Database connection established
✅ Database schema initialized
```

