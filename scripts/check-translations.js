const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gfswworikmaneujvcnrc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmc3d3b3Jpa21hbmV1anZjbnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MDcxMCwiZXhwIjoyMDkxMTU2NzEwfQ.SojrBXlel2RgnEG4Yxa-77RVWDM6iuzP9AZxTxt5_4w'
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
