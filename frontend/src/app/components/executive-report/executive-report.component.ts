import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiltersComponent } from '../filters/filters.component';
import { ProjectService } from '../../services/project.service';
import { WeeklyReportProject, RoadmapProject, BoardDecision } from '../../models/weekly-report.model';

@Component({
  selector: 'app-executive-report',
  standalone: true,
  imports: [CommonModule, FormsModule, FiltersComponent],
  template: `
    <div
      [ngClass]="{
        'fixed inset-0 z-50 bg-slate-100 text-slate-900 overflow-y-auto p-4 sm:p-8 space-y-5': service.presentationMode(),
        'space-y-5 mb-10': !service.presentationMode()
      }"
      class="print:p-0 print:bg-white print:text-slate-900 transition-all font-sans">

      <!-- ======================================================== -->
      <!-- TOP EXECUTIVE CONTROL BAR                                -->
      <!-- ======================================================== -->
      <div
        class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 print:hidden">
        
        <!-- Left: Co-branding & Title -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
            📊
          </div>
          <div class="flex flex-col">
            <!-- Linha 1 -->
            <h1 class="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight">
              Status Report
            </h1>
            <!-- Linha 2 -->
            <p class="text-[11px] font-semibold text-slate-700 mt-0.5">
              Edição {{ service.formatEditionTitle(currentReport()) }}
            </p>
            <!-- Linha 3 -->
            <p class="text-[11px] text-slate-500 mt-0.5">
              Período {{ currentReport()?.period }}
            </p>
          </div>
        </div>

        <!-- Right: Actions & Edition Dropdown -->
        <div class="flex items-center flex-wrap gap-2">
          
          <!-- Dropdown da Edição -->
          <select
            [ngModel]="service.selectedReportId()"
            (ngModelChange)="onSelectReport($event)"
            class="text-[11px] font-bold rounded-xl px-2.5 py-1.5 border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer">
            <option *ngFor="let rep of service.weeklyReports()" [value]="rep.id">
              {{ service.formatEditionTitle(rep) }}
            </option>
          </select>

          <!-- Presentation Mode Button -->
          <button
            (click)="service.togglePresentationMode()"
            class="px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            [ngClass]="service.presentationMode() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'">
            <span>{{ service.presentationMode() ? '✕ Fechar Apresentação' : '🖥️ Modo Apresentação' }}</span>
          </button>

          <!-- Print / PDF Button -->
          <button
            (click)="printReport()"
            class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer">
            <span>🖨️ PDF</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="service.isLoadingReport()" class="py-16 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p class="mt-2 text-xs font-semibold text-slate-400">Carregando edição executiva...</p>
      </div>

      <div *ngIf="!service.isLoadingReport() && currentReport()" class="space-y-5">

        <!-- ======================================================== -->
        <!-- 1. HERO BANNER: HEADLINE & EXECUTIVE PULSE KPIS (LIGHT)  -->
        <!-- ======================================================== -->
        <div class="rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-2xs p-4 sm:p-5 transition-all">
          
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <!-- Left: Headline Statement -->
            <div class="max-w-2xl">
              <div class="flex items-center gap-2 mb-1.5 text-[10px] font-bold text-blue-700 tracking-wider uppercase">
                <span>🗓️ Emissão: {{ formatDate(currentReport()?.meetingDate) }}</span>
                <span>•</span>
                <span>Ciclo Semanal Oficial</span>
              </div>
              <h2 class="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                {{ currentReport()?.executiveSummary }}
              </h2>
            </div>

            <!-- Right: 4 Sleek Pulse Metrics (Light Theme) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <!-- Active Projects -->
              <div class="px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-center min-w-[95px] shadow-2xs">
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Projetos Ativos</span>
                <span class="text-xl font-black text-slate-900 block mt-0.5">
                  {{ currentReport()?.statusPulse?.totalActive || 0 }}
                </span>
                <span class="text-[9px] text-slate-500 font-medium">100% monitorados</span>
              </div>

              <!-- On Track -->
              <div class="px-3.5 py-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-center min-w-[95px] shadow-2xs">
                <span class="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">No Prazo</span>
                <span class="text-xl font-black text-emerald-700 block mt-0.5">
                  {{ currentReport()?.statusPulse?.onTrack || 0 }}
                </span>
                <span class="text-[9px] text-emerald-700 font-medium">
                  {{ getPercent(currentReport()?.statusPulse?.onTrack, currentReport()?.statusPulse?.totalActive) }}% do portfólio
                </span>
              </div>

              <!-- Attention & Critical -->
              <div class="px-3.5 py-2.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-center min-w-[95px] shadow-2xs">
                <span class="text-[9px] font-bold text-rose-800 uppercase tracking-wider block">Em Alerta / Desvio</span>
                <span class="text-xl font-black text-rose-700 block mt-0.5">
                  {{ (currentReport()?.statusPulse?.critical || 0) + (currentReport()?.statusPulse?.attention || 0) }}
                </span>
                <span class="text-[9px] text-rose-700 font-medium">
                  {{ getPercent((currentReport()?.statusPulse?.critical || 0) + (currentReport()?.statusPulse?.attention || 0), currentReport()?.statusPulse?.totalActive) }}% demandam foco
                </span>
              </div>

              <!-- Average Progress -->
              <div class="px-3.5 py-2.5 bg-blue-50/70 rounded-xl border border-blue-200/80 text-center min-w-[95px] shadow-2xs">
                <span class="text-[9px] font-bold text-blue-800 uppercase tracking-wider block">Avanço Médio</span>
                <span class="text-xl font-black text-blue-700 block mt-0.5">
                  {{ currentReport()?.statusPulse?.averageProgress || 0 }}%
                </span>
                <span class="text-[9px] text-blue-700 font-medium">conclusão física</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- 2. RADAR DE ATENÇÃO IMEDIATA DA DIRETORIA (CAUSA)        -->
        <!-- ======================================================== -->
        <div *ngIf="topCriticalProjects().length > 0"
          class="rounded-2xl border border-rose-200/90 bg-rose-50/50 p-4 sm:p-5 transition-all">
          
          <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-rose-200/60">
            <div class="flex items-center gap-2">
              <span class="text-xs">🚨</span>
              <h3 class="text-xs sm:text-sm font-black tracking-tight text-rose-950">
                Radar de Atenção Imediata da Diretoria ({{ topCriticalProjects().length }} Projetos com Desvio ou Atenção Crítica)
              </h3>
            </div>
            <span class="text-[10px] font-bold text-rose-700">
              Itens prioritários para deliberação na reunião de hoje
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              *ngFor="let item of topCriticalProjects()"
              class="p-3.5 rounded-xl border border-rose-200 bg-white text-slate-800 shadow-2xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span class="text-[10px] font-bold text-slate-500">{{ item.client }}</span>
                  <span class="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {{ item.ragStatus === 'red' ? 'Com Desvio' : 'Atenção' }}
                  </span>
                </div>
                <h4 class="text-xs font-black leading-snug truncate" [title]="item.name">{{ item.name }}</h4>
                <p class="text-[11px] text-rose-900 mt-1.5 leading-snug font-medium line-clamp-3">
                  {{ item.attentionPoints }}
                </p>
              </div>
              <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Fase: <strong class="text-slate-700">{{ item.currentMilestone }}</strong></span>
                <span class="font-bold text-rose-600">{{ item.progress }}% concluído</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- 3. DELIBERAÇÕES & DECISÕES DA DIRETORIA (EFEITO / AÇÃO)  -->
        <!-- ======================================================== -->
        <div
          class="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-4 sm:p-5 transition-all">
          
          <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-amber-200/60">
            <div class="flex items-center gap-2">
              <span class="text-xs">⚖️</span>
              <h3 class="text-xs sm:text-sm font-black tracking-tight text-amber-950">
                Deliberações & Decisões Esperadas da Diretoria ({{ currentReport()?.boardDecisions?.length || 0 }})
              </h3>
            </div>
            <span class="text-[10px] font-bold text-amber-800">
              Pauta prioritária para deliberação executiva
            </span>
          </div>

          <!-- Decisions List / Grid -->
          <div *ngIf="currentReport()?.boardDecisions?.length; else emptyDecisions"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              *ngFor="let dec of currentReport()?.boardDecisions"
              class="p-3.5 rounded-xl border border-amber-200 bg-white text-slate-800 shadow-2xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span class="text-[10px] font-bold text-slate-500 uppercase">{{ dec.client }}</span>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    [ngClass]="dec.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'">
                    {{ dec.status }}
                  </span>
                </div>
                <h4 class="text-xs font-black leading-snug text-slate-900">
                  {{ dec.title }}
                </h4>
                <p class="text-[11px] text-amber-950/80 leading-snug mt-1.5 font-medium">
                  {{ dec.impact }}
                </p>
              </div>
              <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Prazo:</span>
                <strong class="text-amber-800 font-bold">{{ dec.deadline }}</strong>
              </div>
            </div>
          </div>
          <ng-template #emptyDecisions>
            <p class="text-xs text-amber-800/70 italic py-2">Nenhuma deliberação registrada para esta semana.</p>
          </ng-template>

        </div>

        <!-- ======================================================== -->
        <!-- 4. PROJETOS NO RADAR & ROADMAP ESTRATÉGICO (FUTURO)      -->
        <!-- ======================================================== -->
        <div
          class="rounded-2xl border border-blue-200/90 bg-blue-50/50 p-4 sm:p-5 transition-all">
          
          <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-blue-200/60">
            <div class="flex items-center gap-2">
              <span class="text-xs">🔭</span>
              <h3 class="text-xs sm:text-sm font-black tracking-tight text-blue-950">
                Projetos no Radar & Roadmap Estratégico ({{ currentReport()?.roadmapProjects?.length || 0 }})
              </h3>
            </div>
            <span class="text-[10px] font-bold text-blue-700">
              Pipeline de novas demandas e expansões
            </span>
          </div>

          <!-- Roadmap Cards Grid (responsive: 1 col on mobile, 2 sm, 3 md, up to 5 on xl) -->
          <div *ngIf="currentReport()?.roadmapProjects?.length; else emptyRoadmap"
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <div
              *ngFor="let road of currentReport()?.roadmapProjects"
              class="p-3.5 rounded-xl border border-blue-200 bg-white text-slate-800 shadow-2xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800">
                    {{ road.client }}
                  </span>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    [ngClass]="getRoadmapStageClass(road.stage)">
                    {{ road.stage }}
                  </span>
                </div>
                <h4 class="text-xs font-black truncate leading-snug text-slate-900"
                  [title]="road.name">
                  {{ road.name }}
                </h4>
                <p class="text-[10px] leading-snug line-clamp-2 mt-1 text-slate-600 font-medium">
                  {{ road.description }}
                </p>
              </div>
              <div class="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500">
                <span>Início: <strong class="text-slate-700">{{ road.estimatedStart }}</strong></span>
                <span class="font-extrabold text-blue-700">{{ road.strategicValue }}</span>
              </div>
            </div>
          </div>
          <ng-template #emptyRoadmap>
            <p class="text-xs text-blue-800/70 italic py-2">Nenhum projeto em roadmap nesta edição.</p>
          </ng-template>

        </div>

        <!-- ======================================================== -->
        <!-- 4. BARRA DE FILTROS & BUSCA DO PORTFÓLIO                 -->
        <!-- ======================================================== -->
        <div class="pt-4 sm:pt-6">
          <app-filters></app-filters>
        </div>

        <!-- ======================================================== -->
        <!-- 5. CARDS EXECUTIVOS DOS PROJETOS                         -->
        <!-- ======================================================== -->
        <div *ngIf="displayedProjects().length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          <div
            *ngFor="let p of displayedProjects()"
            class="rounded-2xl border border-slate-200/90 bg-white p-4 flex flex-col justify-between transition-all hover:shadow-xs">
            
            <div>
              <!-- Card Top -->
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <!-- Priority Pill -->
                  <span
                    class="text-[9px] font-black px-1.5 py-0.2 rounded border shadow-2xs shrink-0 cursor-default"
                    [ngClass]="service.getPriorityBadgeClass(p.priority || 'P2')"
                    [title]="'Prioridade ' + (p.priority || 'P2') + ' (' + service.getPriorityLabel(p.priority || 'P2') + ')'">
                    {{ p.priority || 'P2' }}
                  </span>
                  <span class="text-[10px] font-bold px-1.5 py-0.2 rounded border bg-slate-100 border-slate-200 text-slate-700">
                    {{ p.client }}
                  </span>
                  <span [ngClass]="service.getMilestoneBadgeClass(p.currentMilestone)" class="px-2 py-0.2 rounded font-semibold text-[10px]">
                    {{ p.currentMilestone }}
                  </span>
                </div>
                <span
                  class="px-2 py-0.2 rounded-full text-[10px] font-extrabold shrink-0"
                  [ngClass]="getRagPillClass(p.ragStatus)">
                  {{ p.ragStatus === 'red' ? 'Desvio' : (p.ragStatus === 'amber' ? 'Atenção' : 'No Prazo') }}
                </span>
              </div>

              <!-- Project Name -->
              <h4 class="text-xs sm:text-sm font-extrabold tracking-tight truncate leading-snug mb-1 text-slate-900"
                [title]="p.name">
                {{ p.name }}
              </h4>

              <!-- Systems Involved -->
              <div *ngIf="p.systems && p.systems.length > 0" class="flex flex-wrap items-center gap-1 mb-2.5">
                <span
                  *ngFor="let sys of p.systems"
                  [ngClass]="service.getSystemBadgeClass(sys)"
                  class="px-1.5 py-0.2 rounded text-[9px] font-bold border shadow-2xs">
                  {{ sys }}
                </span>
              </div>

              <!-- Progress bar -->
              <div class="mb-3">
                <div class="flex items-center justify-between text-[10px] font-bold mb-1 text-slate-500">
                  <span>Progresso</span>
                  <span class="font-black text-slate-800">{{ p.progress }}%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="h-full rounded-full"
                    [ngClass]="p.ragStatus === 'red' ? 'bg-rose-500' : (p.ragStatus === 'amber' ? 'bg-amber-500' : 'bg-blue-600')"
                    [style.width.%]="p.progress">
                  </div>
                </div>
              </div>

              <!-- Highlights paragraph -->
              <p class="text-[11px] leading-relaxed mb-2 text-slate-700">
                {{ p.statusReport }}
              </p>

              <!-- Attention Point callout if any -->
              <div *ngIf="p.ragStatus === 'red' || p.ragStatus === 'amber'"
                class="p-2 rounded-lg text-[10px] leading-snug mb-2 bg-rose-50 text-rose-900 border border-rose-200">
                <strong>⚠️ Ponto de Atenção:</strong> {{ p.attentionPoints }}
              </div>
            </div>

            <!-- Card Bottom -->
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Meta: <strong class="text-slate-600">{{ formatDate(p.targetDelivery) }}</strong></span>
              <button
                (click)="service.openEapForProject(p.projectId)"
                class="text-blue-600 font-bold hover:underline cursor-pointer">
                Ver EAP →
              </button>
            </div>

          </div>
        </div>

        <!-- Empty state when search or filters return 0 -->
        <div *ngIf="displayedProjects().length === 0"
          class="py-12 bg-white rounded-2xl border border-slate-200/90 text-center text-slate-400 text-xs shadow-2xs">
          Nenhum projeto encontrado para os filtros selecionados.
        </div>

      </div>
    </div>
  `
})
export class ExecutiveReportComponent {
  service = inject(ProjectService);

  currentReport = computed(() => this.service.currentWeeklyReport());

  displayedProjects = computed(() => {
    const report = this.currentReport();
    if (!report || !report.activeProjects) return [];

    const status = this.service.selectedStatus();
    const client = this.service.selectedClient();
    const priority = this.service.selectedPriority();
    const system = this.service.selectedSystem();
    const query = (this.service.searchQuery() || '').toLowerCase().trim();
    const sort = this.service.sortBy();

    let list = report.activeProjects.slice();

    // 1. Status Tab Filter (from FiltersComponent)
    if (status !== 'Todos' && status !== 'Ativo') {
      return []; // In Status Report, all projects in the active report are active
    }

    // 2. Client Dropdown Filter (from FiltersComponent)
    if (client !== 'Todos') {
      list = list.filter(p => p.client.toLowerCase() === client.toLowerCase());
    }

    // 3. Priority Dropdown Filter (from FiltersComponent)
    if (priority !== 'Todos') {
      list = list.filter(p => (p.priority || 'P2') === priority);
    }

    // 4. System Dropdown Filter (from FiltersComponent)
    if (system !== 'Todos') {
      list = list.filter(p => (p.systems || []).includes(system));
    }

    // 5. Search Input (from FiltersComponent)
    if (query) {
      list = list.filter(p => {
        const nameMatch = (p.name || '').toLowerCase().includes(query);
        const clientMatch = (p.client || '').toLowerCase().includes(query);
        const leaderMatch = (p.teamLeader || '').toLowerCase().includes(query);
        const systemMatch = (p.systems || []).some(s => s.toLowerCase().includes(query));
        const milestoneMatch = (p.currentMilestone || '').toLowerCase().includes(query);
        const statusReportMatch = (p.statusReport || '').toLowerCase().includes(query);
        const attentionMatch = (p.attentionPoints || '').toLowerCase().includes(query);
        return nameMatch || clientMatch || leaderMatch || systemMatch || milestoneMatch || statusReportMatch || attentionMatch;
      });
    }

    // 6. Sort Dropdown (from FiltersComponent)
    if (sort === 'priority') {
      const priorityOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
      list.sort((a, b) => {
        const pA = priorityOrder[a.priority || 'P2'] || 99;
        const pB = priorityOrder[b.priority || 'P2'] || 99;
        if (pA !== pB) return pA - pB;
        return (a.name || '').localeCompare(b.name || '', 'pt-BR');
      });
    } else if (sort === 'progress') {
      list.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    } else {
      // default: client (A-Z)
      list.sort((a, b) => {
        const cDiff = (a.client || '').localeCompare(b.client || '', 'pt-BR', { sensitivity: 'base' });
        if (cDiff !== 0) return cDiff;
        return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
      });
    }

    return list;
  });

  topCriticalProjects = computed(() => {
    const report = this.currentReport();
    if (!report || !report.activeProjects) return [];
    return report.activeProjects.filter(p => p.ragStatus === 'red' || p.ragStatus === 'amber').slice(0, 3);
  });

  getPercent(count?: number, total?: number): number {
    if (!count || !total || total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  onSelectReport(reportId: string) {
    this.service.loadWeeklyReport(reportId);
  }

  getRagPillClass(rag: string) {
    if (rag === 'red') return 'bg-rose-100 text-rose-800 border border-rose-200';
    if (rag === 'amber') return 'bg-amber-100 text-amber-800 border border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  }

  getRoadmapStageClass(stage: string) {
    const s = (stage || '').toLowerCase();
    if (s.includes('proposta')) return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
    if (s.includes('discovery')) return 'bg-sky-100 text-sky-800 border border-sky-200';
    if (s.includes('kick-off') || s.includes('iminente')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    return 'bg-amber-100 text-amber-800 border border-amber-200';
  }

  formatDate(dateStr?: string | null) {
    if (!dateStr) return 'Não definida';
    try {
      const [y, m, d] = dateStr.split('-');
      if (y && m && d) return `${d}/${m}/${y}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  printReport() {
    window.print();
  }
}
