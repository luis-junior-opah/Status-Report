const config = require('../config');

const OFFICIAL_EAP_PHASES = [
  'Planejamento',
  'Desenvolvimento',
  'Homologação',
  'Treinamento',
  'Operação Assistida'
];

class AzureDevOpsService {
  constructor() {
    this.orgUrl = config.azureDevOps.orgUrl.replace(/\/+$/, '');
    this.authHeader = 'Basic ' + Buffer.from(':' + config.azureDevOps.pat).toString('base64');
  }

  setPat(newPat) {
    config.azureDevOps.pat = newPat;
    this.authHeader = 'Basic ' + Buffer.from(':' + newPat).toString('base64');
  }

  async testConnection() {
    try {
      const data = await this.getAllProjects();
      return { success: true, projectCount: data.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async fetchApi(endpoint, options = {}) {
    const url = `${this.orgUrl}/${endpoint.replace(/^\//, '')}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Azure API Error ${res.status} (${res.statusText}): ${errText.slice(0, 300)}`);
    }
    return res.json();
  }

  async getAllProjects() {
    const data = await this.fetchApi('_apis/projects?api-version=7.0');
    return data.value || [];
  }

  async getProjectIterations(projectId, teamName) {
    try {
      const team = teamName ? encodeURIComponent(teamName) : '';
      const endpoint = team
        ? `${projectId}/${team}/_apis/work/teamsettings/iterations?api-version=7.0`
        : `${projectId}/_apis/work/teamsettings/iterations?api-version=7.0`;
      const data = await this.fetchApi(endpoint);
      return data.value || [];
    } catch (err) {
      return [];
    }
  }

  async getProjectTeams(projectId) {
    try {
      const data = await this.fetchApi(`_apis/projects/${projectId}/teams?api-version=7.0`);
      return data.value || [];
    } catch (err) {
      return [];
    }
  }

  // Classify work item into one of the 5 official EAP phases
  classifyWorkItemToEap(title = '', tags = '', iteration = '') {
    const text = `${title} ${tags} ${iteration}`.toLowerCase();

    if (text.includes('ideacao') || text.includes('ideação') || text.includes('discovery') || text.includes('requisito') || text.includes('especificacao') || text.includes('especificação') || text.includes('concepcao') || text.includes('concepção') || text.includes('prototipo') || text.includes('protótipo') || text.includes('fase 1') || text.includes('planejamento')) {
      return 'Planejamento';
    }
    if (text.includes('treinamento') || text.includes('treino') || text.includes('capacitacao') || text.includes('capacitação') || text.includes('capacitar') || text.includes('onboarding') || text.includes('workshop')) {
      return 'Treinamento';
    }
    if (text.includes('operacao-assistida') || text.includes('operação assistida') || text.includes('operacao assistida') || text.includes('go-live') || text.includes('golive') || text.includes('sustentacao') || text.includes('sustentação') || text.includes('fechamento') || text.includes('tep')) {
      return 'Operação Assistida';
    }
    if (text.includes('qa') || text.includes('qualidade') || text.includes('uat') || text.includes('e2e') || text.includes('teste') || text.includes('homologacao') || text.includes('homologação') || text.includes('fase 4') || text.includes('validacao') || text.includes('validação')) {
      return 'Homologação';
    }
    // Default to Desenvolvimento
    return 'Desenvolvimento';
  }

  // Determine timeline month for Gantt (e.g. 'AGO / 26', 'SET / 26', 'OUT / 26', 'NOV / 26', 'DEZ / 26', 'JAN / 27')
  getMonthSlot(startDate, targetDate, iterationName = '') {
    const dateStr = targetDate || startDate;
    if (dateStr) {
      const d = new Date(dateStr);
      const m = d.getMonth();
      const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      const yr = String(d.getFullYear()).slice(2);
      return `${months[m]} / ${yr}`;
    }
    // Try to guess from iteration string like (Set26), (Out26), (Nov26)
    const it = iterationName.toUpperCase();
    if (it.includes('JUL26') || it.includes('JUL')) return 'JUL / 26';
    if (it.includes('AGO26') || it.includes('AGO')) return 'AGO / 26';
    if (it.includes('SET26') || it.includes('SET')) return 'SET / 26';
    if (it.includes('OUT26') || it.includes('OUT')) return 'OUT / 26';
    if (it.includes('NOV26') || it.includes('NOV')) return 'NOV / 26';
    if (it.includes('DEZ26') || it.includes('DEZ')) return 'DEZ / 26';
    if (it.includes('JAN27') || it.includes('JAN')) return 'JAN / 27';
    return 'OUT / 26';
  }

  // Helper to count business days (Monday-Friday) between two dates
  getBusinessDaysDiff(startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (end < start) return Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    let count = 0;
    const cur = new Date(start);
    cur.setDate(cur.getDate() + 1);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  // Extract dates from all standard and custom Azure DevOps fields
  extractWorkItemDates(fields = {}, iterMap = {}, iterName = '') {
    const rawStart = fields['Custom.PlannedStartDate']
      || fields['Custom.PlannedStartDateUS']
      || fields['Custom.USPlannedStartDate']
      || fields['Microsoft.VSTS.Scheduling.StartDate']
      || fields['Microsoft.VSTS.Common.ActivatedDate']
      || null;

    const rawTarget = fields['Microsoft.VSTS.Scheduling.TargetDate']
      || fields['Custom.TargetDateUS']
      || fields['Microsoft.VSTS.Scheduling.FinishDate']
      || fields['Microsoft.VSTS.CMMI.TargetResolveDate']
      || null;

    let startDate = rawStart ? String(rawStart).split('T')[0] : null;
    let targetDate = rawTarget ? String(rawTarget).split('T')[0] : null;

    // Iteration fallback if dates still missing
    const iterKey = (iterName || fields['System.IterationPath'] || '').toLowerCase();
    const iterAttr = iterMap[iterKey] || iterMap[iterKey.split('\\').pop() || ''];
    if (!startDate && iterAttr?.startDate) {
      startDate = iterAttr.startDate.split('T')[0];
    }
    if (!targetDate && iterAttr?.finishDate) {
      targetDate = iterAttr.finishDate.split('T')[0];
    }

    return { startDate, targetDate };
  }

  // Extract parent ID from item (from System.Parent field or relations)
  extractParentId(item) {
    if (item.fields?.['System.Parent']) {
      const p = Number(item.fields['System.Parent']);
      if (!isNaN(p) && p > 0) return p;
    }
    if (item.relations && Array.isArray(item.relations)) {
      const parentRel = item.relations.find(r => r.rel === 'System.LinkTypes.Hierarchy-Reverse');
      if (parentRel && parentRel.url) {
        const parts = parentRel.url.split('/');
        const p = Number(parts[parts.length - 1]);
        if (!isNaN(p) && p > 0) return p;
      }
    }
    return null;
  }

  mapStatus(azureState) {
    const state = (azureState || '').toLowerCase();
    if (['closed', 'done', 'resolved', 'finalizado', 'concluído'].includes(state)) {
      return 'completed';
    }
    if (['active', 'in progress', 'doing', 'em andamento', 'qa'].includes(state)) {
      return 'in-progress';
    }
    return 'planned';
  }

  async getProjectDetails(project) {
    const pName = project.name;
    const pEnc = encodeURIComponent(pName);

    const teams = await this.getProjectTeams(project.id);
    const defaultTeam = teams[0]?.name || pName;
    const iterations = await this.getProjectIterations(project.id, defaultTeam);

    const datedIterations = iterations
      .filter(it => it.attributes?.startDate && it.attributes?.finishDate)
      .sort((a, b) => new Date(a.attributes.startDate) - new Date(b.attributes.startDate));

    let detectedStartDate = null;
    let detectedFinishDate = null;
    let currentIterationName = null;

    if (datedIterations.length > 0) {
      detectedStartDate = datedIterations[0].attributes.startDate.split('T')[0];
      detectedFinishDate = datedIterations[datedIterations.length - 1].attributes.finishDate.split('T')[0];
      const now = new Date();
      const current = datedIterations.find(it => {
        const s = new Date(it.attributes.startDate);
        const f = new Date(it.attributes.finishDate);
        return now >= s && now <= f;
      }) || datedIterations.find(it => it.attributes.timeFrame === 'current');
      if (current) currentIterationName = current.name;
    }

    // Iteration date map for fallback
    const iterMap = {};
    for (const it of iterations) {
      if (it.name) iterMap[it.name.toLowerCase()] = it.attributes;
      if (it.path) iterMap[it.path.toLowerCase()] = it.attributes;
    }

    // 1. Query Tasks & Bugs to collect planned and executed hours with relations
    let totalTaskOriginalEstimate = 0;
    let totalTaskCompletedWork = 0;
    const parentToTasksMap = {}; // parentId -> [ taskObj, ... ]
    const childToParentMap = {}; // childId -> parentId

    try {
      const taskWiql = {
        query: `SELECT [System.Id], [System.Parent], [System.WorkItemType], [Microsoft.VSTS.Scheduling.OriginalEstimate], [Microsoft.VSTS.Scheduling.CompletedWork] FROM WorkItems WHERE [System.TeamProject] = '${pName.replace(/'/g, "''")}' AND [System.WorkItemType] IN ('Task', 'Bug')`
      };
      const taskRes = await this.fetchApi(`${pEnc}/_apis/wit/wiql?api-version=7.0`, {
        method: 'POST',
        body: JSON.stringify(taskWiql)
      });
      const taskItems = taskRes.workItems || [];

      if (taskItems.length > 0) {
        // Fetch tasks in chunks of 100 with relations
        for (let i = 0; i < taskItems.length; i += 100) {
          const chunkIds = taskItems.slice(i, i + 100).map(t => t.id).join(',');
          const chunkRes = await this.fetchApi(`_apis/wit/workitems?ids=${chunkIds}&$expand=relations&api-version=7.0`);
          for (const item of (chunkRes.value || [])) {
            const est = Number(item.fields?.['Microsoft.VSTS.Scheduling.OriginalEstimate']) || 0;
            const comp = Number(item.fields?.['Microsoft.VSTS.Scheduling.CompletedWork']) || 0;
            const parentId = this.extractParentId(item);
            const taskDates = this.extractWorkItemDates(item.fields, iterMap, item.fields?.['System.IterationPath']);

            totalTaskOriginalEstimate += est;
            totalTaskCompletedWork += comp;

            if (parentId) {
              childToParentMap[item.id] = parentId;
              if (!parentToTasksMap[parentId]) parentToTasksMap[parentId] = [];
              parentToTasksMap[parentId].push({
                id: item.id,
                title: item.fields?.['System.Title'] || 'Tarefa',
                type: item.fields?.['System.WorkItemType'] || 'Task',
                state: item.fields?.['System.State'],
                assignedTo: item.fields?.['System.AssignedTo']?.displayName || null,
                originalEstimate: est,
                completedWork: comp,
                startDate: taskDates.startDate,
                targetDate: taskDates.targetDate
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[AzureSync] Could not fetch tasks for ${pName}:`, e.message);
    }

    // 1.5. Query intermediate items (User Stories, PBIs, Requirements) to connect Tasks -> Stories -> Features/Epics
    const storiesMap = {}; // storyId -> { id, title, parentId }
    try {
      const storyHierarchyWiql = {
        query: `SELECT [System.Id], [System.Parent], [System.Title], [System.WorkItemType] FROM WorkItems WHERE [System.TeamProject] = '${pName.replace(/'/g, "''")}' AND [System.WorkItemType] IN ('User Story', 'Product Backlog Item', 'Requirement')`
      };
      const storyHierarchyRes = await this.fetchApi(`${pEnc}/_apis/wit/wiql?api-version=7.0`, {
        method: 'POST',
        body: JSON.stringify(storyHierarchyWiql)
      });
      const storyHierarchyItems = storyHierarchyRes.workItems || [];

      if (storyHierarchyItems.length > 0) {
        for (let i = 0; i < storyHierarchyItems.length; i += 100) {
          const chunkIds = storyHierarchyItems.slice(i, i + 100).map(s => s.id).join(',');
          const chunkRes = await this.fetchApi(`_apis/wit/workitems?ids=${chunkIds}&$expand=relations&api-version=7.0`);
          for (const item of (chunkRes.value || [])) {
            const parentId = this.extractParentId(item);
            storiesMap[item.id] = {
              id: item.id,
              title: item.fields?.['System.Title'] || '',
              parentId: parentId
            };
            if (parentId) {
              childToParentMap[item.id] = parentId;
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[AzureSync] Could not fetch intermediate stories for ${pName}:`, e.message);
    }

    // 2. Query Hierarchy: Epics & Features -> Fallback to User Stories -> Fallback to Tasks
    let rawWorkItems = [];
    try {
      // Query Epics and Features
      const epicFeatureWiql = {
        query: `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.IterationPath], [System.Tags] FROM WorkItems WHERE [System.TeamProject] = '${pName.replace(/'/g, "''")}' AND [System.WorkItemType] IN ('Epic', 'Feature') ORDER BY [System.WorkItemType] ASC, [System.ChangedDate] DESC`
      };
      const efRes = await this.fetchApi(`${pEnc}/_apis/wit/wiql?api-version=7.0`, {
        method: 'POST',
        body: JSON.stringify(epicFeatureWiql)
      });
      rawWorkItems = efRes.workItems || [];

      // Fallback 1: If 0 Epics/Features, query User Stories / Product Backlog Items / Requirements
      if (rawWorkItems.length === 0) {
        const storyWiql = {
          query: `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.IterationPath], [System.Tags] FROM WorkItems WHERE [System.TeamProject] = '${pName.replace(/'/g, "''")}' AND [System.WorkItemType] IN ('User Story', 'Product Backlog Item', 'Requirement') ORDER BY [System.ChangedDate] DESC`
        };
        const storyRes = await this.fetchApi(`${pEnc}/_apis/wit/wiql?api-version=7.0`, {
          method: 'POST',
          body: JSON.stringify(storyWiql)
        });
        rawWorkItems = storyRes.workItems || [];
      }

      // Fallback 2: If 0 Stories, query Tasks/Bugs
      if (rawWorkItems.length === 0) {
        const taskDirectWiql = {
          query: `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.IterationPath], [System.Tags] FROM WorkItems WHERE [System.TeamProject] = '${pName.replace(/'/g, "''")}' AND [System.WorkItemType] IN ('Task', 'Bug') ORDER BY [System.ChangedDate] DESC`
        };
        const directRes = await this.fetchApi(`${pEnc}/_apis/wit/wiql?api-version=7.0`, {
          method: 'POST',
          body: JSON.stringify(taskDirectWiql)
        });
        rawWorkItems = directRes.workItems || [];
      }
    } catch (e) {
      console.warn(`[AzureSync] Could not fetch work items for ${pName}:`, e.message);
    }

    // 3. Process Work Items into EAP Gantt Activities
    let activities = [];
    if (rawWorkItems.length > 0) {
      const topIds = rawWorkItems.slice(0, 40).map(w => w.id).join(',');
      const detRes = await this.fetchApi(`_apis/wit/workitems?ids=${topIds}&$expand=relations&api-version=7.0`);
      const itemsList = detRes.value || [];

      // Also record parent relations for intermediate levels (e.g. Stories under Features/Epics)
      for (const item of itemsList) {
        const pId = this.extractParentId(item);
        if (pId) childToParentMap[item.id] = pId;
      }

      // Connect unparented stories to matching Feature/Epic by title similarity
      for (const [sId, sObj] of Object.entries(storiesMap)) {
        if (!sObj.parentId) {
          const sTitle = (sObj.title || '').trim().toLowerCase();
          const match = itemsList.find(act => {
            const aTitle = (act.fields?.['System.Title'] || '').trim().toLowerCase();
            return aTitle === sTitle || aTitle.includes(sTitle) || sTitle.includes(aTitle);
          });
          if (match) {
            childToParentMap[Number(sId)] = match.id;
          }
        }
      }

      // Helper function to recursively collect all descendant tasks for an activity
      const getTasksForItem = (itemId) => {
        const result = [];
        const visited = new Set();
        const queue = [itemId];
        while (queue.length > 0) {
          const cur = queue.shift();
          if (visited.has(cur)) continue;
          visited.add(cur);
          if (parentToTasksMap[cur]) {
            result.push(...parentToTasksMap[cur]);
          }
          for (const [chId, pId] of Object.entries(childToParentMap)) {
            if (pId === cur && !visited.has(Number(chId))) {
              queue.push(Number(chId));
            }
          }
        }
        return result;
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      activities = itemsList.map(item => {
        const id = item.id;
        const title = item.fields?.['System.Title'] || 'Item sem título';
        const type = item.fields?.['System.WorkItemType'] || 'Feature';
        const state = item.fields?.['System.State'] || 'New';
        const iterationPath = item.fields?.['System.IterationPath'] || '';
        const iterationName = iterationPath.split('\\').pop() || '';
        const tags = item.fields?.['System.Tags'] || '';

        // Extract dates from item fields (custom or standard)
        let { startDate, targetDate } = this.extractWorkItemDates(item.fields, iterMap, iterationName);

        // Collect all descendant tasks
        const childTasks = getTasksForItem(id);

        // If parent item has no explicit dates, rollup dates from child tasks!
        if (!startDate && childTasks.length > 0) {
          const validStarts = childTasks.map(t => t.startDate).filter(Boolean).sort();
          if (validStarts.length > 0) startDate = validStarts[0];
        }
        if (!targetDate && childTasks.length > 0) {
          const validEnds = childTasks.map(t => t.targetDate).filter(Boolean).sort();
          if (validEnds.length > 0) targetDate = validEnds[validEnds.length - 1];
        }

        const eapPhase = this.classifyWorkItemToEap(title, tags, iterationName);
        const monthSlot = this.getMonthSlot(startDate, targetDate, iterationName);
        const cardStatus = this.mapStatus(state);

        // Hours rollup from descendant tasks or item itself if it's a task
        let ilcHours = childTasks.reduce((s, t) => s + (t.completedWork || 0), 0);
        let ilcHoursTotal = childTasks.reduce((s, t) => s + (t.originalEstimate || 0), 0);

        if (childTasks.length === 0 && ['task', 'bug'].includes(type.toLowerCase())) {
          ilcHours = Number(item.fields?.['Microsoft.VSTS.Scheduling.CompletedWork']) || 0;
          ilcHoursTotal = Number(item.fields?.['Microsoft.VSTS.Scheduling.OriginalEstimate']) || 0;
        }

        if (ilcHoursTotal === 0 && cardStatus === 'completed') {
          ilcHoursTotal = ilcHours;
        }

        let isDelayed = false;
        let isTightMargin = false;

        if (targetDate && cardStatus !== 'completed') {
          const tDate = new Date(targetDate + 'T12:00:00');
          tDate.setHours(0, 0, 0, 0);
          const diffDays = Math.round((tDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          // Regra calibrada: desvio a partir de 2 dias de atraso; atenção entre -1 e 1 dia de atraso
          if (diffDays <= -2) {
            // Atraso crítico a partir de 2 dias (atraso >= 2d)
            isDelayed = true;
          } else if (diffDays >= -1 && diffDays <= 1) {
            // Atenção entre -1 e 1 dia de atraso (entrega iminente hoje/amanhã ou atraso tolerado de 1d)
            isTightMargin = true;
          }
        }

        const assignedTo = item.fields?.['System.AssignedTo']?.displayName || null;

        return {
          id: String(id),
          azureId: id,
          title: this.cleanActivityTitle(title),
          fullTitle: `#${id} ${title}`,
          rawTitle: title,
          type,
          state,
          assignedTo,
          eapPhase,
          month: monthSlot,
          startDate,
          targetDate,
          dateStr: targetDate ? new Date(targetDate + 'T12:00:00').toLocaleDateString('pt-BR') : (iterationName || monthSlot),
          ilcHours,
          ilcHoursTotal,
          clientHours: 0,
          status: cardStatus,
          isDelayed,
          isTightMargin,
          linkedTasks: childTasks
        };
      });
    }

    // Progress percentage: Prioritize task hours executed vs planned, fallback to completed deliverables count
    let progress = 0;
    if (totalTaskOriginalEstimate > 0) {
      progress = Math.min(100, Math.round((totalTaskCompletedWork / totalTaskOriginalEstimate) * 100));
    } else if (activities.length > 0) {
      const closed = activities.filter(a => a.status === 'completed').length;
      progress = Math.round((closed / activities.length) * 100);
    }

    // Auto-detect current milestone from the earliest unfinished EAP phase
    const phaseOrder = ['Planejamento', 'Desenvolvimento', 'Homologação', 'Treinamento', 'Operação Assistida'];
    let currentMilestone = 'Desenvolvimento';
    for (const ph of phaseOrder) {
      const phActs = activities.filter(a => a.eapPhase === ph);
      if (phActs.length > 0 && phActs.some(a => a.status !== 'completed')) {
        currentMilestone = ph;
        break;
      }
    }
    if (activities.length > 0 && activities.every(a => a.status === 'completed')) {
      currentMilestone = 'Operação Assistida';
    }

    // Expand detected dates using activity dates if activities span beyond iterations
    const validEnds = activities.map(a => a.targetDate).filter(Boolean).sort();
    if (validEnds.length > 0 && (!detectedFinishDate || validEnds[validEnds.length - 1] > detectedFinishDate)) {
      detectedFinishDate = validEnds[validEnds.length - 1];
    }
    const validStarts = activities.map(a => a.startDate).filter(Boolean).sort();
    if (validStarts.length > 0 && (!detectedStartDate || validStarts[0] < detectedStartDate)) {
      detectedStartDate = validStarts[0];
    }

    return {
      azureId: project.id,
      name: project.name,
      description: project.description || '',
      detectedStartDate,
      detectedFinishDate,
      currentIterationName,
      currentMilestone,
      iterationsCount: iterations.length,
      progress,
      activities,
      taskHours: {
        totalPlanned: totalTaskOriginalEstimate,
        totalExecuted: totalTaskCompletedWork
      },
      azureLastUpdated: new Date().toISOString()
    };
  }

  // Full Work Items Audit Extrato for a project
  async getProjectFullAudit(projectName) {
    const pEnc = encodeURIComponent(projectName);
    const wiql = {
      query: `SELECT [System.Id], [System.WorkItemType], [System.Title], [System.State], [System.AssignedTo], [System.Parent], [System.IterationPath], [Microsoft.VSTS.Scheduling.StartDate], [Microsoft.VSTS.Scheduling.TargetDate], [Microsoft.VSTS.Scheduling.OriginalEstimate], [Microsoft.VSTS.Scheduling.CompletedWork] FROM WorkItems WHERE [System.TeamProject] = '${projectName.replace(/'/g, "''")}' ORDER BY [System.WorkItemType] ASC, [System.Id] ASC`
    };

    let rawItems = [];
    try {
      const res = await this.fetchApi(`${pEnc}/_apis/wit/wiql?api-version=7.0`, {
        method: 'POST',
        body: JSON.stringify(wiql)
      });
      rawItems = res.workItems || [];
    } catch (e) {
      console.warn(`[AzureAudit] Error executing WIQL for ${projectName}:`, e.message);
      return {
        projectName,
        totalItems: 0,
        completeItems: 0,
        incompleteItems: 0,
        complianceScore: 0,
        summary: { epics: { total: 0, complete: 0 }, features: { total: 0, complete: 0 }, stories: { total: 0, complete: 0 }, tasks: { total: 0, complete: 0 } },
        items: []
      };
    }

    const allItems = [];
    const summary = {
      epics: { total: 0, complete: 0 },
      features: { total: 0, complete: 0 },
      stories: { total: 0, complete: 0 },
      tasks: { total: 0, complete: 0 }
    };

    // Fetch details in chunks of 100
    for (let i = 0; i < rawItems.length; i += 100) {
      const chunkIds = rawItems.slice(i, i + 100).map(w => w.id).join(',');
      const detRes = await this.fetchApi(`_apis/wit/workitems?ids=${chunkIds}&$expand=relations&api-version=7.0`);
      for (const item of (detRes.value || [])) {
        const id = item.id;
        const type = item.fields?.['System.WorkItemType'] || 'Item';
        const title = item.fields?.['System.Title'] || 'Sem título';
        const state = item.fields?.['System.State'] || 'New';
        const assignedTo = item.fields?.['System.AssignedTo']?.displayName || null;
        const parentId = this.extractParentId(item);
        const iterationPath = item.fields?.['System.IterationPath'] || '';

        const { startDate, targetDate } = this.extractWorkItemDates(item.fields, {}, iterationPath);

        const originalEstimate = item.fields?.['Microsoft.VSTS.Scheduling.OriginalEstimate'] !== undefined 
          ? Number(item.fields['Microsoft.VSTS.Scheduling.OriginalEstimate']) 
          : null;
        const completedWork = item.fields?.['Microsoft.VSTS.Scheduling.CompletedWork'] !== undefined 
          ? Number(item.fields['Microsoft.VSTS.Scheduling.CompletedWork']) 
          : null;

        const lowerType = type.toLowerCase();
        let category = 'Outro';
        if (lowerType === 'epic' || lowerType === 'épico') {
          category = 'Épico';
          summary.epics.total++;
        } else if (lowerType === 'feature') {
          category = 'Feature';
          summary.features.total++;
        } else if (['user story', 'product backlog item', 'requirement', 'história'].includes(lowerType)) {
          category = 'US / PBI';
          summary.stories.total++;
        } else if (['task', 'bug', 'tarefa', 'defeito'].includes(lowerType)) {
          category = 'Task / Bug';
          summary.tasks.total++;
        }

        // Completeness evaluation
        const missingFields = [];
        if (!startDate) missingFields.push('Data de Início (Planned Start Date)');
        if (!targetDate) missingFields.push('Data de Fim (Target Date)');
        if (!assignedTo) missingFields.push('Responsável');

        if (category === 'Task / Bug') {
          if (originalEstimate === null || originalEstimate === 0) {
            missingFields.push('Horas Planejadas (Original Estimate)');
          }
        }

        const isComplete = missingFields.length === 0;

        if (category === 'Épico' && isComplete) summary.epics.complete++;
        if (category === 'Feature' && isComplete) summary.features.complete++;
        if (category === 'US / PBI' && isComplete) summary.stories.complete++;
        if (category === 'Task / Bug' && isComplete) summary.tasks.complete++;

        allItems.push({
          id,
          title,
          type,
          category,
          state,
          assignedTo,
          startDate,
          targetDate,
          originalEstimate,
          completedWork,
          parentId,
          iterationPath,
          isComplete,
          missingFields
        });
      }
    }

    const totalItems = allItems.length;
    const completeItems = allItems.filter(it => it.isComplete).length;
    const incompleteItems = totalItems - completeItems;
    const complianceScore = totalItems > 0 ? Math.round((completeItems / totalItems) * 100) : 100;

    return {
      projectName,
      totalItems,
      completeItems,
      incompleteItems,
      complianceScore,
      summary,
      items: allItems
    };
  }

  cleanActivityTitle(rawTitle) {
    if (!rawTitle) return '';
    let t = rawTitle.trim();
    // 1. Remove leading #1234
    t = t.replace(/^#\d+[\s:–—-]*/, '');
    // 2. Remove leading emojis/symbols before brackets
    t = t.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\s]+/u, '');
    // 3. Remove bracket tags like [Épico 1], [JD-PROMISS], [Promessa MVP], [Frete Expresso]
    while (/^\[[^\]]+\][\s:–—-]*/.test(t) || /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\s]*\[[^\]]+\][\s:–—-]*/u.test(t)) {
      t = t.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\s]*\[[^\]]+\][\s:–—-]*/u, '');
    }
    // 4. Remove leading #1234 if any
    t = t.replace(/^#\d+[\s:–—-]*/, '');
    // 5. Remove unbracketed type prefix like 'Épico 1 - ', 'Feature 2: ', 'US 1: '
    t = t.replace(/^(?:Épico|Epico|Feature|US|PBI|História|Historia|Task|Tarefa)\s*\d*[\s:–—-]+/i, '');
    // 6. Remove remaining leading emojis or punctuation (like - or :)
    t = t.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\s:–—-]+/u, '').trim();
    return t || rawTitle;
  }

  getProjectSummary(project) {
    return this.getProjectDetails(project);
  }
}

module.exports = new AzureDevOpsService();
