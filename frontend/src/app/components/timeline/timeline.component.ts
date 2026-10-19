import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';

interface MonthTick {
  label: string;
  yearMonth: string;
  leftPercent: number;
  widthPercent: number;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-6">
      <!-- Header with info -->
      <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Linha do Tempo Comparativa (Gantt Executivo)</span>
            <span class="text-xs font-medium text-slate-500">
              ({{ service.filteredProjects().length }} projetos exibidos)
            </span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Compare o <strong class="text-slate-700">Acordo Firmado (Linha Superior tracejada)</strong> com o <strong class="text-blue-700">Executado / Planejado (Barra colorida)</strong>.
          </p>
        </div>

        <!-- Legend -->
        <div class="flex flex-col sm:items-end gap-1.5 text-[11px] font-semibold text-slate-600">
          <div class="flex items-center flex-wrap gap-3">
            <div class="flex items-center gap-1.5">
              <span class="w-3.5 h-1.5 rounded-full bg-slate-400 border border-slate-500 border-dashed"></span>
              <span>Acordo Firmado</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-emerald-500"></span>
              <span>No Prazo</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-amber-500"></span>
              <span>Atenção</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-rose-500"></span>
              <span>Com Desvio</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300"></span>
              <span>Data Hoje</span>
            </div>
          </div>
          <div class="flex items-center flex-wrap gap-1.5 text-[10px]">
            <span class="font-bold text-slate-400 uppercase tracking-wider text-[9px] mr-0.5">Etapas:</span>
            <span class="px-1.5 py-0.2 rounded font-semibold bg-purple-50 text-purple-700 border border-purple-200">Planejamento</span>
            <span class="px-1.5 py-0.2 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">Desenvolvimento</span>
            <span class="px-1.5 py-0.2 rounded font-semibold bg-orange-50 text-orange-700 border border-orange-200">Homologação</span>
            <span class="px-1.5 py-0.2 rounded font-semibold bg-teal-50 text-teal-700 border border-teal-200">Treinamento</span>
            <span class="px-1.5 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Operação Assistida</span>
          </div>
        </div>
      </div>

      <!-- Gantt Canvas Container -->
      <div class="overflow-x-auto min-w-full">
        <div class="min-w-[900px]">
          <!-- Time scale header ruler -->
          <div class="flex border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-600 sticky top-0 z-10">
            <!-- Project info column title -->
            <div class="w-72 shrink-0 p-3 border-r border-slate-200 uppercase tracking-wider text-slate-500">
              Projeto / Cliente / Marco
            </div>
            <!-- Months ruler -->
            <div class="flex-1 relative h-9">
              <div
                *ngFor="let m of monthTicks()"
                class="absolute top-0 bottom-0 border-r border-slate-200/80 px-2 flex items-center justify-center text-slate-600 font-semibold"
                [style.left.%]="m.leftPercent"
                [style.width.%]="m.widthPercent">
                {{ m.label }}
              </div>
              <!-- Today line header pin -->
              <div
                *ngIf="todayPercent() >= 0 && todayPercent() <= 100"
                class="absolute top-0 bottom-0 z-20 flex flex-col items-center"
                [style.left.%]="todayPercent()">
                <div class="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-b shadow-sm -mt-0.5 whitespace-nowrap">
                  HOJE
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div *ngIf="service.filteredProjects().length === 0" class="py-16 text-center text-slate-400 text-xs">
            Nenhum projeto encontrado para os filtros selecionados.
          </div>

          <!-- Project Rows -->
          <div class="divide-y divide-slate-100">
            <div
              *ngFor="let p of service.filteredProjects()"
              class="flex items-center hover:bg-slate-50/80 transition group relative">
              <!-- Left Project Details -->
              <div class="w-72 shrink-0 p-3 border-r border-slate-100 flex flex-col justify-center">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition" [title]="p.name">
                    {{ p.name }}
                  </span>
                  <span
                    [ngClass]="getRagBadgeClass(p.ragStatus)"
                    class="w-2 h-2 rounded-full shrink-0"
                    [title]="'Saúde: ' + p.ragStatus">
                  </span>
                </div>
                <div class="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                  <span class="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{{ p.client }}</span>
                  <span>•</span>
                  <span [ngClass]="service.getMilestoneBadgeClass(p.currentMilestone)" class="px-1.5 py-0.5 rounded font-semibold text-[10px]">{{ p.currentMilestone }}</span>
                </div>
              </div>

              <!-- Right Gantt Bar Area -->
              <div class="flex-1 relative h-20 flex flex-col justify-center px-2">
                <!-- Background month vertical grid lines -->
                <div
                  *ngFor="let m of monthTicks()"
                  class="absolute top-0 bottom-0 border-r border-slate-100 pointer-events-none"
                  [style.left.%]="m.leftPercent + m.widthPercent">
                </div>

                <!-- Today vertical line across row -->
                <div
                  *ngIf="todayPercent() >= 0 && todayPercent() <= 100"
                  class="absolute top-0 bottom-0 w-0.5 bg-blue-500/80 pointer-events-none z-10"
                  [style.left.%]="todayPercent()">
                </div>

                <!-- 1. Top Bar: Acordo Firmado (Baseline) -->
                <div class="relative h-3 mb-1.5">
                  <div
                    class="absolute h-2.5 rounded-full border border-slate-400 bg-slate-200/70 border-dashed text-[9px] text-slate-600 flex items-center px-1.5 overflow-hidden whitespace-nowrap shadow-xs"
                    [style.left.%]="getBarCoordinates(p.agreedDates.start, p.agreedDates.end).left"
                    [style.width.%]="getBarCoordinates(p.agreedDates.start, p.agreedDates.end).width"
                    [title]="'Acordo Firmado: ' + formatDate(p.agreedDates.start) + ' até ' + formatDate(p.agreedDates.end)">
                    <span class="truncate">Acordo: {{ formatDateShort(p.agreedDates.start) }} - {{ formatDateShort(p.agreedDates.end) }}</span>
                  </div>
                </div>

                <!-- 2. Bottom Bar: Real / Planejado -->
                <div class="relative h-6">
                  <div
                    [ngClass]="getBarBgClass(p)"
                    class="absolute h-5 rounded-lg shadow-sm flex items-center px-2 text-white text-[10px] font-bold overflow-hidden transition-all"
                    [style.left.%]="getBarCoordinates(p.plannedDates.start, (p.executedDates.end || p.plannedDates.end)).left"
                    [style.width.%]="getBarCoordinates(p.plannedDates.start, (p.executedDates.end || p.plannedDates.end)).width"
                    [title]="getTooltipText(p)">
                    <!-- Progress fill inside bar -->
                    <div
                      class="absolute left-0 top-0 bottom-0 bg-white/20 rounded-l-lg pointer-events-none"
                      [style.width.%]="p.progress">
                    </div>
                    <!-- Label inside bar -->
                    <span class="relative z-10 truncate drop-shadow-xs">
                      {{ p.progress }}% • {{ formatDateShort(p.plannedDates.start) }} - {{ formatDateShort(p.executedDates.end || p.plannedDates.end) }}
                    </span>
                  </div>

                  <!-- Variance Pill indicator -->
                  <div
                    class="absolute top-0.5 -mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs ml-2 whitespace-nowrap flex items-center gap-1"
                    [ngClass]="getVarianceClass(p.varianceDays)"
                    [style.left.%]="getVariancePillPosition(p)">
                    <span *ngIf="p.varianceDays > 0">+{{ p.varianceDays }}d desvio</span>
                    <span *ngIf="p.varianceDays === 0">No prazo</span>
                    <span *ngIf="p.varianceDays < 0">{{ p.varianceDays }}d adiantado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TimelineComponent {
  service = inject(ProjectService);

  // Time window bounds
  private timeWindow = computed(() => {
    const list = this.service.projects();
    let minDate = new Date();
    let maxDate = new Date();

    // Default 1 year from now
    maxDate.setMonth(maxDate.getMonth() + 6);
    minDate.setMonth(minDate.getMonth() - 6);

    for (const p of list) {
      if (p.agreedDates?.start) {
        const d = new Date(p.agreedDates.start);
        if (d < minDate) minDate = d;
      }
      if (p.plannedDates?.start) {
        const d = new Date(p.plannedDates.start);
        if (d < minDate) minDate = d;
      }
      if (p.agreedDates?.end) {
        const d = new Date(p.agreedDates.end);
        if (d > maxDate) maxDate = d;
      }
      const plannedEnd = p.executedDates?.end || p.plannedDates?.end;
      if (plannedEnd) {
        const d = new Date(plannedEnd);
        if (d > maxDate) maxDate = d;
      }
    }

    // Round min to 1st of month, max to end of month
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    return { start, end, totalMs: end.getTime() - start.getTime() };
  });

  monthTicks = computed<MonthTick[]>(() => {
    const { start, end, totalMs } = this.timeWindow();
    const ticks: MonthTick[] = [];
    const cur = new Date(start);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    while (cur <= end) {
      const monthStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
      const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const monthEnd = nextMonth > end ? end : nextMonth;

      const left = ((monthStart.getTime() - start.getTime()) / totalMs) * 100;
      const width = ((monthEnd.getTime() - monthStart.getTime()) / totalMs) * 100;

      ticks.push({
        label: `${monthNames[cur.getMonth()]}/${String(cur.getFullYear()).slice(2)}`,
        yearMonth: `${cur.getFullYear()}-${cur.getMonth()}`,
        leftPercent: Math.max(0, left),
        widthPercent: width
      });

      cur.setMonth(cur.getMonth() + 1);
    }
    return ticks;
  });

  todayPercent = computed(() => {
    const { start, totalMs } = this.timeWindow();
    const now = new Date();
    return ((now.getTime() - start.getTime()) / totalMs) * 100;
  });

  getBarCoordinates(startStr?: string, endStr?: string | null) {
    const { start: windowStart, totalMs } = this.timeWindow();
    if (!startStr) return { left: 0, width: 5 };

    const startDate = new Date(startStr);
    const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 60 * 24 * 3600 * 1000);

    let left = ((startDate.getTime() - windowStart.getTime()) / totalMs) * 100;
    let width = ((endDate.getTime() - startDate.getTime()) / totalMs) * 100;

    if (left < 0) {
      width += left;
      left = 0;
    }
    width = Math.max(width, 2.5); // Minimum width for visibility
    return { left, width };
  }

  getVariancePillPosition(p: Project) {
    const coords = this.getBarCoordinates(p.plannedDates.start, p.executedDates.end || p.plannedDates.end);
    return Math.min(coords.left + coords.width + 0.5, 92);
  }

  getBarBgClass(p: Project) {
    if (p.status === 'Finalizado') return 'bg-emerald-600';
    if (p.status === 'Congelado') return 'bg-slate-500';
    if (p.ragStatus === 'red') return 'bg-rose-600';
    if (p.ragStatus === 'amber') return 'bg-amber-500';
    return 'bg-blue-600';
  }

  getRagBadgeClass(rag: string) {
    if (rag === 'red') return 'bg-rose-500 ring-2 ring-rose-300';
    if (rag === 'amber') return 'bg-amber-500 ring-2 ring-amber-300';
    return 'bg-emerald-500 ring-2 ring-emerald-300';
  }

  getVarianceClass(variance: number) {
    if (variance > 7) return 'bg-rose-100 text-rose-800 border border-rose-200';
    if (variance > 0) return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (variance < 0) return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
    return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  }

  formatDate(dateStr?: string | null) {
    if (!dateStr) return 'Não definida';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  }

  formatDateShort(dateStr?: string | null) {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}`;
    } catch {
      return dateStr;
    }
  }

  getTooltipText(p: Project) {
    const targetEnd = p.executedDates.end || p.plannedDates.end;
    return `${p.name}\nCliente: ${p.client}\nMarco Atual: ${p.currentMilestone}\nInício: ${this.formatDate(p.plannedDates.start)}\nTérmino: ${this.formatDate(targetEnd)}\nProgresso: ${p.progress}%`;
  }
}
