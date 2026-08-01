const { createClient } = require('@supabase/supabase-js');

// Credentials come from .env.local, never from source. The service-role/secret key
// bypasses RLS entirely — hardcoding it put the skeleton key into git history.
const { readFileSync } = require('fs');
const { join } = require('path');
const env = {};
try {
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
  });
} catch { /* ok */ }

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  for (const t of ['KJV', 'BSB', 'ASV', 'YLT', 'WEB']) {
    const { count } = await supabase
      .from('verses')
      .select('*', { count: 'exact', head: true })
      .eq('translation', t);
    console.log(`${t}: ${count ?? 0} rows`);
  }
}

check();
