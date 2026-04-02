# Fix Database Connection String

## Current Issue
The database container is running and accessible, but the backend can't connect.

## Solution

### Check Your server/.env File

Make sure your `DATABASE_URL` in `server/.env` is exactly:

```env
DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
```

**Important:**
- No spaces around the `=`
- Use `postgresql://` (not `postgres://`)
- Password is: `productledger123`
- Database name: `product_ledger_users`

### Alternative: Use Docker Host

If connecting from Windows to Docker, try:

```env
DATABASE_URL=postgresql://productledger:productledger123@127.0.0.1:5432/product_ledger_users
```

Or if using Docker Desktop's special hostname:

```env
DATABASE_URL=postgresql://productledger:productledger123@host.docker.internal:5432/product_ledger_users
```

### Test Connection Manually

```powershell
# Test if you can connect
docker exec product-ledger-db psql -U productledger -d product_ledger_users -c "SELECT current_database();"
```

If this works, the database is fine - the issue is the connection string format.

### After Fixing

1. Save the `.env` file
2. Restart the backend server (Ctrl+C, then `npm run dev` again)

