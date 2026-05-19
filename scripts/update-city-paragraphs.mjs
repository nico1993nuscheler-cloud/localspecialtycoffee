import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually (inject-city.mjs style)
const raw = fs.readFileSync('.env.local', 'utf8');
for (const line of raw.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m) {
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1,-1);
    process.env[m[1]] = v;
  }
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const pkg = JSON.parse(fs.readFileSync('data/.tmp/city-paragraph-rewrites.json', 'utf8'));
const dryRun = process.argv.includes('--dry-run');

console.log(`${dryRun ? '[DRY-RUN] ' : ''}Updating seo_paragraph for ${pkg.cities.length} cities`);
console.log();

for (const c of pkg.cities) {
  // Fetch current for word count comparison
  const { data: current, error: ge } = await sb.from('lsc_cities').select('id,name,seo_paragraph').eq('slug', c.slug).single();
  if (ge || !current) { console.log(`  SKIP ${c.slug}: ${ge?.message ?? 'not found'}`); continue; }

  const newWords = c.seo_paragraph.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const oldWords = (current.seo_paragraph || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  console.log(`  ${current.name.padEnd(20)} ${oldWords.toString().padStart(3)}w → ${newWords.toString().padStart(3)}w`);

  if (!dryRun) {
    const { error: ue } = await sb.from('lsc_cities').update({ seo_paragraph: c.seo_paragraph }).eq('id', current.id);
    if (ue) { console.log(`    ❌ UPDATE FAILED: ${ue.message}`); continue; }
    console.log(`    ✓ updated`);
  }
}

console.log();
console.log(dryRun ? '[DRY-RUN] No writes performed.' : '✓ Done. Empty-commit redeploy required to flush edge cache.');
