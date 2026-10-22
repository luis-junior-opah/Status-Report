const fs = require('fs');
const path = require('path');
const projectStore = require('./projectStore');

const REPORTS_FILE = path.join(__dirname, '../data/weekly_reports.json');

const DEFAULT_ROADMAP = [
  {
    id: 'road-1',
    name: 'Portal de Autoatendimento B2B',
    client: 'John Deere',
    estimatedStart: 'Novembro/2026',
    stage: 'Em Proposta Comercial',
    strategicValue: 'Alto',
    description: 'Portal self-service para consulta de pedidos, pedidos duplicados e telemetria logística em tempo real.',
    responsible: 'Comercial & PMO'
  },
  {
    id: 'road-2',
    name: 'Integração TMS & Torre de Controle Dedicada',
    client: 'Mirassol',
    estimatedStart: 'Dezembro/2026',
    stage: 'Discovery Técnico',
    strategicValue: 'Alto',
    description: 'Camada de mensageria para telemetria e tracking ativo das frotas de transporte rodoviário.',
    responsible: 'Arquitetura & Operações'
  },
  {
    id: 'road-3',
    name: 'IA Preditiva de Otimização de Roteirização',
    client: 'ILC (Interno)',
    estimatedStart: 'Q1 / 2027',
    stage: 'Análise de Viabilidade',
    strategicValue: 'Muito Alto',
    description: 'Estudo piloto de algoritmos preditivos para diminuição do custo operacional por km rodado.',
    responsible: 'Inovação & Tech'
  },
  {
    id: 'road-4',
    name: 'Hub de Conexão EDI & Supply Chain Integrado',
    client: 'Petrobras',
    estimatedStart: 'Janeiro/2027',
    stage: 'Prospecção Estratégica',
    strategicValue: 'Alto',
    description: 'Expansão da plataforma ILC para novos fluxos logísticos e conformidade de suprimentos.',
    responsible: 'Diretoria de Negócios'
  }
];

const DEFAULT_DECISIONS = [
  {
    id: 'dec-1',
    title: 'Aprovação da Data de Go-Live - Duplicação de Pedidos',
    client: 'John Deere',
    impact: 'Homologação final e implantação assistida agendada para final de Outubro.',
    status: 'Aguardando Aval',
    deadline: '16/10/2026'
  },
  {
    id: 'dec-2',
    title: 'Priorização de Squad: Fluxo de Recusa vs Assinatura Digital',
    client: 'Mirassol',
    impact: 'Alocação dedicada de 2 engenheiros de software para aceleração da entrega.',
    status: 'Em Deliberação',
    deadline: 'Reunião de Hoje'
  },
  {
    id: 'dec-3',
    title: 'Janela de Manutenção: Conclusão Migração Data Center Matrix',
    client: 'ILC (Interno)',
    impact: 'Virada final do tráfego de produção sem indisponibilidade para parceiros externos.',
    status: 'Alinhado',
    deadline: '19/10/2026'
  }
];

function resolveProjectWeeklyDetails(p) {
  const name = (p.name || '').trim();
  const summary = (p.executiveSummary || '').trim();

  // If there's an elaborate summary already (e.g. Migração Data Center, Duplicação de Pedidos, etc.)
  if (summary && !summary.includes('Projeto integrado ao Azure DevOps') && !summary.includes('Projeto cadastrado manualmente')) {
    const lines = summary.split('\n').map(l => l.trim()).filter(Boolean);
    const mainHighlights = lines.filter(l => !l.startsWith('RISCOS:')).slice(0, 2).join(' ');
    const riskLine = lines.find(l => l.startsWith('RISCOS:'));

    return {
      previousStatusReport: 'Validação técnica preliminar e alinhamento de escopo operacional com os líderes de projeto.',
      statusReport: mainHighlights || summary,
      attentionPoints: riskLine ? riskLine.replace('RISCOS:', '').trim() : (p.ragStatus === 'red' ? 'Revisão do caminho crítico necessária para conter desvio.' : '')
    };
  }

  // Tailored domain-specific summaries for each project
  const nameLower = name.toLowerCase();

  if (nameLower.includes('smart tracking') || nameLower.includes('torre de controle')) {
    return {
      previousStatusReport: 'Desenvolvimento dos conectores de telemetria e testes de comunicação com rastreadores veiculares.',
      statusReport: 'Módulo de tracking e telemetria veicular 100% desenvolvido. Validação de homologação em campo com frotas parceiras.',
      attentionPoints: 'Aguardando validação dos testes operacionais com motoristas da frota dedicada.'
    };
  }
  if (nameLower.includes('ilc mobile') || nameLower.includes('app ilc')) {
    return {
      previousStatusReport: 'Alinhamento inicial de escopo e arquitetura técnica com stakeholders internos.',
      statusReport: 'Desenvolvimento das telas operacionais e serviços offline (41% concluído). Ajuste no fluxo de autenticação.',
      attentionPoints: 'Sincronização necessária com infraestrutura para liberação de build iOS de teste homologado.'
    };
  }
  if (nameLower.includes('gestão de demandas')) {
    return {
      previousStatusReport: 'Prototipação de telas de solicitação de demandas e aprovação gerencial.',
      statusReport: 'Fluxo central de abertura e aprovação de demandas estruturado (94%). Validação de usabilidade com gestores.',
      attentionPoints: 'Alinhamento dos critérios finais de aceite antes do encerramento da fase de planejamento.'
    };
  }
  if (nameLower.includes('integrator v0') || nameLower.includes('migração angular')) {
    return {
      previousStatusReport: 'Mapeamento de rotinas legadas e estruturação inicial dos componentes Angular.',
      statusReport: 'Homologação das telas legadas migradas para Angular (65%). Testes de regressão e validação de performance em curso.',
      attentionPoints: 'Mapeamento de inconsistências em rotinas legadas de faturamento e mensageria.'
    };
  }
  if (nameLower.includes('integrator')) {
    return {
      previousStatusReport: 'Definição das rotas de integração e protocolo de mensageria assíncrona.',
      statusReport: 'Camada de mensageria e barramento de integração em construção (62%). Integrações com APIs legadas em validação.',
      attentionPoints: 'Revisão da alocação de desenvolvedores sênior para aceleração das rotas críticas.'
    };
  }
  if (nameLower.includes('smart x')) {
    return {
      previousStatusReport: 'Arquitetura de dados para telemetria em tempo real e especificação de barramentos.',
      statusReport: 'Evolução dos módulos de telemetria inteligente e conectividade veicular (46%). Sprint atual focado em microserviços.',
      attentionPoints: 'Atenção à cadência de entregas técnicas para garantir marco de entrega intermediário.'
    };
  }
  if (nameLower.includes('gestão embarcada') || nameLower.includes('ge -')) {
    return {
      previousStatusReport: 'Análise de telemetria embarcada e requisitos de comunicação de campo.',
      statusReport: 'Revisão das regras de negócio e barramento dos módulos embarcados John Deere (44%).',
      attentionPoints: 'Priorização de alinhamento com a engenharia de produto John Deere sobre protocolos de comunicação.'
    };
  }
  if (nameLower.includes('adição de item na promessa')) {
    return {
      previousStatusReport: 'Desenvolvimento das regras de inclusão de novos itens e testes unitários concluídos.',
      statusReport: 'Desenvolvimento e testes de sistema finalizados. Homologado junto à John Deere (68%).',
      attentionPoints: 'Agendamento do cronograma de capacitação e treinamento dos usuários operacionais.'
    };
  }
  if (nameLower.includes('frete expresso 2.0')) {
    return {
      previousStatusReport: 'Levantamento das tabelas tarifárias de frete e desenho técnico dos serviços de parametrização.',
      statusReport: 'Módulo de parametrização de tarifas dinâmicas e cálculo de frete em fase final de desenvolvimento (44%).',
      attentionPoints: 'Aguardando homologação de credenciais do ambiente de homologação John Deere.'
    };
  }
  if (nameLower.includes('duplicação de pedidos')) {
    return {
      previousStatusReport: 'Mapeamento das condições de duplicidade e validação da lógica de eliminação com a operação.',
      statusReport: 'Módulo de identificação e tratamento de duplicações homologado junto ao time de negócio John Deere (66%).',
      attentionPoints: 'Definição da janela de virada em produção e plano de treinamento da equipe.'
    };
  }
  if (nameLower.includes('projetos john deere')) {
    return {
      previousStatusReport: 'Estruturação do roadmap de iniciativas estratégicas conjuntas para o trimestre.',
      statusReport: 'Iniciação e alinhamento do portfólio de demandas do próximo ciclo com a diretoria John Deere.',
      attentionPoints: 'Aguardando fechamento da ordem de serviço para início do desenvolvimento técnico.'
    };
  }
  if (nameLower.includes('atualização de documentos')) {
    if (nameLower.includes('recusa')) {
      return {
        previousStatusReport: 'Levantamento das regras fiscais e operacionais para devolução de cargas.',
        statusReport: 'Mapeamento da jornada de recusas de carga e regras fiscais finalizado. Wireframes em aprovação.',
        attentionPoints: 'Definição das regras de contingência operacional com a liderança Mirassol.'
      };
    }
    return {
      previousStatusReport: 'Validação de esquemas XML de documentos fiscais e testes de parser.',
      statusReport: 'Desenvolvimento dos módulos de upload, validação e custódia de CTe/NFe em reta final (93%).',
      attentionPoints: 'Correção de divergências em validação de schema XML de notas fiscais de terceiros.'
    };
  }
  if (nameLower.includes('input gestão de demandas')) {
    return {
      previousStatusReport: 'Desenho dos formulários dinâmicos e validação preliminar de campos.',
      statusReport: 'Construção dos formulários dinâmicos e regras de validação concluída (97%). Em homologação.',
      attentionPoints: 'Ajuste final no envio de notificações automáticas via e-mail corporativo.'
    };
  }
  if (nameLower.includes('assinatura digital')) {
    return {
      previousStatusReport: 'Definição do modelo de custódia e requisitos jurídicos ICP-Brasil para canhotos digitais.',
      statusReport: 'Planejamento da arquitetura de certificados digitais e conformidade jurídica ICP-Brasil (86%).',
      attentionPoints: 'Avaliação de custos de APIs de certificadora parceira junto à diretoria financeira.'
    };
  }
  if (nameLower.includes('videos treinamento') || nameLower.includes('safety')) {
    return {
      previousStatusReport: 'Iniciação do projeto, mapeamento preliminar das rotinas de segurança e entrevistas operacionais.',
      statusReport: 'Roteirização dos módulos de capacitação e segurança operacional (Safety) de motoristas em andamento.',
      attentionPoints: 'Aguardando validação dos roteiros técnicos com a equipe de SESMT da Mirassol.'
    };
  }
  if (nameLower.includes('cockpit petrobras')) {
    return {
      previousStatusReport: 'Implantação em ambiente produtivo e acompanhamento inicial de telemetria.',
      statusReport: 'Painel operacional em produção assistida (100%), garantindo visibilidade total das operações logísticas.',
      attentionPoints: 'Operação estabilizada sem incidentes de suporte registrados no ciclo.'
    };
  }
  if (nameLower.includes('boge')) {
    return {
      previousStatusReport: 'Reunião de diagnóstico preliminar de processos operacionais de armazenagem.',
      statusReport: 'Alinhamento inicial de escopo e levantamento de requisitos para automação da planta logística.',
      attentionPoints: 'Elaboração da proposta técnica e definição da data de kick-off do projeto piloto.'
    };
  }

  return {
    previousStatusReport: 'Atividades em planejamento e acompanhamento técnico preliminar.',
    statusReport: `Projeto na fase de ${p.currentMilestone} com ${p.progress}% de avanço concluído.`,
    attentionPoints: p.ragStatus === 'red' ? 'Desvio acumulado no cronograma. Revisão de tarefas prioritárias em andamento.' : 'Atividades transcorrendo dentro dos parâmetros planejados.'
  };
}

function getISOWeekNumber(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function getWeekPeriodString(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diffToMonday));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const format = (dt) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
  return `${format(monday)} a ${format(friday)}`;
}

class WeeklyReportStore {
  constructor() {
    this.reports = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(REPORTS_FILE)) {
        const raw = fs.readFileSync(REPORTS_FILE, 'utf8');
        this.reports = JSON.parse(raw);

        // Normalize weekNumber and id based on title if needed
        for (const rep of this.reports) {
          if (rep.title) {
            const match = rep.title.match(/Semana\s+(\d+)\s*\/\s*(\d+)/i);
            if (match) {
              rep.weekNumber = parseInt(match[1], 10);
              rep.year = parseInt(match[2], 10);
              rep.id = `${rep.year}-W${rep.weekNumber}`;
            }
          }
        }

        // If week 42 is missing because week 43 replaced it, re-introduce week 42 as history
        const hasW42 = this.reports.some(r => r.id === '2026-W42' || r.weekNumber === 42);
        const hasW43 = this.reports.some(r => r.id === '2026-W43' || r.weekNumber === 43);
        if (hasW43 && !hasW42) {
          const w43 = this.reports.find(r => r.id === '2026-W43');
          const w42 = JSON.parse(JSON.stringify(w43));
          w42.id = '2026-W42';
          w42.weekNumber = 42;
          w42.year = 2026;
          w42.title = 'Semana 42 / 2026';
          w42.period = '13/10/2026 a 17/10/2026';
          w42.meetingDate = '2026-10-16';
          this.reports.push(w42);
        }

        // Sort descending
        this.reports.sort((a, b) => b.id.localeCompare(a.id));
        this.syncAllReportsWithProjects();
      } else {
        this.reports = [];
        this.generateDefaultInitialReports();
        this.persist();
      }
    } catch (err) {
      console.error('[WeeklyReportStore] Erro ao carregar relatórios:', err);
      this.reports = [];
    }
  }

  persist() {
    try {
      const dir = path.dirname(REPORTS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(REPORTS_FILE, JSON.stringify(this.reports, null, 2), 'utf8');
    } catch (err) {
      console.error('[WeeklyReportStore] Erro ao persistir relatórios:', err);
    }
  }

  generateDefaultInitialReports() {
    const current = this.buildReportForCurrentWeek();
    const past = {
      ...current,
      id: '2026-W41',
      weekNumber: 41,
      year: 2026,
      title: 'Semana 41 / 2026',
      period: '06/10/2026 a 10/10/2026',
      meetingDate: '2026-10-06',
      executiveSummary: 'Fechamento do ciclo anterior: Início dos testes integrados John Deere e avanço na arquitetura de migração de nuvem.',
      statusPulse: {
        totalActive: current.statusPulse.totalActive,
        onTrack: Math.max(current.statusPulse.onTrack - 2, 0),
        attention: 3,
        critical: current.statusPulse.critical,
        averageProgress: Math.max(current.statusPulse.averageProgress - 7, 0)
      }
    };
    this.reports = [current, past];
  }

  syncReportWithProjects(report) {
    if (!report) return;
    const allProjects = projectStore.getAllProjects() || [];
    const visibleProjects = allProjects
      .filter(p => p.isVisible)
      .sort((a, b) => projectStore.compareProjects(a, b));

    // Identify if this is the latest report and what the chronologically previous report is
    const sorted = this.reports.slice().sort((a, b) => b.id.localeCompare(a.id));
    const reportIdx = sorted.findIndex(r => r.id === report.id);
    const isLatest = reportIdx === 0;
    const prevReport = (reportIdx >= 0 && reportIdx < sorted.length - 1) ? sorted[reportIdx + 1] : null;

    const existingMap = new Map();
    (report.activeProjects || []).forEach(ap => {
      if (ap.projectId) existingMap.set(ap.projectId, ap);
      if (ap.name) {
        existingMap.set(ap.name.toLowerCase().trim(), ap);
        const clean = ap.name.replace(/^Mirassol\s*-\s*/i, '').toLowerCase().trim();
        existingMap.set(clean, ap);
      }
    });

    let onTrack = 0;
    let attention = 0;
    let critical = 0;
    let totalProgress = 0;
    let totalActive = 0;

    const mappedProjects = visibleProjects.map(p => {
      if (p.status === 'Ativo') {
        totalActive++;
        if (p.ragStatus === 'red') critical++;
        else if (p.ragStatus === 'amber') attention++;
        else onTrack++;
        totalProgress += (p.progress || 0);
      }

      const cleanName = (p.name || '').replace(/^Mirassol\s*-\s*/i, '').toLowerCase().trim();
      const existing = existingMap.get(p.id) ||
                       existingMap.get((p.name || '').toLowerCase().trim()) ||
                       existingMap.get(cleanName);

      const details = resolveProjectWeeklyDetails(p);
      const clientLogo = projectStore.getClientLogo ? projectStore.getClientLogo(p.client) : null;

      // 1. STATUS REPORT ANTERIOR: Strictly from previous edition's statusReport if available
      let prevReportText = null;
      let prevReportDate = '2026-10-06';

      if (prevReport && Array.isArray(prevReport.activeProjects)) {
        const prevProject = prevReport.activeProjects.find(ap =>
          ap.projectId === p.id ||
          (ap.name && ap.name.toLowerCase().trim() === (p.name || '').toLowerCase().trim()) ||
          (ap.name && cleanName && ap.name.replace(/^Mirassol\s*-\s*/i, '').toLowerCase().trim() === cleanName)
        );
        if (prevProject && prevProject.statusReport) {
          prevReportText = prevProject.statusReport;
          prevReportDate = prevProject.statusReportDate || prevReport.meetingDate || '2026-10-16';
        }
      }

      if (!prevReportText) {
        prevReportText = (existing && existing.previousStatusReport) ? existing.previousStatusReport : (details.previousStatusReport || 'Sem reporte anterior registrado.');
        prevReportDate = (existing && existing.previousStatusReportDate) ? existing.previousStatusReportDate : '2026-10-06';
      }

      // 2. STATUS REPORT ATUAL: In the active/latest edition, p.executiveSummary is the live source of truth
      let currentReportText = '';
      let currentReportDate = (existing && existing.statusReportDate) ? existing.statusReportDate : (report.meetingDate || new Date().toISOString().split('T')[0]);

      if (isLatest) {
        const hasRealSummary = p.executiveSummary && p.executiveSummary.trim() &&
          !p.executiveSummary.includes('Projeto integrado ao Azure DevOps') &&
          !p.executiveSummary.includes('Projeto cadastrado manualmente');

        if (hasRealSummary) {
          currentReportText = p.executiveSummary.trim();
        } else if (existing && existing.statusReport) {
          currentReportText = existing.statusReport;
        } else {
          currentReportText = details.statusReport;
        }
      } else {
        // Historical reports remain frozen as originally saved
        currentReportText = (existing && existing.statusReport) ? existing.statusReport : details.statusReport;
      }

      return {
        projectId: p.id,
        name: p.name,
        client: p.client,
        clientLogo: clientLogo,
        status: p.status || 'Ativo',
        currentMilestone: p.currentMilestone || 'Planejamento',
        progress: p.progress || 0,
        ragStatus: p.ragStatus || 'green',
        agreedDelivery: p.agreedDates ? p.agreedDates.end : null,
        targetDelivery: p.executedDates?.end || p.plannedDates?.end || null,
        varianceDays: p.varianceDays || 0,
        statusReport: currentReportText,
        statusReportDate: currentReportDate,
        previousStatusReport: prevReportText,
        previousStatusReportDate: prevReportDate,
        attentionPoints: (existing && existing.attentionPoints) ? existing.attentionPoints : details.attentionPoints,
        hoursExecuted: p.hours?.totalExecuted || 0,
        hoursPlanned: p.hours?.totalPlanned || 0,
        priority: p.priority || 'P2',
        systems: p.systems || [],
        teamLeader: p.team?.leader || (p.team?.members ? p.team.members.join(', ') : ''),
        teamMembers: p.team?.members || [],
        team: p.team || { leader: p.team?.leader || '', members: [] }
      };
    });

    report.activeProjects = mappedProjects;
    const avgProgress = totalActive > 0 ? Math.round(totalProgress / totalActive) : 0;
    report.statusPulse = {
      totalActive: totalActive,
      onTrack: onTrack,
      attention: attention,
      critical: critical,
      averageProgress: avgProgress
    };
  }

  syncAllReportsWithProjects() {
    for (const report of this.reports) {
      this.syncReportWithProjects(report);
    }
    this.persist();
  }

  getAllReports() {
    this.syncAllReportsWithProjects();
    return this.reports.map(r => ({
      id: r.id,
      weekNumber: r.weekNumber,
      year: r.year,
      title: r.title,
      period: r.period,
      meetingDate: r.meetingDate,
      executiveSummary: r.executiveSummary,
      statusPulse: r.statusPulse,
      activeProjectsCount: r.activeProjects ? r.activeProjects.length : 0,
      roadmapCount: r.roadmapProjects ? r.roadmapProjects.length : 0
    })).sort((a, b) => b.id.localeCompare(a.id));
  }

  getReportById(id) {
    if (!id || id === 'latest') {
      const rep = this.reports[0] || null;
      if (rep) {
        this.syncReportWithProjects(rep);
        this.persist();
      }
      return rep;
    }
    const rep = this.reports.find(r => r.id === id) || null;
    if (rep) {
      this.syncReportWithProjects(rep);
      this.persist();
    }
    return rep;
  }

  getLatestReport() {
    return this.reports[0] || null;
  }

  buildReportForCurrentWeek() {
    const now = new Date();
    const currentWeekNumber = getISOWeekNumber(now);
    const year = now.getFullYear();
    const id = `${year}-W${currentWeekNumber}`;
    const period = getWeekPeriodString(now);

    const allProjects = projectStore.getAllProjects() || [];
    const visibleProjects = allProjects
      .filter(p => p.isVisible)
      .sort((a, b) => projectStore.compareProjects(a, b));

    let onTrack = 0;
    let attention = 0;
    let critical = 0;
    let totalProgress = 0;
    let totalActive = 0;

    const mappedProjects = visibleProjects.map(p => {
      if (p.status === 'Ativo') {
        totalActive++;
        if (p.ragStatus === 'red') critical++;
        else if (p.ragStatus === 'amber') attention++;
        else onTrack++;
        totalProgress += (p.progress || 0);
      }

      const details = resolveProjectWeeklyDetails(p);
      const clientLogo = projectStore.getClientLogo ? projectStore.getClientLogo(p.client) : null;

      return {
        projectId: p.id,
        name: p.name,
        client: p.client,
        clientLogo: clientLogo,
        status: p.status || 'Ativo',
        currentMilestone: p.currentMilestone || 'Planejamento',
        progress: p.progress || 0,
        ragStatus: p.ragStatus || 'green',
        agreedDelivery: p.agreedDates ? p.agreedDates.end : null,
        targetDelivery: p.executedDates?.end || p.plannedDates?.end || null,
        varianceDays: p.varianceDays || 0,
        statusReport: details.statusReport,
        statusReportDate: now.toISOString().split('T')[0],
        previousStatusReport: details.previousStatusReport || 'Sem reporte anterior registrado.',
        previousStatusReportDate: '2026-10-06',
        attentionPoints: details.attentionPoints,
        hoursExecuted: p.hours?.totalExecuted || 0,
        hoursPlanned: p.hours?.totalPlanned || 0,
        priority: p.priority || 'P2',
        systems: p.systems || [],
        teamLeader: p.team?.leader || '',
        teamMembers: p.team?.members || [],
        team: p.team || { leader: p.team?.leader || '', members: [] }
      };
    });

    const avgProgress = totalActive > 0 ? Math.round(totalProgress / totalActive) : 0;

    return {
      id: id,
      weekNumber: currentWeekNumber,
      year: year,
      title: `Semana ${currentWeekNumber} / ${year}`,
      period: period,
      meetingDate: now.toISOString().split('T')[0],
      executiveSummary: '',
      statusPulse: {
        totalActive: totalActive,
        onTrack: onTrack,
        attention: attention,
        critical: critical,
        averageProgress: avgProgress
      },
      activeProjects: mappedProjects,
      roadmapProjects: DEFAULT_ROADMAP,
      boardDecisions: DEFAULT_DECISIONS
    };
  }

  generateCurrentWeek() {
    const report = this.buildReportForCurrentWeek();
    const existingIndex = this.reports.findIndex(r => r.id === report.id);
    if (existingIndex >= 0) {
      // Preserve any custom roadmap or decisions if previously edited
      const old = this.reports[existingIndex];
      report.roadmapProjects = old.roadmapProjects || DEFAULT_ROADMAP;
      report.boardDecisions = old.boardDecisions || DEFAULT_DECISIONS;
      if (old.executiveSummary && !old.executiveSummary.includes('Visão executiva consolidada')) {
        report.executiveSummary = old.executiveSummary;
      }
      this.reports[existingIndex] = report;
    } else {
      this.reports.unshift(report);
    }
    this.persist();
    return report;
  }

  saveReport(reportData) {
    if (!reportData) {
      throw new Error('Dados do relatório são obrigatórios.');
    }
    // Infer weekNumber and year from title if present
    if (reportData.title) {
      const match = reportData.title.match(/Semana\s+(\d+)\s*\/\s*(\d+)/i);
      if (match) {
        reportData.weekNumber = parseInt(match[1], 10);
        reportData.year = parseInt(match[2], 10);
        const targetId = `${reportData.year}-W${reportData.weekNumber}`;
        if (reportData.id !== targetId) {
          reportData.id = targetId;
        }
      }
    }
    if (!reportData.id) {
      throw new Error('ID do relatório é obrigatório.');
    }

    const idx = this.reports.findIndex(r => r.id === reportData.id);
    if (idx >= 0) {
      this.reports[idx] = { ...this.reports[idx], ...reportData };
    } else {
      this.reports.unshift(reportData);
    }
    this.reports.sort((a, b) => b.id.localeCompare(a.id));

    // If saving the latest report, sync updated statusReport to project.executiveSummary in projectStore
    const isLatest = this.reports.length > 0 && this.reports[0].id === reportData.id;
    if (isLatest && Array.isArray(reportData.activeProjects)) {
      let projectsChanged = false;
      for (const ap of reportData.activeProjects) {
        if (ap.projectId && typeof ap.statusReport === 'string' && ap.statusReport.trim()) {
          const proj = projectStore.getProjectById(ap.projectId);
          if (proj && proj.executiveSummary !== ap.statusReport.trim()) {
            proj.executiveSummary = ap.statusReport.trim();
            projectsChanged = true;
          }
        }
      }
      if (projectsChanged) {
        projectStore.save();
      }
    }

    this.persist();
    return this.reports.find(r => r.id === reportData.id);
  }

  updateProjectStatusReport(projectId, newExecutiveSummary) {
    if (!projectId || newExecutiveSummary === undefined) return;
    const sorted = this.reports.slice().sort((a, b) => b.id.localeCompare(a.id));
    if (sorted.length === 0) return;
    const latest = sorted[0];
    if (Array.isArray(latest.activeProjects)) {
      const proj = latest.activeProjects.find(ap => ap.projectId === projectId);
      if (proj) {
        proj.statusReport = newExecutiveSummary;
        proj.statusReportDate = new Date().toISOString().split('T')[0];
        this.persist();
      }
    }
  }

  deleteReport(id) {
    const initialLen = this.reports.length;
    this.reports = this.reports.filter(r => r.id !== id);
    if (this.reports.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }
}

module.exports = new WeeklyReportStore();
