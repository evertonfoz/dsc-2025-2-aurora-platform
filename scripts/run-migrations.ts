import { AppDataSource } from '../src/database/data-source';

async function main() {
  await AppDataSource.initialize();
  console.log('[migrations] connected');
  const res = await AppDataSource.runMigrations({ transaction: 'all' });
  for (const m of res) console.log('[migrations] applied:', m.name);
  await AppDataSource.destroy();
  console.log('[migrations] done');
}
main().catch(async (e) => {
  console.error('[migrations] error:', e);
  try { await AppDataSource.destroy(); } catch {}
  process.exit(1);
});
