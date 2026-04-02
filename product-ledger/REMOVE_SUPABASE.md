# Removing Supabase - Complete Migration

## Files to Update

1. ✅ `src/contexts/AuthContext.tsx` - Already updated
2. ✅ `src/services/api/fabric-api.ts` - Already updated  
3. ❌ `src/hooks/useAdminUsers.ts` - Needs update
4. ❌ `src/hooks/useRetailerData.ts` - Needs update
5. ❌ `src/components/admin/CreateAdminDialog.tsx` - Needs update
6. ❌ `src/components/retailer/HashLookup.tsx` - Needs update

## Supabase Files to Delete

- `src/integrations/supabase/` - Entire folder
- `supabase/` - Entire folder (migrations no longer needed)

## Package to Remove

- `@supabase/supabase-js` from package.json

