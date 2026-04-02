/**
 * One-off admin bootstrap script (Supabase only)
 *
 * Usage (from server/):
 *   Bash/WSL:  ADMIN_EMAIL="x@y.com" ADMIN_PASSWORD="***" npx tsx scripts/create-admin.ts
 *   PowerShell: $env:ADMIN_EMAIL="x@y.com"; $env:ADMIN_PASSWORD="***"; npx tsx scripts/create-admin.ts
 *   Or add ADMIN_EMAIL + ADMIN_PASSWORD to server/.env and run: npx tsx scripts/create-admin.ts
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getSupabase } from '../src/lib/supabase.js';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password || password === '(your password)') {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD.');
  console.error('PowerShell: $env:ADMIN_EMAIL="you@email.com"; $env:ADMIN_PASSWORD="YourPass"; npx tsx scripts/create-admin.ts');
  process.exit(1);
}

const supabase = getSupabase();

async function main() {
  // Try create; if already exists, we’ll just upgrade profile/role.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  });

  let userId: string | undefined = data.user?.id;

  if (error) {
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;
    const users = listData?.users ?? [];
    const existing = users.find((u: { email?: string }) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (!existing?.id) throw error;
    userId = existing.id;
  }

  if (!userId) throw new Error('Unable to determine user id for admin.');

  // Ensure profile flags are correct
  await (supabase as any)
    .from('profiles')
    .update({
      approved: true,
      approval_status: 'approved',
      rejection_reason: null,
    })
    .eq('id', userId);

  // Ensure role exists
  await (supabase as any)
    .from('user_roles')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

  console.log(`✅ Admin ready: ${email}`);
}

main().catch((e) => {
  console.error('❌ Failed to create/upgrade admin:', e?.message || e);
  process.exit(1);
});

