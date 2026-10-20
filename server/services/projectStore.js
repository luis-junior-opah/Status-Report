const fs = require('fs');
const path = require('path');
const config = require('../config');

const STORE_PATH = path.join(__dirname, '../data/projects.json');
const CLIENTS_PATH = path.join(__dirname, '../data/clients.json');

const OFFICIAL_EAP_PHASES = [
  'Planejamento',
  'Desenvolvimento',
  'Homologação',
  'Treinamento',
  'Operação Assistida'
];

const DEFAULT_CLIENTS = [
  {
    name: 'ILC (Interno)',
    slug: 'ilc',
    logoUrl: '/assets/ilc-logo.png',
    token: 'ilc-interno-2026',
    description: 'Projetos corporativos ILC'
  },
  {
    name: 'Mirassol',
    slug: 'mirassol',
    logoUrl: 'https://mirassol.ind.br/wp-content/themes/mirassol/assets/images/logo.png',
    token: 'mirassol-acesso-2026',
    description: 'Demandas e tecnologia Mirassol'
  },
  {
    name: 'John Deere',
    slug: 'john-deere',
    logoUrl: 'https://www.deere.com.br/assets/images/common/logo-john-deere-black.svg',
    token: 'jd-acesso-2026',
    description: 'Projetos integrados John Deere'
  },
  {
    name: 'Petrobras',
    slug: 'petrobras',
    logoUrl: 'https://petrobras.com.br/themes/custom/petrobras_theme/logo.svg',
    token: 'petrobras-acesso-2026',
    description: 'Iniciativas logísticas Petrobras'
  },
  {
    name: 'Boge Ruber',
    slug: 'boge-ruber',
    logoUrl: 'https://www.boge-rubber-plastics.com/fileadmin/templates/images/logo.svg',
    token: 'boge-acesso-2026',
    description: 'Projetos e integrações Boge Rubber & Plastics'
  }
];

class ProjectStore {
  constructor() {
    this.projects = [];
    this.clients = DEFAULT_CLIENTS;
    this.lastSync = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(CLIENTS_PATH)) {
        this.clients = JSON.parse(fs.readFileSync(CLIENTS_PATH, 'utf8'));
      } else {
        this.saveClients();
      }

      if (fs.existsSync(STORE_PATH)) {
        const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
        this.projects = (data.projects || []).map(p => {
          if (!p.priority) p.priority = 'P2';
          if (!p.systems) p.systems = [];
          if (!p.team) {
            const uniqueAssigned = Array.from(new Set((p.activities || []).map(a => a.assignedTo).filter(Boolean)));
            p.team = {
              leader: uniqueAssigned[0] || '',
              members: uniqueAssigned
            };
          }
          return p;
        });
        this.lastSync = data.lastSync || null;
      }
    } catch (err) {
      console.error('Error loading store:', err);
    }
  }

  save() {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(STORE_PATH, JSON.stringify({
        lastSync: this.lastSync,
        projects: this.projects
      }, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving projects.json:', err);
    }
  }

  saveClients() {
    try {
      const dir = path.dirname(CLIENTS_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CLIENTS_PATH, JSON.stringify(this.clients, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving clients.json:', err);
    }
  }

  mapClientName(rawName) {
    if (!rawName) return 'ILC (Interno)';
    const upper = rawName.toUpperCase();
    if (upper.includes('JOHN DEERE')) return 'John Deere';
    if (upper.includes('PETROBRAS')) return 'Petrobras';
    if (upper.includes('BOGE')) return 'Boge Ruber';
    if (upper.includes('MIRASSOL')) return 'Mirassol';
    if (upper.includes('ILC') || upper.includes('SMART') || upper.includes('INTEGRATOR')) return 'ILC (Interno)';
    return 'Mirassol';
  }

  calculateVariance(agreedEnd, executedEnd, plannedEnd) {
    const targetEnd = executedEnd || plannedEnd || agreedEnd;
    if (!agreedEnd || !targetEnd) return 0;
    const agreedDate = new Date(agreedEnd);
    const actualDate = new Date(targetEnd);
    const diffTime = actualDate.getTime() - agreedDate.getTime();
    return Math.round(diffTime / (1000 * 3600 * 24));
  }

  calculateRagStatus(project) {
    if (project.manualRagStatus && project.manualRagStatus !== 'auto') {
      return project.manualRagStatus;
    }
    if (project.status === 'Congelado') return 'amber';
    if (project.status === 'Finalizado') return 'green';

    const activities = project.activities || [];
    const hasDelayedActivity = activities.some(a => a.isDelayed && a.status !== 'completed');

    const variance = this.calculateVariance(
      project.agreedDates?.end,
      project.executedDates?.end,
      project.plannedDates?.end
    );

    if (variance > 7 || hasDelayedActivity) return 'red';
    if (variance > 0) return 'amber';
    return 'green';
  }

  // Detects data inconsistencies for executive visibility
  computeInconsistencies(project) {
    const list = [];
    const activities = project.activities || [];

    // 1. Sem itens do Azure
    if (!project.isManual && activities.length === 0) {
      list.push('NO_AZURE_ITEMS');
    }

    // 2. Sem horas cadastradas
    const h = project.hours || {};
    if ((Number(h.totalPlanned) || 0) === 0) {
      list.push('NO_HOURS');
    }

    // 3. Sem datas cadastradas no projeto
    if (!project.agreedDates?.start || !project.agreedDates?.end) {
      list.push('NO_DATES');
    }

    // 4. Entregas atrasadas
    if (activities.some(a => a.isDelayed)) {
      list.push('DELAYED_ITEMS');
    }

    // 5. Atividades sem datas de início/fim
    if (activities.length > 0 && !activities.some(a => a.startDate || a.targetDate)) {
      list.push('NO_ACTIVITIES_WITH_DATES');
    }

    return list;
  }

  // Calculates hours breakdown - Option B: Client hours edited in Curator, ILC hours from Tasks or Curator
  // ZERO mock: If project has no activities and no manual hours, planned hours remain 0!
  calculateHours(project) {
    const activities = project.activities || [];
    let ilcExecuted = 0;
    let ilcPlanned = 0;

    // Client hours managed via Option B (Curator)
    const clientPlanned = Number(project.hours?.clientPlanned) || 0;
    const clientExecuted = Number(project.hours?.clientExecuted) || 0;

    const distribution = {
      'Planejamento': { planned: 0, executed: 0 },
      'Desenvolvimento': { planned: 0, executed: 0 },
      'Homologação': { planned: 0, executed: 0 },
      'Treinamento': { planned: 0, executed: 0 },
      'Operação Assistida': { planned: 0, executed: 0 }
    };

    for (const act of activities) {
      const exec = Number(act.ilcHours) || 0;
      const plan = Number(act.ilcHoursTotal) || exec;
      ilcExecuted += exec;
      ilcPlanned += plan;

      if (distribution[act.eapPhase]) {
        distribution[act.eapPhase].executed += exec;
        distribution[act.eapPhase].planned += plan;
      }
    }

    // If manual override for ILC hours was explicitly set in Curator AND the field is unlocked
    if (project.lockedFields?.ilcHours === false && project.hasManualIlcHours && project.hours?.ilcPlanned !== undefined) {
      ilcPlanned = Number(project.hours.ilcPlanned) || 0;
      ilcExecuted = Number(project.hours.ilcExecuted) || 0;
    } else if (ilcPlanned === 0 && ilcExecuted === 0) {
      // If activities don't have individual rolled-up hours, fallback to project-level task hours
      if (project.azureOriginal?.ilcPlanned || project.azureOriginal?.ilcExecuted) {
        ilcPlanned = project.azureOriginal.ilcPlanned;
        ilcExecuted = project.azureOriginal.ilcExecuted;
      } else if (project.hours?.ilcPlanned || project.hours?.ilcExecuted) {
        ilcPlanned = Number(project.hours.ilcPlanned) || 0;
        ilcExecuted = Number(project.hours.ilcExecuted) || 0;
      }
    }

    const totalPlanned = ilcPlanned + clientPlanned;
    const totalExecuted = ilcExecuted + clientExecuted;

    return {
      clientPlanned,
      clientExecuted,
      ilcPlanned,
      ilcExecuted,
      totalPlanned,
      totalExecuted,
      distribution: Object.entries(distribution).map(([phase, data]) => ({
        phase,
        planned: data.planned,
        executed: data.executed,
        percentage: data.planned > 0 ? Math.min(100, Math.round((data.executed / data.planned) * 100)) : 0
      }))
    };
  }

  mergeAzureProjects(azureProjectSummaries) {
    this.lastSync = new Date().toISOString();

    for (const azure of azureProjectSummaries) {
      const existing = this.projects.find(p => p.azureId === azure.azureId);

      const client = this.mapClientName(azure.name);
      const defaultPlannedStart = azure.detectedStartDate || '2026-08-01';
      const defaultPlannedEnd = azure.detectedFinishDate || '2027-01-31';

      // ZERO MOCK: Strictly real activities from Azure DevOps
      const realActivities = azure.activities || [];

      if (!existing) {
        const newProj = {
          id: azure.azureId,
          azureId: azure.azureId,
          isManual: false,
          name: azure.name,
          description: azure.description,
          client: client,
          status: 'Ativo',
          isVisible: true,
          currentMilestone: 'Desenvolvimento',
          agreedDates: {
            start: defaultPlannedStart,
            end: defaultPlannedEnd
          },
          plannedDates: {
            start: defaultPlannedStart,
            end: defaultPlannedEnd
          },
          executedDates: {
            start: defaultPlannedStart,
            end: null
          },
          progress: azure.progress || 0,
          manualRagStatus: 'auto',
          executiveSummary: `Projeto sincronizado com o Azure DevOps. Iteração: ${azure.currentIterationName || 'Em andamento'}.`,
          azureLastUpdated: azure.azureLastUpdated,
          currentIterationName: azure.currentIterationName,
          activities: realActivities,
          priority: 'P2',
          systems: [],
          team: {
            leader: realActivities.find(a => a.assignedTo)?.assignedTo || '',
            members: Array.from(new Set(realActivities.map(a => a.assignedTo).filter(Boolean)))
          },
          lockedFields: {
            ilcHours: true,
            progress: true,
            dates: true
          },
          azureOriginal: {
            ilcPlanned: azure.taskHours?.totalPlanned || 0,
            ilcExecuted: azure.taskHours?.totalExecuted || 0,
            progress: azure.progress || 0,
            agreedDates: { start: defaultPlannedStart, end: defaultPlannedEnd },
            plannedDates: { start: defaultPlannedStart, end: defaultPlannedEnd }
          },
          hours: {
            clientPlanned: 0,
            clientExecuted: 0,
            ilcPlanned: azure.taskHours?.totalPlanned || 0,
            ilcExecuted: azure.taskHours?.totalExecuted || 0
          }
        };
        newProj.hours = this.calculateHours(newProj);
        newProj.ragStatus = this.calculateRagStatus(newProj);
        newProj.varianceDays = this.calculateVariance(newProj.agreedDates.end, newProj.executedDates?.end, newProj.plannedDates?.end);
        newProj.inconsistencies = this.computeInconsistencies(newProj);
        this.projects.push(newProj);
      } else {
        existing.name = azure.name;
        existing.description = azure.description || existing.description;
        existing.azureLastUpdated = azure.azureLastUpdated;
        existing.currentIterationName = azure.currentIterationName || existing.currentIterationName;

        // Preserve user edited EAP phases on activities if explicitly modified in curator
        if (azure.activities?.length > 0) {
          existing.activities = azure.activities.map(act => {
            const savedAct = (existing.activities || []).find(a => a.id === act.id);
            if (savedAct && savedAct.hasManualEapPhase) {
              return { ...act, eapPhase: savedAct.eapPhase, hasManualEapPhase: true };
            }
            return act;
          });
        } else if (!existing.isManual) {
          // If 0 items in Azure, clear any previous mock data!
          existing.activities = [];
        }

        if (!existing.priority) existing.priority = 'P2';
        if (!existing.systems) existing.systems = [];
        if (!existing.team) {
          existing.team = { leader: '', members: [] };
        }
        if ((!existing.team.members || existing.team.members.length === 0) && azure.activities?.length > 0) {
          const uniqueAssigned = Array.from(new Set(azure.activities.map(a => a.assignedTo).filter(Boolean)));
          existing.team.members = uniqueAssigned;
          if (!existing.team.leader && uniqueAssigned.length > 0) {
            existing.team.leader = uniqueAssigned[0];
          }
        }

        // Store latest Azure original data for quick restoration
        const aStart = azure.detectedStartDate || defaultPlannedStart;
        const aEnd = azure.detectedFinishDate || defaultPlannedEnd;
        existing.azureOriginal = {
          ilcPlanned: azure.taskHours?.totalPlanned || 0,
          ilcExecuted: azure.taskHours?.totalExecuted || 0,
          progress: azure.progress || 0,
          agreedDates: { start: aStart, end: aEnd },
          plannedDates: { start: aStart, end: aEnd }
        };

        if (!existing.lockedFields) {
          existing.lockedFields = { ilcHours: true, progress: true, dates: true };
        }

        // Overwrite hours from Azure if field is locked to Azure
        if (existing.lockedFields.ilcHours !== false) {
          existing.hours.ilcPlanned = azure.taskHours?.totalPlanned || 0;
          existing.hours.ilcExecuted = azure.taskHours?.totalExecuted || 0;
          existing.hasManualIlcHours = false;
        }

        // Overwrite progress from Azure if field is locked to Azure
        if (existing.lockedFields.progress !== false) {
          existing.progress = azure.progress !== undefined ? azure.progress : (existing.progress || 0);
          existing.hasManualProgress = false;
        }

        if (azure.currentMilestone) {
          existing.currentMilestone = azure.currentMilestone;
        }

        // Only overwrite dates if locked and Azure provided valid dates
        if (existing.lockedFields.dates !== false && (azure.detectedStartDate || azure.detectedFinishDate)) {
          if (azure.detectedStartDate) {
            existing.plannedDates.start = azure.detectedStartDate;
            if (!existing.hasManualAgreedDates) {
              existing.agreedDates.start = azure.detectedStartDate;
            }
          }
          if (azure.detectedFinishDate) {
            existing.plannedDates.end = azure.detectedFinishDate;
            if (!existing.hasManualAgreedDates) {
              existing.agreedDates.end = azure.detectedFinishDate;
            }
          }
        }

        existing.hours = this.calculateHours(existing);
        existing.ragStatus = this.calculateRagStatus(existing);
        existing.varianceDays = this.calculateVariance(existing.agreedDates?.end, existing.executedDates?.end, existing.plannedDates?.end);
        existing.inconsistencies = this.computeInconsistencies(existing);
      }
    }

    this.save();
    return this.projects;
  }

  createManualProject(data) {
    const id = 'manual-' + Date.now();
    const client = this.mapClientName(data.client);
    const start = data.agreedDates?.start || new Date().toISOString().split('T')[0];
    const end = data.agreedDates?.end || '2027-02-28';

    const newProj = {
      id,
      azureId: null,
      isManual: true,
      name: data.name,
      description: data.description || 'Projeto cadastrado manualmente.',
      client,
      status: data.status || 'Ativo',
      isVisible: data.isVisible !== false,
      currentMilestone: data.currentMilestone || 'Planejamento',
      agreedDates: { start, end },
      plannedDates: {
        start: data.plannedDates?.start || start,
        end: data.plannedDates?.end || end
      },
      executedDates: { start, end: null },
      progress: Number(data.progress) || 0,
      manualRagStatus: data.manualRagStatus || 'auto',
      executiveSummary: data.executiveSummary || 'Projeto cadastrado manualmente.',
      activities: data.activities || [],
      priority: data.priority || 'P2',
      systems: Array.isArray(data.systems) ? data.systems : [],
      team: data.team || { leader: '', members: [] },
      lockedFields: {
        ilcHours: false,
        progress: false,
        dates: false
      },
      hours: {
        clientPlanned: Number(data.hours?.clientPlanned) || 0,
        clientExecuted: Number(data.hours?.clientExecuted) || 0,
        ilcPlanned: Number(data.hours?.ilcPlanned) || 0,
        ilcExecuted: Number(data.hours?.ilcExecuted) || 0
      }
    };

    newProj.hours = this.calculateHours(newProj);
    newProj.ragStatus = this.calculateRagStatus(newProj);
    newProj.varianceDays = this.calculateVariance(newProj.agreedDates.end, newProj.executedDates?.end, newProj.plannedDates?.end);
    newProj.inconsistencies = this.computeInconsistencies(newProj);

    this.projects.push(newProj);
    this.save();
    return newProj;
  }

  compareProjects(a, b) {
    const clientDiff = (a.client || '').localeCompare(b.client || '', 'pt-BR', { sensitivity: 'base' });
    if (clientDiff !== 0) return clientDiff;
    return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
  }

  getPublicProjects(filterClient = null) {
    let list = this.projects.filter(p => p.isVisible);
    if (filterClient && filterClient !== 'Todos') {
      list = list.filter(p => p.client.toLowerCase() === filterClient.toLowerCase());
    }
    return list
      .map(p => ({
        ...p,
        hours: this.calculateHours(p),
        ragStatus: this.calculateRagStatus(p),
        varianceDays: this.calculateVariance(p.agreedDates?.end, p.executedDates?.end, p.plannedDates?.end),
        inconsistencies: this.computeInconsistencies(p),
        lockedFields: p.lockedFields || { ilcHours: true, progress: true, dates: true }
      }))
      .sort((a, b) => this.compareProjects(a, b));
  }

  getAllProjects() {
    return this.projects
      .map(p => ({
        ...p,
        hours: this.calculateHours(p),
        ragStatus: this.calculateRagStatus(p),
        varianceDays: this.calculateVariance(p.agreedDates?.end, p.executedDates?.end, p.plannedDates?.end),
        inconsistencies: this.computeInconsistencies(p),
        lockedFields: p.lockedFields || { ilcHours: true, progress: true, dates: true }
      }))
      .sort((a, b) => this.compareProjects(a, b));
  }

  getClients() {
    return this.clients;
  }

  getClientBySlug(slug) {
    return this.clients.find(c => c.slug.toLowerCase() === slug.toLowerCase()) || null;
  }

  getClientLogo(clientName) {
    if (!clientName) return null;
    const client = this.clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    return client?.logoUrl || null;
  }

  updateClient(slug, updates) {
    const idx = this.clients.findIndex(c => c.slug.toLowerCase() === slug.toLowerCase());
    if (idx === -1) return null;
    this.clients[idx] = { ...this.clients[idx], ...updates };
    this.saveClients();
    return this.clients[idx];
  }

  // Save client logo from image base64
  saveClientLogo(slug, imageBase64) {
    const client = this.getClientBySlug(slug);
    if (!client) throw new Error('Cliente não encontrado');
    if (!imageBase64) throw new Error('Dados da imagem inválidos');

    const publicDir = path.join(__dirname, '../public/assets/logos');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${client.slug}.png`;
    const filePath = path.join(publicDir, fileName);
    fs.writeFileSync(filePath, buffer);

    try {
      const fePublic = path.join(__dirname, '../../frontend/public/assets/logos');
      if (!fs.existsSync(fePublic)) fs.mkdirSync(fePublic, { recursive: true });
      fs.writeFileSync(path.join(fePublic, fileName), buffer);

      const feDist = path.join(__dirname, '../../frontend/dist/frontend/browser/assets/logos');
      if (fs.existsSync(path.dirname(feDist))) {
        if (!fs.existsSync(feDist)) fs.mkdirSync(feDist, { recursive: true });
        fs.writeFileSync(path.join(feDist, fileName), buffer);
      }
    } catch (e) {
      console.warn('Could not copy logo to frontend public:', e.message);
    }

    const logoUrl = `/assets/logos/${fileName}?t=${Date.now()}`;
    return this.updateClient(slug, { logoUrl });
  }

  // Azure DevOps PAT status and countdown
  getAzureStatus() {
    const orgUrl = config.azureDevOps.orgUrl;
    const pat = config.azureDevOps.pat || '';
    const maskedPat = pat.length > 8 ? `${pat.slice(0, 4)}...${pat.slice(-4)}` : '****';
    const expirationDate = '2027-10-01'; // Official expiration date

    const expTime = new Date('2027-10-01T23:59:59Z').getTime();
    const nowTime = Date.now();
    const diffMs = expTime - nowTime;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 3600 * 24)));
    const monthsRemaining = Math.max(0, Math.floor(daysRemaining / 30.4));

    return {
      orgUrl,
      patMasked: maskedPat,
      expirationDate,
      daysRemaining,
      monthsRemaining,
      isExpired: daysRemaining <= 0,
      isWarning: daysRemaining <= 60,
      isConnected: true
    };
  }

  // Update Azure PAT token
  updateAzurePat(newPat) {
    if (!newPat || typeof newPat !== 'string') throw new Error('PAT inválido');
    const trimmed = newPat.trim();
    config.azureDevOps.pat = trimmed;

    // Update in azureDevOpsService instance
    const azureService = require('./azureDevOpsService');
    azureService.setPat(trimmed);

    // Persist to .env
    try {
      const envPath = path.join(__dirname, '../.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      if (envContent.includes('AZURE_DEVOPS_PAT=')) {
        envContent = envContent.replace(/AZURE_DEVOPS_PAT=.*/g, `AZURE_DEVOPS_PAT=${trimmed}`);
      } else {
        envContent += `\nAZURE_DEVOPS_PAT=${trimmed}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (e) {
      console.warn('Could not update .env file:', e.message);
    }

    return this.getAzureStatus();
  }

  // STRICT STATS: Health metrics (onTrack, warning, delayed) ONLY count ACTIVE projects!
  // Frozen and Completed projects do NOT pollute warning/onTrack/delayed.
  getStats(filterClient = null) {
    const publicList = this.getPublicProjects(filterClient);
    const total = publicList.length;

    const activeProjects = publicList.filter(p => p.status === 'Ativo');
    const active = activeProjects.length;
    const completed = publicList.filter(p => p.status === 'Finalizado').length;
    const frozen = publicList.filter(p => p.status === 'Congelado').length;

    // Strict health status on Active projects only
    const onTrack = activeProjects.filter(p => p.ragStatus === 'green').length;
    const warning = activeProjects.filter(p => p.ragStatus === 'amber').length;
    const delayed = activeProjects.filter(p => p.ragStatus === 'red').length;

    let totalPlannedHours = 0;
    let totalExecutedHours = 0;
    let clientPlannedHours = 0;
    let clientExecutedHours = 0;
    let ilcPlannedHours = 0;
    let ilcExecutedHours = 0;

    for (const p of publicList) {
      const h = p.hours || this.calculateHours(p);
      totalPlannedHours += h.totalPlanned || 0;
      totalExecutedHours += h.totalExecuted || 0;
      clientPlannedHours += h.clientPlanned || 0;
      clientExecutedHours += h.clientExecuted || 0;
      ilcPlannedHours += h.ilcPlanned || 0;
      ilcExecutedHours += h.ilcExecuted || 0;
    }

    return {
      total,
      active,
      completed,
      frozen,
      onTrack,
      warning,
      delayed,
      lastSync: this.lastSync,
      milestones: OFFICIAL_EAP_PHASES,
      hoursSummary: {
        totalPlanned: totalPlannedHours,
        totalExecuted: totalExecutedHours,
        clientPlanned: clientPlannedHours,
        clientExecuted: clientExecutedHours,
        ilcPlanned: ilcPlannedHours,
        ilcExecuted: ilcExecutedHours
      }
    };
  }

  updateProject(id, updates) {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    const proj = this.projects[index];

    // Handle restoration of Azure values
    if (updates.restoreAzureValues && proj.azureOriginal) {
      proj.hours.ilcPlanned = proj.azureOriginal.ilcPlanned;
      proj.hours.ilcExecuted = proj.azureOriginal.ilcExecuted;
      proj.progress = proj.azureOriginal.progress;
      proj.agreedDates = { ...proj.azureOriginal.agreedDates };
      proj.plannedDates = { ...proj.azureOriginal.plannedDates };
      proj.hasManualIlcHours = false;
      proj.hasManualProgress = false;
      proj.hasManualAgreedDates = false;
      proj.lockedFields = { ilcHours: true, progress: true, dates: true };
    }

    if (updates.lockedFields) {
      proj.lockedFields = {
        ...proj.lockedFields,
        ...updates.lockedFields
      };
      if (updates.lockedFields.progress === true) {
        proj.hasManualProgress = false;
        if (proj.azureOriginal?.progress !== undefined) {
          proj.progress = proj.azureOriginal.progress;
        }
      }
      if (updates.lockedFields.ilcHours === true) {
        proj.hasManualIlcHours = false;
        if (proj.azureOriginal?.ilcPlanned !== undefined) {
          proj.hours.ilcPlanned = proj.azureOriginal.ilcPlanned;
          proj.hours.ilcExecuted = proj.azureOriginal.ilcExecuted;
        }
      }
      if (updates.lockedFields.dates === true) {
        proj.hasManualAgreedDates = false;
        if (proj.azureOriginal?.agreedDates) {
          proj.agreedDates = { ...proj.azureOriginal.agreedDates };
        }
        if (proj.azureOriginal?.plannedDates) {
          proj.plannedDates = { ...proj.azureOriginal.plannedDates };
        }
      }
    }

    if (updates.name !== undefined && updates.name.trim()) proj.name = updates.name.trim();
    if (updates.description !== undefined) proj.description = updates.description;
    if (updates.client !== undefined) proj.client = this.mapClientName(updates.client);
    if (updates.status !== undefined) proj.status = updates.status;
    if (updates.isVisible !== undefined) proj.isVisible = !!updates.isVisible;
    if (updates.currentMilestone !== undefined) proj.currentMilestone = updates.currentMilestone;
    if (updates.manualRagStatus !== undefined) proj.manualRagStatus = updates.manualRagStatus;
    if (updates.executiveSummary !== undefined) proj.executiveSummary = updates.executiveSummary;
    if (updates.progress !== undefined) {
      proj.progress = Number(updates.progress);
      if (proj.lockedFields?.progress === false) {
        proj.hasManualProgress = true;
      }
    }

    if (updates.agreedDates) {
      proj.agreedDates = {
        start: updates.agreedDates.start || proj.agreedDates.start,
        end: updates.agreedDates.end || proj.agreedDates.end
      };
      if (proj.lockedFields?.dates === false) {
        proj.hasManualAgreedDates = true;
      }
    }

    if (updates.plannedDates) {
      proj.plannedDates = {
        start: updates.plannedDates.start || proj.plannedDates.start,
        end: updates.plannedDates.end || proj.plannedDates.end
      };
    }

    if (updates.hours) {
      proj.hours = {
        ...proj.hours,
        clientPlanned: Number(updates.hours.clientPlanned) || 0,
        clientExecuted: Number(updates.hours.clientExecuted) || 0,
        ilcPlanned: Number(updates.hours.ilcPlanned) || proj.hours.ilcPlanned,
        ilcExecuted: Number(updates.hours.ilcExecuted) || proj.hours.ilcExecuted
      };
      proj.hasManualIlcHours = true;
    }

    if (updates.activities) {
      proj.activities = updates.activities;
    }

    if (updates.priority !== undefined) proj.priority = updates.priority;
    if (updates.systems !== undefined) proj.systems = Array.isArray(updates.systems) ? updates.systems : [];
    if (updates.team !== undefined) {
      proj.team = {
        leader: updates.team.leader !== undefined ? updates.team.leader : (proj.team?.leader || ''),
        members: Array.isArray(updates.team.members) ? updates.team.members : (proj.team?.members || [])
      };
    }

    proj.hours = this.calculateHours(proj);
    proj.ragStatus = this.calculateRagStatus(proj);
    proj.varianceDays = this.calculateVariance(proj.agreedDates?.end, proj.executedDates?.end, proj.plannedDates?.end);
    proj.inconsistencies = this.computeInconsistencies(proj);

    this.projects[index] = proj;
    this.save();
    return proj;
  }

  deleteProject(id) {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    const deleted = this.projects.splice(index, 1)[0];
    this.save();
    return deleted;
  }
}

module.exports = new ProjectStore();
