import ds from '../src/database/data-source';

async function main() {
  await ds.initialize();
  console.log('[migrations] connected');
  const res = await ds.runMigrations({ transaction: 'all' });
  for (const m of res) console.log('[migrations] applied:', m.name);
  await ds.destroy();
  console.log('[migrations] done');
}
main().catch(async (e) => {
  console.error('[migrations] error:', e);
  try { await ds.destroy(); } catch {}
  process.exit(1);
});
