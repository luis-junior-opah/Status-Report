const config = require('../config');
const azureDevOpsService = require('./azureDevOpsService');
const projectStore = require('./projectStore');

class SyncScheduler {
  constructor() {
    this.isSyncing = false;
    this.timer = null;
  }

  async runSync() {
    if (this.isSyncing) {
      console.log('[SyncScheduler] Sincronização já em andamento. Aguardando...');
      return { success: false, message: 'Sincronização em andamento' };
    }

    this.isSyncing = true;
    console.log('[SyncScheduler] Iniciando sincronização com Azure DevOps...');
    try {
      const rawProjects = await azureDevOpsService.getAllProjects();
      console.log(`[SyncScheduler] Encontrados ${rawProjects.length} projetos no Azure DevOps.`);

      const summaries = [];
      for (const p of rawProjects) {
        try {
          const summary = await azureDevOpsService.getProjectDetails(p);
          summaries.push(summary);
        } catch (itemErr) {
          console.error(`[SyncScheduler] Erro ao extrair detalhes do projeto ${p.name}:`, itemErr.message);
          summaries.push({
            azureId: p.id,
            name: p.name,
            description: p.description || '',
            detectedStartDate: null,
            detectedFinishDate: null,
            currentIterationName: null,
            iterationsCount: 0,
            progress: 0,
            activities: [],
            taskHours: { totalPlanned: 0, totalExecuted: 0 },
            azureLastUpdated: new Date().toISOString()
          });
        }
      }

      const merged = projectStore.mergeAzureProjects(summaries);
      try {
        const weeklyReportStore = require('./weeklyReportStore');
        weeklyReportStore.syncAllReportsWithProjects();
      } catch (wErr) {
        console.error('[SyncScheduler] Erro ao sincronizar relatórios semanais:', wErr.message);
      }
      console.log(`[SyncScheduler] Sincronização concluída com sucesso! Total de projetos no store: ${merged.length}`);
      return { success: true, count: merged.length, lastSync: projectStore.lastSync };
    } catch (err) {
      console.error('[SyncScheduler] Falha na sincronização:', err);
      return { success: false, error: err.message };
    } finally {
      this.isSyncing = false;
    }
  }

  start() {
    // Initial sync
    this.runSync().catch(console.error);

    // Periodic sync
    const intervalMs = config.syncIntervalMinutes * 60 * 1000;
    this.timer = setInterval(() => {
      this.runSync().catch(console.error);
    }, intervalMs);
    console.log(`[SyncScheduler] Agendador ativo: sincronização a cada ${config.syncIntervalMinutes} minutos.`);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}

module.exports = new SyncScheduler();
