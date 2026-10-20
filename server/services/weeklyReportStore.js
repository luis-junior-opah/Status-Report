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
      statusReport: mainHighlights || summary,
      attentionPoints: riskLine ? riskLine.replace('RISCOS:', '').trim() : (p.ragStatus === 'red' ? 'Revisão do caminho crítico necessária para conter desvio.' : 'Execução fluindo dentro dos marcos acordados.')
    };
  }

  // Tailored domain-specific summaries for each project
  const nameLower = name.toLowerCase();

  if (nameLower.includes('smart tracking')) {
    return {
      statusReport: 'Módulo de tracking e telemetria veicular 100% desenvolvido. Validação de homologação em campo com frotas parceiras.',
      attentionPoints: 'Aguardando validação dos testes operacionais com motoristas da frota dedicada.'
    };
  }
  if (nameLower.includes('ilc mobile')) {
    return {
      statusReport: 'Desenvolvimento das telas operacionais e serviços offline (41% concluído). Ajuste no fluxo de autenticação.',
      attentionPoints: 'Sincronização necessária com infraestrutura para liberação de build iOS de teste homologado.'
    };
  }
  if (nameLower.includes('gestão de demandas')) {
    return {
      statusReport: 'Fluxo central de abertura e aprovação de demandas estruturado (94%). Validação de usabilidade com gestores.',
      attentionPoints: 'Alinhamento dos critérios finais de aceite antes do encerramento da fase de planejamento.'
    };
  }
  if (nameLower.includes('integrator v0') || nameLower.includes('migração angular')) {
    return {
      statusReport: 'Homologação das telas legadas migradas para Angular (65%). Testes de regressão e validação de performance em curso.',
      attentionPoints: 'Mapeamento de inconsistências em rotinas legadas de faturamento e mensageria.'
    };
  }
  if (nameLower.includes('integrator')) {
    return {
      statusReport: 'Camada de mensageria e barramento de integração em construção (62%). Integrações com APIs legadas em validação.',
      attentionPoints: 'Revisão da alocação de desenvolvedores sênior para aceleração das rotas críticas.'
    };
  }
  if (nameLower.includes('smart x')) {
    return {
      statusReport: 'Evolução dos módulos de telemetria inteligente e conectividade veicular (46%). Sprint atual focado em microserviços.',
      attentionPoints: 'Atenção à cadência de entregas técnicas para garantir marco de entrega intermediário.'
    };
  }
  if (nameLower.includes('gestão embarcada') || nameLower.includes('ge -')) {
    return {
      statusReport: 'Revisão das regras de negócio e barramento dos módulos embarcados John Deere (44%).',
      attentionPoints: 'Priorização de alinhamento com a engenharia de produto John Deere sobre protocolos de comunicação.'
    };
  }
  if (nameLower.includes('adição de item na promessa')) {
    return {
      statusReport: 'Desenvolvimento e testes de sistema finalizados. Homologado junto à John Deere (68%).',
      attentionPoints: 'Agendamento do cronograma de capacitação e treinamento dos usuários operacionais.'
    };
  }
  if (nameLower.includes('frete expresso 2.0')) {
    return {
      statusReport: 'Módulo de parametrização de tarifas dinâmicas e cálculo de frete em fase final de desenvolvimento (44%).',
      attentionPoints: 'Aguardando homologação de credenciais do ambiente de homologação John Deere.'
    };
  }
  if (nameLower.includes('duplicação de pedidos')) {
    return {
      statusReport: 'Módulo de identificação e tratamento de duplicações homologado junto ao time de negócio John Deere (66%).',
      attentionPoints: 'Definição da janela de virada em produção e plano de treinamento da equipe.'
    };
  }
  if (nameLower.includes('projetos john deere')) {
    return {
      statusReport: 'Iniciação e alinhamento do portfólio de demandas do próximo ciclo com a diretoria John Deere.',
      attentionPoints: 'Aguardando fechamento da ordem de serviço para início do desenvolvimento técnico.'
    };
  }
  if (nameLower.includes('atualização de documentos')) {
    if (nameLower.includes('recusa')) {
      return {
        statusReport: 'Mapeamento da jornada de recusas de carga e regras fiscais finalizado. Wireframes em aprovação.',
        attentionPoints: 'Definição das regras de contingência operacional com a liderança Mirassol.'
      };
    }
    return {
      statusReport: 'Desenvolvimento dos módulos de upload, validação e custódia de CTe/NFe em reta final (93%).',
      attentionPoints: 'Correção de divergências em validação de schema XML de notas fiscais de terceiros.'
    };
  }
  if (nameLower.includes('input gestão de demandas')) {
    return {
      statusReport: 'Construção dos formulários dinâmicos e regras de validação concluída (97%). Em homologação.',
      attentionPoints: 'Ajuste final no envio de notificações automáticas via e-mail corporativo.'
    };
  }
  if (nameLower.includes('assinatura digital')) {
    return {
      statusReport: 'Planejamento da arquitetura de certificados digitais e conformidade jurídica ICP-Brasil (86%).',
      attentionPoints: 'Avaliação de custos de APIs de certificadora parceira junto à diretoria financeira.'
    };
  }
  if (nameLower.includes('videos treinamento')) {
    return {
      statusReport: 'Roteirização dos módulos de capacitação e segurança operacional (Safety) de motoristas em andamento.',
      attentionPoints: 'Aguardando validação dos roteiros técnicos com a equipe de SESMT da Mirassol.'
    };
  }
  if (nameLower.includes('cockpit petrobras')) {
    return {
      statusReport: 'Painel operacional em produção assistida (100%), garantindo visibilidade total das operações logísticas.',
      attentionPoints: 'Operação estabilizada sem incidentes de suporte registrados no ciclo.'
    };
  }
  if (nameLower.includes('boge')) {
    return {
      statusReport: 'Alinhamento inicial de escopo e levantamento de requisitos para automação da planta logística.',
      attentionPoints: 'Elaboração da proposta técnica e definição da data de kick-off do projeto piloto.'
    };
  }

  return {
    statusReport: `Projeto na fase de ${p.currentMilestone} com ${p.progress}% de avanço concluído.`,
    attentionPoints: p.ragStatus === 'red' ? 'Desvio acumulado no cronograma. Revisão de tarefas prioritárias em andamento.' : 'Atividades transcorrendo dentro dos parâmetros planejados.'
  };
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
    const active = allProjects
      .filter(p => p.status === 'Ativo' && p.isVisible)
      .sort((a, b) => projectStore.compareProjects(a, b));

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

    const mappedProjects = active.map(p => {
      if (p.ragStatus === 'red') critical++;
      else if (p.ragStatus === 'amber') attention++;
      else onTrack++;

      totalProgress += (p.progress || 0);

      const cleanName = (p.name || '').replace(/^Mirassol\s*-\s*/i, '').toLowerCase().trim();
      const existing = existingMap.get(p.id) ||
                       existingMap.get((p.name || '').toLowerCase().trim()) ||
                       existingMap.get(cleanName);

      const details = resolveProjectWeeklyDetails(p);
      const clientLogo = projectStore.getClientLogo ? projectStore.getClientLogo(p.client) : null;

      return {
        projectId: p.id,
        name: p.name,
        client: p.client,
        clientLogo: clientLogo,
        currentMilestone: p.currentMilestone || 'Planejamento',
        progress: p.progress || 0,
        ragStatus: p.ragStatus || 'green',
        agreedDelivery: p.agreedDates ? p.agreedDates.end : null,
        targetDelivery: p.executedDates?.end || p.plannedDates?.end || null,
        varianceDays: p.varianceDays || 0,
        statusReport: (existing && existing.statusReport) ? existing.statusReport : details.statusReport,
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
    const avgProgress = mappedProjects.length > 0 ? Math.round(totalProgress / mappedProjects.length) : 0;
    report.statusPulse = {
      totalActive: mappedProjects.length,
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
    const allProjects = projectStore.getAllProjects() || [];
    const active = allProjects
      .filter(p => p.status === 'Ativo' && p.isVisible)
      .sort((a, b) => projectStore.compareProjects(a, b));

    let onTrack = 0;
    let attention = 0;
    let critical = 0;
    let totalProgress = 0;

    const mappedProjects = active.map(p => {
      if (p.ragStatus === 'red') critical++;
      else if (p.ragStatus === 'amber') attention++;
      else onTrack++;

      totalProgress += (p.progress || 0);

      const details = resolveProjectWeeklyDetails(p);
      const clientLogo = projectStore.getClientLogo ? projectStore.getClientLogo(p.client) : null;

      return {
        projectId: p.id,
        name: p.name,
        client: p.client,
        clientLogo: clientLogo,
        currentMilestone: p.currentMilestone || 'Planejamento',
        progress: p.progress || 0,
        ragStatus: p.ragStatus || 'green',
        agreedDelivery: p.agreedDates ? p.agreedDates.end : null,
        targetDelivery: p.executedDates?.end || p.plannedDates?.end || null,
        varianceDays: p.varianceDays || 0,
        statusReport: details.statusReport,
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

    const avgProgress = mappedProjects.length > 0 ? Math.round(totalProgress / mappedProjects.length) : 0;

    // Determine current ISO week
    const now = new Date();
    const currentWeekNumber = 42; // October mid-month
    const id = `2026-W${currentWeekNumber}`;

    return {
      id: id,
      weekNumber: currentWeekNumber,
      year: 2026,
      title: `Semana ${currentWeekNumber} / 2026`,
      period: '13/10/2026 a 17/10/2026',
      meetingDate: now.toISOString().split('T')[0],
      executiveSummary: 'Visão executiva consolidada para a Reunião de Diretoria. Acompanhamento dos projetos estratégicos em andamento, riscos mapeados e pipeline no radar.',
      statusPulse: {
        totalActive: mappedProjects.length,
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
    if (!reportData || !reportData.id) {
      throw new Error('ID do relatório é obrigatório.');
    }
    const idx = this.reports.findIndex(r => r.id === reportData.id);
    if (idx >= 0) {
      this.reports[idx] = { ...this.reports[idx], ...reportData };
    } else {
      this.reports.unshift(reportData);
    }
    this.persist();
    return this.reports.find(r => r.id === reportData.id);
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
