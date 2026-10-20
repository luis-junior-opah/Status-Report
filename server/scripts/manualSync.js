const syncScheduler = require('../services/syncScheduler');

async function main() {
  console.log('[ManualSync] Executando sincronização manual com o Azure DevOps...');
  const result = await syncScheduler.runSync();
  console.log('[ManualSync] Resultado:', result);
  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error('[ManualSync] Erro fatal:', err);
  process.exit(1);
});
