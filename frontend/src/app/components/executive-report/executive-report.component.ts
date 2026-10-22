import { Component, inject, computed, signal, OnInit, HostListener } from '@angular/core';
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
    <div class="print:p-0 print:bg-white print:text-slate-900 transition-all font-sans mb-10">

      <!-- ======================================================== -->
      <!-- TOP EXECUTIVE CONTROL BAR (SCREEN ONLY)                  -->
      <!-- ======================================================== -->
      <div
        class="bg-white rounded-2xl border border-slate-300 shadow-xs px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5 print:hidden">
        
        <!-- Left: Co-branding & Title -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
            📊
          </div>
          <div class="flex flex-col">
            <h1 class="text-sm sm:text-base font-extrabold tracking-tight text-slate-950 leading-tight">
              Status Report
            </h1>
            <p class="text-[11px] font-bold text-slate-700 mt-0.5">
              Edição {{ service.formatEditionTitle(currentReport()) }}
            </p>
            <p class="text-[11px] text-slate-600 mt-0.5 font-medium">
              Período {{ currentReport()?.period }} • Emissão: {{ formatDate(currentReport()?.meetingDate) }}
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

          <!-- Theme Switcher Button -->
          <button
            (click)="togglePresentationTheme()"
            class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer border"
            [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-800' : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'"
            [title]="'Alternar tema da apresentação (atualmente ' + (presentationTheme() === 'dark' ? 'Escuro' : 'Claro') + ')'">
            <span>{{ presentationTheme() === 'dark' ? '🌙 Tema: Escuro' : '☀️ Tema: Claro' }}</span>
          </button>

          <!-- Presentation Mode Button (Opens interactive PPT 16:9 Landscape viewer) -->
          <button
            (click)="openPresenter()"
            class="px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer bg-slate-900 hover:bg-slate-800 text-white border border-slate-800"
            title="Apresentar em tela cheia slide a slide estilo PowerPoint">
            <span>🖥️ Apresentação PPT (Slides)</span>
          </button>

          <!-- Download PDF Landscape Button -->
          <button
            (click)="printReport()"
            class="px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer bg-blue-600 hover:bg-blue-700 text-white border border-blue-500"
            title="Baixar ou imprimir o relatório formatado em apresentação PPT Paisagem">
            <span>📥 Baixar PDF (PPT Paisagem)</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="service.isLoadingReport()" class="py-16 text-center print:hidden">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p class="mt-2 text-xs font-semibold text-slate-500">Carregando edição executiva...</p>
      </div>

      <!-- ======================================================== -->
      <!-- STANDARD REPORT VIEW (VISIBLE ON SCREEN, HIDDEN ON PRINT) -->
      <!-- ======================================================== -->
      <div *ngIf="!service.isLoadingReport() && currentReport()" class="standard-report-view space-y-5 print:hidden">

        <!-- 1. HERO BANNER: EXECUTIVE PULSE KPIS (HIGH CONTRAST) -->
        <div class="rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-xs p-4 sm:p-5 transition-all">
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 2xl:grid-cols-10 gap-2 w-full">
            <!-- 1. Ativos -->
            <div class="px-1.5 py-2 bg-slate-100 rounded-xl border border-slate-300 text-center shadow-2xs">
              <span class="text-[8px] font-bold text-slate-600 uppercase tracking-tight block truncate">Ativos</span>
              <span class="text-xl font-black text-slate-950 block mt-0.5">{{ getActiveCount() }}</span>
              <span class="text-[9px] text-slate-600 font-medium block truncate">em andamento</span>
            </div>

            <!-- 2. No Prazo -->
            <div class="px-1.5 py-2 bg-emerald-50 rounded-xl border border-emerald-300 text-center shadow-2xs">
              <span class="text-[8px] font-bold text-emerald-900 uppercase tracking-tight block truncate">No Prazo</span>
              <span class="text-xl font-black text-emerald-700 block mt-0.5">{{ getOnTrackCount() }}</span>
              <span class="text-[9px] text-emerald-800 font-semibold block truncate">{{ getPercent(getOnTrackCount(), getActiveCount()) }}% ativos</span>
            </div>

            <!-- 3. Em Atenção -->
            <div class="px-1.5 py-2 bg-amber-50 rounded-xl border border-amber-300 text-center shadow-2xs">
              <span class="text-[8px] font-bold text-amber-900 uppercase tracking-tight block truncate">Em Atenção</span>
              <span class="text-xl font-black text-amber-700 block mt-0.5">{{ getAttentionCount() }}</span>
              <span class="text-[9px] text-amber-800 font-semibold block truncate">risco moderado</span>
            </div>

            <!-- 4. Com Desvio -->
            <div class="px-1.5 py-2 bg-rose-50 rounded-xl border border-rose-300 text-center shadow-2xs">
              <span class="text-[8px] font-bold text-rose-900 uppercase tracking-tight block truncate">Com Desvio</span>
              <span class="text-xl font-black text-rose-700 block mt-0.5">{{ getCriticalCount() }}</span>
              <span class="text-[9px] text-rose-800 font-semibold block truncate">desvio crítico</span>
            </div>

            <!-- 5. Concluídos -->
            <div class="px-1.5 py-2 bg-teal-50 rounded-xl border border-teal-300 text-center shadow-2xs">
              <span class="text-[8px] font-bold text-teal-900 uppercase tracking-tight block truncate">Concluídos</span>
              <span class="text-xl font-black text-teal-700 block mt-0.5">{{ getCompletedCount() }}</span>
              <span class="text-[9px] text-teal-800 font-semibold block truncate">entregas feitas</span>
            </div>

            <!-- 6. Congelados -->
            <div class="px-1.5 py-2 bg-slate-200/80 rounded-xl border border-slate-300 text-center shadow-2xs">
              <span class="text-[8px] font-bold text-slate-700 uppercase tracking-tight block truncate">Congelados</span>
              <span class="text-xl font-black text-slate-700 block mt-0.5">{{ getFrozenCount() }}</span>
              <span class="text-[9px] text-slate-600 font-medium block truncate">pausados</span>
            </div>

            <!-- 7. No radar -->
            <div class="px-1.5 py-2 bg-orange-50 rounded-xl border border-orange-300 text-center shadow-2xs">
              <span class="text-[8px] font-bold text-orange-900 uppercase tracking-tight block truncate">🚨 No radar</span>
              <span class="text-xl font-black text-orange-700 block mt-0.5">{{ topCriticalProjects().length }}</span>
              <span class="text-[9px] text-orange-800 font-semibold block truncate">radar diretoria</span>
            </div>

            <!-- 8. Deliberações -->
            <div class="px-1.5 py-2 bg-purple-50 rounded-xl border border-purple-300 text-center shadow-2xs">
              <span class="text-[8px] font-bold text-purple-900 uppercase tracking-tight block truncate">⚖️ Deliberações</span>
              <span class="text-xl font-black text-purple-800 block mt-0.5">{{ currentReport()?.boardDecisions?.length || 0 }}</span>
              <span class="text-[9px] text-purple-800 font-semibold block truncate">pautas diretoria</span>
            </div>

            <!-- 9. Roadmap -->
            <div class="px-1.5 py-2 bg-blue-50 rounded-xl border border-blue-300 text-center shadow-2xs">
              <span class="text-[8px] font-bold text-blue-900 uppercase tracking-tight block truncate">🔭 Roadmap</span>
              <span class="text-xl font-black text-blue-700 block mt-0.5">{{ currentReport()?.roadmapProjects?.length || 0 }}</span>
              <span class="text-[9px] text-blue-800 font-semibold block truncate">pipeline futuro</span>
            </div>

            <!-- 10. Avanço Médio -->
            <div class="px-1.5 py-2 bg-slate-100 rounded-xl border border-slate-300 text-center shadow-2xs">
              <span class="text-[8px] font-bold text-slate-700 uppercase tracking-tight block truncate">Avanço Médio</span>
              <span class="text-xl font-black text-blue-700 block mt-0.5">{{ getAverageProgress() }}%</span>
              <span class="text-[9px] text-slate-600 font-medium block truncate">conclusão física</span>
            </div>
          </div>

          <!-- Priority Distribution Bar -->
          <div class="mt-4 pt-3.5 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs">🎯</span>
              <span class="text-xs font-black text-slate-950 tracking-tight">Projetos por Prioridade:</span>
              <button
                *ngIf="service.selectedPriority() !== 'Todos'"
                type="button"
                (click)="service.selectedPriority.set('Todos')"
                class="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline ml-1 cursor-pointer">
                (Limpar filtro: {{ service.selectedPriority() }})
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                (click)="togglePriorityFilter('P1')"
                [ngClass]="service.selectedPriority() === 'P1' ? 'ring-2 ring-rose-500 bg-rose-100 border-rose-400' : 'bg-rose-50 hover:bg-rose-100 border-rose-300'"
                class="px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span>
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-rose-900 uppercase tracking-wider leading-none">P1 • Crítica</span>
                    <span class="text-[9px] text-rose-700 font-semibold mt-0.5 leading-none">Urgência máxima</span>
                  </div>
                </div>
                <span class="text-base font-black text-rose-700 leading-none">{{ getPriorityCount('P1') }}</span>
              </button>

              <button
                type="button"
                (click)="togglePriorityFilter('P2')"
                [ngClass]="service.selectedPriority() === 'P2' ? 'ring-2 ring-amber-500 bg-amber-100 border-amber-400' : 'bg-amber-50 hover:bg-amber-100 border-amber-300'"
                class="px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-amber-900 uppercase tracking-wider leading-none">P2 • Alta</span>
                    <span class="text-[9px] text-amber-700 font-semibold mt-0.5 leading-none">Impacto direto</span>
                  </div>
                </div>
                <span class="text-base font-black text-amber-800 leading-none">{{ getPriorityCount('P2') }}</span>
              </button>

              <button
                type="button"
                (click)="togglePriorityFilter('P3')"
                [ngClass]="service.selectedPriority() === 'P3' ? 'ring-2 ring-blue-500 bg-blue-100 border-blue-400' : 'bg-blue-50 hover:bg-blue-100 border-blue-300'"
                class="px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-blue-900 uppercase tracking-wider leading-none">P3 • Média</span>
                    <span class="text-[9px] text-blue-700 font-semibold mt-0.5 leading-none">Evolução regular</span>
                  </div>
                </div>
                <span class="text-base font-black text-blue-700 leading-none">{{ getPriorityCount('P3') }}</span>
              </button>

              <button
                type="button"
                (click)="togglePriorityFilter('P4')"
                [ngClass]="service.selectedPriority() === 'P4' ? 'ring-2 ring-slate-500 bg-slate-200 border-slate-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-300'"
                class="px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-slate-800 uppercase tracking-wider leading-none">P4 • Baixa</span>
                    <span class="text-[9px] text-slate-600 font-semibold mt-0.5 leading-none">Demanda rotina</span>
                  </div>
                </div>
                <span class="text-base font-black text-slate-700 leading-none">{{ getPriorityCount('P4') }}</span>
              </button>
            </div>
          </div>

          <!-- Systems Distribution Bar -->
          <div *ngIf="systemMetrics().length > 0"
            class="mt-3.5 pt-3.5 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs">🖥️</span>
              <span class="text-xs font-black text-slate-950 tracking-tight">Projetos por Sistema:</span>
              <button
                *ngIf="service.selectedSystem() !== 'Todos'"
                type="button"
                (click)="service.selectedSystem.set('Todos')"
                class="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline ml-1 cursor-pointer">
                (Limpar filtro: {{ service.selectedSystem() }})
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <button
                *ngFor="let s of systemMetrics()"
                type="button"
                (click)="toggleSystemFilter(s.name)"
                [ngClass]="service.selectedSystem() === s.name ? s.activeClass : s.idleClass"
                class="px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-2xs">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-xs shrink-0">{{ s.icon }}</span>
                  <span class="text-[10px] font-black truncate leading-tight" [ngClass]="s.textClass">{{ s.name }}</span>
                </div>
                <span class="text-base font-black leading-none shrink-0" [ngClass]="s.countClass">{{ s.count }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. RADAR DE ATENÇÃO IMEDIATA DA DIRETORIA -->
        <div *ngIf="topCriticalProjects().length > 0"
          class="rounded-2xl border-2 border-orange-300 bg-orange-50/70 p-4 sm:p-5 transition-all">
          <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-orange-300">
            <div class="flex items-center gap-2">
              <span class="text-xs">🚨</span>
              <h3 class="text-xs sm:text-sm font-black tracking-tight text-orange-950">
                Radar de Atenção Imediata da Diretoria ({{ topCriticalProjects().length }} Projetos com Desvio ou Ponto de Atenção)
              </h3>
            </div>
            <span class="text-[10px] font-extrabold text-orange-900">Itens prioritários para deliberação na reunião de hoje</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <div
              *ngFor="let item of topCriticalProjects()"
              class="p-3.5 rounded-xl border-2 border-orange-200 bg-white text-slate-900 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span class="text-[10px] font-black text-slate-700">{{ item.client }}</span>
                  <span class="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    [ngClass]="item.ragStatus === 'red' ? 'bg-rose-100 text-rose-900 border border-rose-300 font-extrabold' : 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'">
                    {{ item.ragStatus === 'red' ? 'Com Desvio' : 'Atenção' }}
                  </span>
                </div>
                <h4 class="text-xs font-black leading-snug truncate text-slate-950" [title]="item.name">{{ item.name }}</h4>
                <p class="text-[11px] text-slate-800 mt-1.5 leading-snug font-medium line-clamp-3">
                  {{ hasAttentionPoints(item) ? item.attentionPoints : (item.ragStatus === 'red' ? 'Projeto com desvio de prazo ou esforço em relação ao acordo firmado.' : 'Atenção gerencial recomendada.') }}
                </p>
              </div>
              <div class="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
                <span>Meta: <strong class="text-slate-900 font-bold">{{ formatDate(item.targetDelivery) }}</strong></span>
                <span class="font-black text-slate-900">{{ item.progress }}% concluído</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. DELIBERAÇÕES & DECISÕES DA DIRETORIA -->
        <div class="rounded-2xl border-2 border-purple-300 bg-purple-50/70 p-4 sm:p-5 transition-all">
          <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-purple-300">
            <div class="flex items-center gap-2">
              <span class="text-xs">⚖️</span>
              <h3 class="text-xs sm:text-sm font-black tracking-tight text-purple-950">
                Deliberações & Decisões Estratégicas ({{ currentReport()?.boardDecisions?.length || 0 }})
              </h3>
            </div>
            <span class="text-[10px] font-extrabold text-purple-900">Decisões tomadas na reunião de diretoria</span>
          </div>

          <div *ngIf="currentReport()?.boardDecisions?.length; else emptyDecisions" class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              *ngFor="let dec of currentReport()?.boardDecisions"
              class="p-3.5 rounded-xl border-2 border-purple-200 bg-white text-slate-900 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-100 border border-purple-300 text-purple-900">
                    {{ dec.client }}
                  </span>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    [ngClass]="dec.status === 'approved' || dec.status === 'Alinhado' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold' : 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'">
                    {{ dec.status }}
                  </span>
                </div>
                <h4 class="text-xs font-black truncate leading-snug text-slate-950" [title]="dec.title">{{ dec.title }}</h4>
                <p class="text-[10px] leading-snug line-clamp-3 mt-1 text-slate-700 font-medium">{{ dec.impact || dec.description }}</p>
              </div>
              <div class="mt-2.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-600">
                <span>Prazo:</span>
                <strong class="text-purple-900 font-bold">{{ dec.deadline }}</strong>
              </div>
            </div>
          </div>
          <ng-template #emptyDecisions>
            <p class="text-xs text-purple-900 italic py-2">Nenhuma deliberação registrada para esta semana.</p>
          </ng-template>
        </div>

        <!-- 4. PROJETOS NO RADAR & ROADMAP ESTRATÉGICO -->
        <div class="rounded-2xl border-2 border-blue-300 bg-blue-50/70 p-4 sm:p-5 transition-all">
          <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-blue-300">
            <div class="flex items-center gap-2">
              <span class="text-xs">🔭</span>
              <h3 class="text-xs sm:text-sm font-black tracking-tight text-blue-950">
                Projetos no Radar & Roadmap Estratégico ({{ currentReport()?.roadmapProjects?.length || 0 }})
              </h3>
            </div>
            <span class="text-[10px] font-extrabold text-blue-900">Pipeline de novas demandas e expansões</span>
          </div>

          <div *ngIf="currentReport()?.roadmapProjects?.length; else emptyRoadmap"
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <div
              *ngFor="let road of currentReport()?.roadmapProjects"
              class="p-3.5 rounded-xl border-2 border-blue-200 bg-white text-slate-900 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-100 border border-blue-300 text-blue-900">{{ road.client }}</span>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full" [ngClass]="getRoadmapStageClass(road.stage)">{{ road.stage }}</span>
                </div>
                <h4 class="text-xs font-black truncate leading-snug text-slate-950" [title]="road.name">{{ road.name }}</h4>
                <p class="text-[10px] leading-snug line-clamp-2 mt-1 text-slate-700 font-medium">{{ road.description }}</p>
              </div>
              <div class="mt-2.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-600">
                <span>Início: <strong class="text-slate-800">{{ road.estimatedStart }}</strong></span>
                <span class="text-[9px] px-2 py-0.5 rounded-full font-black border shadow-2xs"
                  [ngClass]="getStrategicValueBadgeClass(road.strategicValue)">
                  Valor: {{ road.strategicValue }}
                </span>
              </div>
            </div>
          </div>
          <ng-template #emptyRoadmap>
            <p class="text-xs text-blue-900 italic py-2">Nenhum projeto em roadmap nesta edição.</p>
          </ng-template>
        </div>

        <!-- 5. BARRA DE FILTROS & BUSCA DO PORTFÓLIO -->
        <div class="pt-4 sm:pt-6">
          <app-filters></app-filters>
        </div>

        <!-- 6. CARDS EXECUTIVOS DOS PROJETOS (HIGH CONTRAST) -->
        <div *ngIf="displayedProjects().length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          <div
            *ngFor="let p of displayedProjects()"
            class="rounded-2xl border-2 border-slate-300 bg-white p-4 flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    class="text-[9px] font-black px-1.5 py-0.2 rounded border shadow-2xs shrink-0 cursor-default"
                    [ngClass]="service.getPriorityBadgeClass(p.priority || 'P2')">
                    {{ p.priority || 'P2' }}
                  </span>
                  <img
                    *ngIf="p.clientLogo || service.getClientLogo(p.client)"
                    [src]="p.clientLogo || service.getClientLogo(p.client)"
                    [alt]="p.client"
                    class="h-4 max-w-[50px] object-contain rounded bg-white px-0.5 border border-slate-300 shadow-2xs"
                  />
                  <span
                    *ngIf="!p.clientLogo && !service.getClientLogo(p.client)"
                    class="text-[10px] font-black px-1.5 py-0.2 rounded border bg-slate-100 border-slate-300 text-slate-800">
                    {{ p.client }}
                  </span>
                  <span [ngClass]="service.getMilestoneBadgeClass(p.currentMilestone)" class="px-2 py-0.2 rounded font-bold text-[10px]">
                    {{ p.currentMilestone }}
                  </span>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span
                    *ngIf="p.status && p.status !== 'Ativo'"
                    class="px-2 py-0.2 rounded-full text-[10px] font-extrabold"
                    [ngClass]="p.status === 'Finalizado' ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-slate-200 text-slate-800 border border-slate-400'">
                    {{ p.status }}
                  </span>
                  <span
                    class="px-2 py-0.2 rounded-full text-[10px] font-extrabold shrink-0"
                    [ngClass]="getRagPillClass(p.ragStatus, p.status)">
                    {{ getRagLabel(p) }}
                  </span>
                </div>
              </div>

              <h4 class="text-xs sm:text-sm font-black tracking-tight truncate leading-snug mb-1 text-slate-950" [title]="p.name">
                {{ p.name }}
              </h4>

              <div *ngIf="p.systems && p.systems.length > 0" class="flex flex-wrap items-center gap-1 mb-2.5">
                <span
                  *ngFor="let sys of p.systems"
                  [ngClass]="service.getSystemBadgeClass(sys)"
                  class="px-1.5 py-0.2 rounded text-[9px] font-bold border shadow-2xs">
                  {{ sys }}
                </span>
              </div>

              <!-- Progresso Físico & Stepper Segmentado da EAP -->
              <div class="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <!-- Progresso Físico -->
                <div class="mb-2">
                  <div class="flex items-center justify-between text-[10px] font-bold mb-1 text-slate-600">
                    <span class="flex items-center gap-1">
                      <span>Progresso:</span>
                      <strong class="text-slate-950 font-black">{{ p.progress }}%</strong>
                    </span>
                    <span *ngIf="p.targetDelivery" class="text-slate-500 font-medium text-[9px]">
                      Meta: <strong class="text-slate-900 font-bold">{{ formatDate(p.targetDelivery) }}</strong>
                    </span>
                  </div>
                  <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      [ngClass]="p.status === 'Congelado' ? 'bg-slate-400' : (p.status === 'Finalizado' ? 'bg-emerald-600' : (p.ragStatus === 'red' ? 'bg-rose-500' : (p.ragStatus === 'amber' ? 'bg-amber-500' : 'bg-blue-600')))"
                      [style.width.%]="p.progress">
                    </div>
                  </div>
                </div>

                <!-- Stepper Segmentado EAP (5 Fases) -->
                <div class="pt-2 border-t border-slate-200/80">
                  <div class="flex items-center justify-between text-[9px] font-bold mb-1.5">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[9px] font-black uppercase tracking-wider text-slate-400">Etapa da EAP:</span>
                      <span class="font-black text-blue-700">{{ p.currentMilestone }}</span>
                    </div>
                    <span class="text-[9px] font-extrabold text-slate-500">
                      {{ getMilestoneStepLabel(p) }}
                    </span>
                  </div>
                  <div class="grid grid-cols-5 gap-1.5 text-center">
                    <div *ngFor="let m of milestones; let idx = index"
                      class="flex flex-col items-center group cursor-default"
                      [title]="(idx + 1) + '. ' + m">
                      <div
                        [ngClass]="getMilestoneStepClass(m, p.currentMilestone, p.status, 'light')"
                        class="w-full h-1.5 rounded-full transition-all">
                      </div>
                      <span
                        [ngClass]="getMilestoneLabelClass(m, p.currentMilestone, p.status, 'light')"
                        class="text-[8px] truncate w-full font-bold mt-0.5"
                        [title]="m">
                        {{ milestoneShortLabels[m] || m }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Attention Point / Frozen banner -->
              <div *ngIf="p.status === 'Congelado'"
                class="p-2.5 rounded-xl text-[10px] leading-snug mb-3 bg-slate-200 border-2 border-slate-300 text-slate-900 shadow-2xs font-medium">
                <strong>⏸️ Projeto Congelado:</strong> {{ hasAttentionPoints(p) ? p.attentionPoints : 'Atividades temporariamente pausadas pela gestão.' }}
              </div>
              <div *ngIf="p.status !== 'Congelado' && hasAttentionPoints(p)"
                class="p-2.5 rounded-xl text-[10px] leading-snug mb-3 shadow-2xs font-medium"
                [ngClass]="getAttentionBoxClass(p, 'light')">
                <strong>⚠️ Ponto de Atenção:</strong> {{ p.attentionPoints }}
              </div>

              <!-- Status Reports: Anterior & Atual (High Contrast) -->
              <div class="space-y-2 mb-2.5">
                <div class="p-2.5 rounded-xl bg-slate-100 border border-slate-300">
                  <div class="flex items-center justify-between gap-1.5 mb-1">
                    <span class="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider">Status report anterior</span>
                    <span class="text-[9px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded border border-slate-300">
                      {{ getPreviousReportDate(p) }}
                    </span>
                  </div>
                  <p class="text-[11px] leading-relaxed text-slate-800 font-medium">
                    {{ p.previousStatusReport || 'Sem reporte anterior registrado.' }}
                  </p>
                </div>

                <div class="p-2.5 rounded-xl bg-blue-100/70 border-2 border-blue-300">
                  <div class="flex items-center justify-between gap-1.5 mb-1">
                    <span class="text-[9px] font-black text-blue-950 uppercase tracking-wider">Status report atual</span>
                    <span class="text-[9px] font-black text-blue-800 bg-blue-200 px-1.5 py-0.2 rounded border border-blue-300">
                      {{ getCurrentReportDate(p) }}
                    </span>
                  </div>
                  <p class="text-[11px] leading-relaxed text-blue-950 font-semibold">
                    {{ p.statusReport || 'Nenhum reporte registrado para este ciclo.' }}
                  </p>
                </div>
              </div>

              <!-- Equipe Alocada -->
              <div *ngIf="getAllTeamMembers(p).length > 0" class="mt-2.5 pt-2 border-t border-slate-200">
                <div class="flex items-center gap-1 mb-1.5">
                  <span class="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <span>👥</span> Equipe Alocada
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <span
                    *ngIf="p.teamLeader || p.team?.leader"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                    <span>⭐</span> {{ p.teamLeader || p.team?.leader }}
                  </span>
                  <span
                    *ngFor="let member of getNonLeaderMembers(p)"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                    {{ member }}
                  </span>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 mt-3">
              <span>Meta: <strong class="text-slate-900 font-bold">{{ formatDate(p.targetDelivery) }}</strong></span>
              <button
                (click)="service.openEapForProject(p.projectId)"
                class="text-blue-600 font-bold hover:underline cursor-pointer">
                Ver EAP →
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="displayedProjects().length === 0"
          class="py-12 bg-white rounded-2xl border-2 border-slate-300 text-center text-slate-500 text-xs shadow-2xs">
          Nenhum projeto encontrado para os filtros selecionados.
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- INTERACTIVE PPT PRESENTER MODAL (SCREEN FULLSCREEN 16:9) -->
      <!-- ======================================================== -->
      <div *ngIf="isPresenterOpen()" class="interactive-presenter-modal fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 text-white animate-fade-in print:hidden">
        
        <!-- Top Navigation Bar -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
          <div class="flex items-center gap-2.5">
            <span class="text-lg">🖥️</span>
            <div>
              <h2 class="text-xs sm:text-sm font-black tracking-tight text-white leading-none">
                Apresentação Executiva • Status Report
              </h2>
              <p class="text-[10px] text-slate-400 mt-0.5 font-medium">
                Edição {{ service.formatEditionTitle(currentReport()) }} • Modo Paisagem (16:9)
              </p>
            </div>
          </div>

          <!-- Slide Controls -->
          <div class="flex items-center gap-2">
            <button
              (click)="prevSlide()"
              [disabled]="currentSlideIndex() === 0"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white transition flex items-center gap-1 cursor-pointer">
              <span>◀</span> Anterior
            </button>

            <!-- Slide indicator pill -->
            <span class="text-xs font-black px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-blue-400">
              Slide {{ currentSlideIndex() + 1 }} de {{ totalSlides() }}
            </span>

            <button
              (click)="nextSlide()"
              [disabled]="currentSlideIndex() === totalSlides() - 1"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white transition flex items-center gap-1 cursor-pointer">
              Próximo <span>▶</span>
            </button>

            <!-- Quick Slide Dots / Pills -->
            <div class="hidden lg:flex items-center gap-1 ml-2 pl-2 border-l border-slate-800">
              <button
                *ngFor="let s of [].constructor(totalSlides()); let idx = index"
                (click)="goToSlide(idx)"
                class="w-6 h-6 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center justify-center"
                [ngClass]="currentSlideIndex() === idx ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'">
                {{ idx + 1 }}
              </button>
            </div>
          </div>

          <!-- Actions: Theme Toggle, Download Landscape PDF & Exit -->
          <div class="flex items-center gap-2">
            <!-- Theme toggle inside presenter -->
            <button
              (click)="togglePresentationTheme()"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Alternar tema da apresentação">
              <span>{{ presentationTheme() === 'dark' ? '🌙 Escuro' : '☀️ Claro' }}</span>
            </button>

            <button
              (click)="printReport()"
              class="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Baixar ou imprimir esta apresentação em PDF Paisagem">
              <span>📥</span> Baixar PDF Paisagem
            </button>

            <button
              (click)="closePresenter()"
              class="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
              title="Fechar apresentação (Esc)">
              ✕ Sair
            </button>
          </div>
        </div>

        <!-- Center Stage: 16:9 Landscape Canvas -->
        <div class="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div
            class="aspect-[16/9] w-full max-w-[1260px] max-h-[82vh] rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden transition-all"
            [ngClass]="presentationTheme() === 'dark' ? 'bg-[#090d16] text-white border border-slate-800' : 'bg-slate-200/90 text-slate-900 border-2 border-slate-400'">
            
            <!-- Slide 0: Cover / Macro Executive Dashboard -->
            <ng-container *ngIf="currentSlideIndex() === 0">
              <ng-container [ngTemplateOutlet]="slide1Tpl"></ng-container>
            </ng-container>

            <!-- Slides 1..N: Project Chunks (2 cards per slide) -->
            <ng-container *ngIf="currentSlideIndex() >= 1 && currentSlideIndex() <= projectChunks().length">
              <ng-container
                [ngTemplateOutlet]="projectSlideTpl"
                [ngTemplateOutletContext]="{ chunk: projectChunks()[currentSlideIndex() - 1], chunkIdx: currentSlideIndex() - 1 }">
              </ng-container>
            </ng-container>

            <!-- Final Slide: Roadmap Estratégico (if exists) -->
            <ng-container *ngIf="hasRoadmap() && currentSlideIndex() === totalSlides() - 1">
              <ng-container [ngTemplateOutlet]="roadmapSlideTpl"></ng-container>
            </ng-container>

          </div>
        </div>

        <!-- Bottom Keyboard Help Hint -->
        <div class="text-center text-[11px] text-slate-400 py-1 border-t border-slate-800/80">
          <span>💡 Dica: Navegue com as setas <strong>◀</strong> <strong>▶</strong> do teclado ou <strong>Barra de Espaço</strong> • Pressione <strong>Esc</strong> para sair.</span>
        </div>

      </div>

      <!-- ======================================================== -->
      <!-- PPT SLIDES PRINT CONTAINER (VISIBLE EXCLUSIVELY ON PRINT) -->
      <!-- ======================================================== -->
      <div class="ppt-slides-print-container">
        
        <!-- Slide 1: Visão Consolidada & Indicadores Executivos -->
        <div class="ppt-slide" [ngClass]="presentationTheme() === 'dark' ? 'theme-dark' : 'theme-light'">
          <ng-container [ngTemplateOutlet]="slide1Tpl"></ng-container>
        </div>

        <!-- Slides 2..N: Projetos em Execução (2 por página paisagem) -->
        <div class="ppt-slide" [ngClass]="presentationTheme() === 'dark' ? 'theme-dark' : 'theme-light'" *ngFor="let chunk of projectChunks(); let chunkIdx = index">
          <ng-container
            [ngTemplateOutlet]="projectSlideTpl"
            [ngTemplateOutletContext]="{ chunk: chunk, chunkIdx: chunkIdx }">
          </ng-container>
        </div>

        <!-- Slide Final: Roadmap Estratégico & Pipeline Futuro -->
        <div class="ppt-slide" [ngClass]="presentationTheme() === 'dark' ? 'theme-dark' : 'theme-light'" *ngIf="hasRoadmap()">
          <ng-container [ngTemplateOutlet]="roadmapSlideTpl"></ng-container>
        </div>

      </div>

      <!-- ======================================================== -->
      <!-- REUSABLE SLIDE TEMPLATES (SHARED BY SCREEN AND PRINT)     -->
      <!-- ======================================================== -->

      <!-- TEMPLATE 1: CAPA & VISÃO CONSOLIDADA -->
      <ng-template #slide1Tpl>
        <div class="h-full flex flex-col justify-between">
          <!-- Slide Header (Executive High-Contrast Header Bar) -->
          <div class="flex items-center justify-between px-3.5 py-2 rounded-xl border mb-2 bg-slate-900 border-slate-800 text-white shadow-xs">
            <div class="flex items-center gap-3">
              <img src="/assets/logos/ilc.png" alt="ILC Logística" class="h-7 w-auto object-contain bg-white rounded p-0.5 border border-slate-300 shadow-2xs" onerror="this.style.display='none'" />
              <div *ngIf="service.selectedClient() !== 'Todos' && service.getClientLogo(service.selectedClient())" class="flex items-center gap-2">
                <span class="text-slate-600 font-light">|</span>
                <img [src]="service.getClientLogo(service.selectedClient())" [alt]="service.selectedClient()" class="h-7 max-w-[80px] object-contain rounded bg-white p-0.5 border border-slate-300 shadow-2xs" />
              </div>
              <div class="flex flex-col">
                <span class="text-xs font-black tracking-wider uppercase text-white leading-none">STATUS REPORT EXECUTIVO</span>
                <span class="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">Portfólio de Projetos Estratégicos & Operações</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                📅 {{ currentReport()?.period }}
              </span>
              <span class="text-[9px] font-black px-2.5 py-1 rounded-md bg-blue-900/90 text-blue-200 border border-blue-700">
                Edição {{ service.formatEditionTitle(currentReport()) }}
              </span>
              <span class="text-[9px] font-bold px-2.5 py-1 rounded-md bg-emerald-900/90 text-emerald-200 border border-emerald-700">
                Reunião: {{ formatDate(currentReport()?.meetingDate) }}
              </span>
            </div>
          </div>

          <!-- Slide Body -->
          <div class="flex-1 flex flex-col justify-between gap-2.5 overflow-hidden my-1">
            <!-- Top Row: Resumo Executivo (col-span-5) + Pulse KPIs (col-span-7) -->
            <div class="grid grid-cols-12 gap-3 h-[46%]">
              
              <!-- Resumo Executivo -->
              <div
                class="col-span-5 p-3 rounded-xl flex flex-col justify-between shadow-xs border"
                [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-900/95 border-blue-500/40 text-slate-200' : 'bg-white border-2 border-blue-300 text-slate-900'">
                <div>
                  <div class="flex items-center gap-1.5 mb-1.5">
                    <span class="text-xs">📌</span>
                    <h3 class="text-xs font-black uppercase tracking-tight"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-blue-400' : 'text-blue-950'">
                      Síntese Executiva do Ciclo
                    </h3>
                  </div>
                  <p class="text-[11px] leading-relaxed font-medium"
                    [ngClass]="presentationTheme() === 'dark' ? 'text-slate-200' : 'text-slate-800'">
                    {{ currentReport()?.executiveSummary || 'Acompanhamento semanal de entregas e alinhamento dos marcos operacionais com a diretoria.' }}
                  </p>
                </div>
                <div class="pt-1.5 border-t flex items-center justify-between text-[10px] font-bold"
                  [ngClass]="presentationTheme() === 'dark' ? 'border-slate-800 text-blue-300' : 'border-blue-200 text-blue-950'">
                  <span>Avanço Físico Médio dos Ativos:</span>
                  <span class="text-xs font-black" [ngClass]="presentationTheme() === 'dark' ? 'text-blue-400' : 'text-blue-700'">
                    {{ getAverageProgress() }}% concluído
                  </span>
                </div>
              </div>

              <!-- Pulse Metrics & Priorização -->
              <div
                class="col-span-7 p-3 rounded-xl flex flex-col justify-between shadow-xs border"
                [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-2 border-slate-300 text-slate-900'">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-xs font-black uppercase tracking-tight flex items-center gap-1.5"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-white' : 'text-slate-950'">
                      <span>📊</span> Indicadores de Saúde dos Projetos Ativos
                    </h3>
                    <span class="text-[9px] font-bold"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-slate-400' : 'text-slate-600'">
                      Monitoramento Contínuo
                    </span>
                  </div>
                  <div class="grid grid-cols-6 gap-2">
                    <!-- Ativos -->
                    <div class="p-1.5 rounded-lg border text-center"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-2 border-slate-300 text-slate-950'">
                      <span class="text-[8px] font-bold uppercase block truncate text-slate-400">Ativos</span>
                      <span class="text-base font-black block leading-tight">{{ getActiveCount() }}</span>
                      <span class="text-[8px] block truncate text-slate-400">em curso</span>
                    </div>
                    <!-- No Prazo -->
                    <div class="p-1.5 rounded-lg border text-center"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300' : 'bg-emerald-50 border-2 border-emerald-300 text-emerald-950'">
                      <span class="text-[8px] font-bold uppercase block truncate">No Prazo</span>
                      <span class="text-base font-black block leading-tight">{{ getOnTrackCount() }}</span>
                      <span class="text-[8px] block truncate font-semibold">{{ getPercent(getOnTrackCount(), getActiveCount()) }}%</span>
                    </div>
                    <!-- Atenção -->
                    <div class="p-1.5 rounded-lg border text-center"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-amber-950/70 border-amber-600/70 text-amber-300' : 'bg-amber-50 border-2 border-amber-300 text-amber-950'">
                      <span class="text-[8px] font-bold uppercase block truncate">Atenção</span>
                      <span class="text-base font-black block leading-tight">{{ getAttentionCount() }}</span>
                      <span class="text-[8px] block truncate font-semibold">moderado</span>
                    </div>
                    <!-- Desvio -->
                    <div class="p-1.5 rounded-lg border text-center"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-rose-950/70 border-rose-600/70 text-rose-300' : 'bg-rose-50 border-2 border-rose-300 text-rose-950'">
                      <span class="text-[8px] font-bold uppercase block truncate">Desvio</span>
                      <span class="text-base font-black block leading-tight">{{ getCriticalCount() }}</span>
                      <span class="text-[8px] block truncate font-semibold">crítico</span>
                    </div>
                    <!-- Congelados -->
                    <div class="p-1.5 rounded-lg border text-center"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-200 border-2 border-slate-300 text-slate-800'">
                      <span class="text-[8px] font-bold uppercase block truncate">Congelados</span>
                      <span class="text-base font-black block leading-tight">{{ getFrozenCount() }}</span>
                      <span class="text-[8px] block truncate">pausados</span>
                    </div>
                    <!-- Avanço -->
                    <div class="p-1.5 rounded-lg border text-center"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-blue-950/70 border-blue-600/70 text-blue-300' : 'bg-blue-50 border-2 border-blue-300 text-blue-950'">
                      <span class="text-[8px] font-bold uppercase block truncate">Avanço</span>
                      <span class="text-base font-black block leading-tight">{{ getAverageProgress() }}%</span>
                      <span class="text-[8px] block truncate font-semibold">físico</span>
                    </div>
                  </div>
                </div>

                <!-- Priority Row -->
                <div class="pt-2 border-t flex items-center justify-between text-[10px]"
                  [ngClass]="presentationTheme() === 'dark' ? 'border-slate-800' : 'border-slate-200'">
                  <span class="font-bold" [ngClass]="presentationTheme() === 'dark' ? 'text-slate-400' : 'text-slate-600'">Distribuição por Prioridade:</span>
                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded font-black text-[9px]"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-rose-950/80 text-rose-200 border border-rose-700' : 'bg-rose-100 text-rose-900 border border-rose-300'">
                      P1 Crítica: {{ getPriorityCount('P1') }}
                    </span>
                    <span class="px-2 py-0.5 rounded font-black text-[9px]"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-amber-950/80 text-amber-200 border border-amber-700' : 'bg-amber-100 text-amber-900 border border-amber-300'">
                      P2 Alta: {{ getPriorityCount('P2') }}
                    </span>
                    <span class="px-2 py-0.5 rounded font-black text-[9px]"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-blue-950/80 text-blue-200 border border-blue-700' : 'bg-blue-100 text-blue-900 border border-blue-300'">
                      P3 Média: {{ getPriorityCount('P3') }}
                    </span>
                    <span class="px-2 py-0.5 rounded font-black text-[9px]"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-800 border border-slate-300'">
                      P4 Baixa: {{ getPriorityCount('P4') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Row: Radar de Atenção (50%) + Deliberações da Diretoria (50%) -->
            <div class="grid grid-cols-2 gap-3 h-[50%]">
              
              <!-- Radar de Atenção -->
              <div
                class="p-3 rounded-xl flex flex-col justify-between shadow-xs overflow-hidden border"
                [ngClass]="presentationTheme() === 'dark' ? 'bg-orange-950/30 border-orange-500/40 text-slate-200' : 'bg-white border-2 border-orange-300 text-slate-900'">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-xs font-black uppercase tracking-tight flex items-center gap-1.5"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-orange-400' : 'text-orange-950'">
                      <span>🚨</span> Radar de Atenção da Diretoria ({{ topCriticalProjects().length }})
                    </h3>
                    <span class="text-[9px] font-bold" [ngClass]="presentationTheme() === 'dark' ? 'text-orange-300' : 'text-orange-900'">
                      Desvios & Ações Mitigatórias
                    </span>
                  </div>
                  <div *ngIf="topCriticalProjects().length > 0; else noCritical"
                    class="grid gap-1.5 overflow-hidden"
                    [ngClass]="topCriticalProjects().length > 2 ? 'grid-cols-2' : 'grid-cols-1'">
                    <div *ngFor="let item of topCriticalProjects()"
                      class="p-1.5 rounded-lg border shadow-2xs flex flex-col justify-between"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-900 border-orange-500/40 text-slate-200' : 'bg-orange-50/70 border-2 border-orange-200 text-slate-900'">
                      <div class="flex items-center justify-between gap-1 mb-0.5">
                        <span class="text-[9px] font-black truncate"
                          [ngClass]="presentationTheme() === 'dark' ? 'text-white' : 'text-slate-950'">
                          {{ item.client }} • {{ item.name }}
                        </span>
                        <span class="text-[8px] font-black px-1.5 py-0.2 rounded-full shrink-0"
                          [ngClass]="item.ragStatus === 'red' ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-amber-100 text-amber-900 border border-amber-300'">
                          {{ item.ragStatus === 'red' ? 'Desvio' : 'Atenção' }}
                        </span>
                      </div>
                      <p class="text-[8px] leading-tight line-clamp-2"
                        [ngClass]="presentationTheme() === 'dark' ? 'text-slate-300' : 'text-slate-800'">
                        {{ hasAttentionPoints(item) ? item.attentionPoints : (item.ragStatus === 'red' ? 'Projeto com desvio de prazo ou esforço.' : 'Atenção gerencial.') }}
                      </p>
                    </div>
                  </div>
                  <ng-template #noCritical>
                    <p class="text-xs italic py-4 text-center text-slate-400">Nenhum projeto em desvio crítico nesta edição.</p>
                  </ng-template>
                </div>
                <span class="text-[9px] font-bold block pt-1 border-t"
                  [ngClass]="presentationTheme() === 'dark' ? 'border-orange-500/30 text-orange-400' : 'border-orange-200 text-orange-900'">
                  Acompanhamento prioritário pelo comitê executivo
                </span>
              </div>

              <!-- Deliberações da Diretoria -->
              <div
                class="p-3 rounded-xl flex flex-col justify-between shadow-xs overflow-hidden border"
                [ngClass]="presentationTheme() === 'dark' ? 'bg-purple-950/30 border-purple-500/40 text-slate-200' : 'bg-white border-2 border-purple-300 text-slate-900'">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-xs font-black uppercase tracking-tight flex items-center gap-1.5"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-purple-400' : 'text-purple-950'">
                      <span>⚖️</span> Deliberações & Decisões Estratégicas ({{ currentReport()?.boardDecisions?.length || 0 }})
                    </h3>
                    <span class="text-[9px] font-bold" [ngClass]="presentationTheme() === 'dark' ? 'text-purple-300' : 'text-purple-900'">
                      Pautas da Reunião
                    </span>
                  </div>
                  <div *ngIf="currentReport()?.boardDecisions?.length; else noDecisions" class="space-y-1.5 overflow-hidden">
                    <div *ngFor="let dec of currentReport()?.boardDecisions?.slice(0, 2)"
                      class="p-2 rounded-lg border shadow-2xs"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-900 border-purple-500/40 text-slate-200' : 'bg-purple-50/70 border-2 border-purple-200 text-slate-900'">
                      <div class="flex items-center justify-between gap-1 mb-0.5">
                        <span class="text-[10px] font-black truncate"
                          [ngClass]="presentationTheme() === 'dark' ? 'text-white' : 'text-slate-950'">
                          {{ dec.title }}
                        </span>
                        <span class="text-[8px] font-bold px-1.5 py-0.2 rounded shrink-0"
                          [ngClass]="presentationTheme() === 'dark' ? 'bg-purple-950 text-purple-300 border border-purple-700' : 'bg-purple-100 text-purple-900 border border-purple-300'">
                          Prazo: {{ dec.deadline }}
                        </span>
                      </div>
                      <p class="text-[10px] leading-snug line-clamp-2"
                        [ngClass]="presentationTheme() === 'dark' ? 'text-slate-300' : 'text-slate-800'">
                        {{ dec.impact || dec.description }}
                      </p>
                    </div>
                  </div>
                  <ng-template #noDecisions>
                    <p class="text-xs italic py-4 text-center text-slate-400">Nenhuma deliberação registrada nesta edição.</p>
                  </ng-template>
                </div>
                <span class="text-[9px] font-bold block pt-1 border-t"
                  [ngClass]="presentationTheme() === 'dark' ? 'border-purple-500/30 text-purple-400' : 'border-purple-200 text-purple-900'">
                  Alinhamento de responsabilidades e datas de entrega
                </span>
              </div>
            </div>
          </div>

          <!-- Slide Footer -->
          <div class="flex items-center justify-between pt-1.5 mt-1 border-t text-[9px] font-semibold"
            [ngClass]="presentationTheme() === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-600'">
            <span>ILC - Integrator Logistics Company • Governança & Gestão de Projetos</span>
            <span class="text-slate-500">Relatório Executivo de Diretoria</span>
            <span class="font-extrabold" [ngClass]="presentationTheme() === 'dark' ? 'text-slate-200' : 'text-slate-900'">
              Slide 1 de {{ totalSlides() }}
            </span>
          </div>
        </div>
      </ng-template>

      <!-- TEMPLATE 2: PROJETOS EM EXECUÇÃO (2 CARDS EM PAISAGEM) -->
      <ng-template #projectSlideTpl let-chunk="chunk" let-chunkIdx="chunkIdx">
        <div class="h-full flex flex-col justify-between">
          <!-- Slide Header (Executive High-Contrast Header Bar) -->
          <div class="flex items-center justify-between px-3.5 py-2 rounded-xl border mb-2 bg-slate-900 border-slate-800 text-white shadow-xs">
            <div class="flex items-center gap-3">
              <img src="/assets/logos/ilc.png" alt="ILC Logística" class="h-7 w-auto object-contain bg-white rounded p-0.5 border border-slate-300 shadow-2xs" onerror="this.style.display='none'" />
              <div class="flex flex-col">
                <span class="text-xs font-black tracking-wider uppercase text-white leading-none">STATUS REPORT EXECUTIVO • PROJETOS EM EXECUÇÃO</span>
                <span class="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">
                  Projetos {{ chunkIdx * 2 + 1 }} a {{ getChunkEnd(chunkIdx) }} de {{ displayedProjects().length }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-black px-2.5 py-1 rounded-md bg-blue-900/90 text-blue-200 border border-blue-700">
                Edição {{ service.formatEditionTitle(currentReport()) }}
              </span>
              <span class="text-[9px] font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Período: {{ currentReport()?.period }}
              </span>
            </div>
          </div>

          <!-- 2 Project Cards Grid (Landscape 2 columns) -->
          <div class="grid grid-cols-2 gap-4 flex-1 overflow-hidden my-1">
            <div *ngFor="let p of chunk"
              class="p-3.5 rounded-xl flex flex-col justify-between shadow-xs overflow-hidden border"
              [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-2 border-slate-300 text-slate-900'">
              <div>
                <!-- Card Top Bar: Priority + Client Logo + Milestone + Status -->
                <div class="flex items-center justify-between gap-1.5 mb-1.5">
                  <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span class="text-[9px] font-black px-1.5 py-0.2 rounded border shadow-2xs shrink-0 cursor-default"
                      [ngClass]="service.getPriorityBadgeClass(p.priority || 'P2')">
                      {{ p.priority || 'P2' }}
                    </span>
                    <img *ngIf="p.clientLogo || service.getClientLogo(p.client)"
                      [src]="p.clientLogo || service.getClientLogo(p.client)"
                      [alt]="p.client"
                      class="h-4 max-w-[50px] object-contain rounded bg-white px-0.5 border border-slate-300 shadow-2xs" />
                    <span *ngIf="!p.clientLogo && !service.getClientLogo(p.client)"
                      class="text-[9px] font-black px-1.5 py-0.2 rounded border"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-900'">
                      {{ p.client }}
                    </span>
                    <span [ngClass]="service.getMilestoneBadgeClass(p.currentMilestone)" class="px-1.5 py-0.2 rounded font-bold text-[9px]">
                      {{ p.currentMilestone }}
                    </span>
                  </div>
                  <span class="px-2 py-0.2 rounded-full text-[9px] font-black shrink-0"
                    [ngClass]="getRagPillClass(p.ragStatus, p.status)">
                    {{ getRagLabel(p) }}
                  </span>
                </div>

                <!-- Project Name -->
                <h4 class="text-xs font-black tracking-tight leading-snug truncate mb-1"
                  [ngClass]="presentationTheme() === 'dark' ? 'text-white' : 'text-slate-950'"
                  [title]="p.name">
                  {{ p.name }}
                </h4>

                <!-- Systems -->
                <div *ngIf="p.systems && p.systems.length > 0" class="flex flex-wrap items-center gap-1 mb-1.5">
                  <span *ngFor="let sys of p.systems" [ngClass]="service.getSystemBadgeClass(sys)" class="px-1 py-0.2 rounded text-[8px] font-bold border">
                    {{ sys }}
                  </span>
                </div>

                <!-- Progress & EAP Stepper Box (High Contrast) -->
                <div class="mb-2 p-2 rounded-lg border"
                  [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border border-slate-200'">
                  <!-- Progress Bar -->
                  <div class="mb-1.5">
                    <div class="flex items-center justify-between text-[9px] font-bold mb-0.5"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-slate-400' : 'text-slate-600'">
                      <span>Progresso: <strong [ngClass]="presentationTheme() === 'dark' ? 'text-white' : 'text-slate-950'">{{ p.progress }}%</strong></span>
                      <span *ngIf="p.targetDelivery">Meta: <strong [ngClass]="presentationTheme() === 'dark' ? 'text-slate-200' : 'text-slate-900'">{{ formatDate(p.targetDelivery) }}</strong></span>
                    </div>
                    <div class="w-full rounded-full h-1.5 overflow-hidden"
                      [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-slate-200 border border-slate-300'">
                      <div class="h-full rounded-full"
                        [ngClass]="p.status === 'Congelado' ? 'bg-slate-400' : (p.status === 'Finalizado' ? 'bg-emerald-600' : (p.ragStatus === 'red' ? 'bg-rose-500' : (p.ragStatus === 'amber' ? 'bg-amber-500' : 'bg-blue-600')))"
                        [style.width.%]="p.progress">
                      </div>
                    </div>
                  </div>

                  <!-- Stepper EAP (5 Fases) -->
                  <div class="pt-1.5 border-t"
                    [ngClass]="presentationTheme() === 'dark' ? 'border-slate-800/80' : 'border-slate-200/80'">
                    <div class="flex items-center justify-between text-[8px] font-bold mb-1"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-slate-400' : 'text-slate-600'">
                      <div class="flex items-center gap-1.5">
                        <span class="uppercase tracking-wider text-[8px] font-black"
                          [ngClass]="presentationTheme() === 'dark' ? 'text-slate-500' : 'text-slate-400'">
                          Etapa da EAP:
                        </span>
                        <span class="font-black"
                          [ngClass]="presentationTheme() === 'dark' ? 'text-blue-300' : 'text-blue-700'">
                          {{ p.currentMilestone }}
                        </span>
                      </div>
                      <span class="font-extrabold"
                        [ngClass]="presentationTheme() === 'dark' ? 'text-slate-400' : 'text-slate-500'">
                        {{ getMilestoneStepLabel(p) }}
                      </span>
                    </div>
                    <div class="grid grid-cols-5 gap-1.5 text-center">
                      <div *ngFor="let m of milestones; let idx = index"
                        class="flex flex-col items-center group cursor-default"
                        [title]="(idx + 1) + '. ' + m">
                        <div
                          [ngClass]="getMilestoneStepClass(m, p.currentMilestone, p.status, presentationTheme())"
                          class="w-full h-1.5 rounded-full transition-all">
                        </div>
                        <span
                          [ngClass]="getMilestoneLabelClass(m, p.currentMilestone, p.status, presentationTheme())"
                          class="text-[8px] truncate w-full font-bold mt-0.5"
                          [title]="m">
                          {{ milestoneShortLabels[m] || m }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Callout Banner if Frozen or Attention -->
                <div *ngIf="p.status === 'Congelado'"
                  class="p-1.5 rounded-lg text-[9px] leading-snug mb-1.5 border font-semibold"
                  [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-200 border-2 border-slate-300 text-slate-900'">
                  <strong>⏸️ Congelado:</strong> {{ hasAttentionPoints(p) ? p.attentionPoints : 'Pausado temporariamente pela gestão.' }}
                </div>
                <div *ngIf="p.status !== 'Congelado' && hasAttentionPoints(p)"
                  class="p-1.5 rounded-lg text-[9px] leading-snug mb-1.5 border font-medium"
                  [ngClass]="getAttentionBoxClass(p, presentationTheme())">
                  <strong>⚠️ Ponto de Atenção:</strong> {{ p.attentionPoints }}
                </div>

                <!-- Status Reports Boxes (High Contrast) -->
                <div class="space-y-1.5">
                  <!-- Anterior -->
                  <div class="p-1.5 rounded-lg border"
                    [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-950/90 border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'">
                    <div class="flex items-center justify-between text-[8px] font-black mb-0.5 uppercase tracking-wider"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-slate-400' : 'text-slate-600'">
                      <span>Reporte Anterior</span>
                      <span [ngClass]="presentationTheme() === 'dark' ? 'text-slate-400' : 'text-slate-500'">{{ getPreviousReportDate(p) }}</span>
                    </div>
                    <p class="text-[9px] leading-snug line-clamp-3">
                      {{ p.previousStatusReport || 'Sem reporte anterior registrado.' }}
                    </p>
                  </div>
                  <!-- Atual -->
                  <div class="p-1.5 rounded-lg border"
                    [ngClass]="presentationTheme() === 'dark' ? 'bg-blue-950/60 border-blue-600/70 text-blue-100' : 'bg-blue-100/70 border-2 border-blue-300 text-blue-950'">
                    <div class="flex items-center justify-between text-[8px] font-black mb-0.5 uppercase tracking-wider"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-blue-300' : 'text-blue-900'">
                      <span>Reporte Atual</span>
                      <span [ngClass]="presentationTheme() === 'dark' ? 'text-blue-300' : 'text-blue-700'">{{ getCurrentReportDate(p) }}</span>
                    </div>
                    <p class="text-[9px] leading-snug font-semibold line-clamp-3">
                      {{ p.statusReport || 'Nenhum reporte registrado para este ciclo.' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Card Footer: Equipe -->
              <div class="pt-1.5 mt-1.5 border-t text-[8px] flex items-center justify-between"
                [ngClass]="presentationTheme() === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'">
                <span class="truncate">
                  <strong [ngClass]="presentationTheme() === 'dark' ? 'text-slate-300' : 'text-slate-800'">👥 Líder:</strong> {{ p.teamLeader || p.team?.leader || 'Não informado' }}
                </span>
                <span *ngIf="getNonLeaderMembers(p).length > 0" class="truncate ml-1 font-semibold"
                  [ngClass]="presentationTheme() === 'dark' ? 'text-slate-400' : 'text-slate-500'">
                  +{{ getNonLeaderMembers(p).length }} equipe
                </span>
              </div>
            </div>
          </div>

          <!-- Slide Footer -->
          <div class="flex items-center justify-between pt-1.5 mt-1 border-t text-[9px] font-semibold"
            [ngClass]="presentationTheme() === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-600'">
            <span>ILC • Status Report Executivo de Projetos</span>
            <span class="text-slate-500">Acompanhamento Semanal</span>
            <span class="font-extrabold" [ngClass]="presentationTheme() === 'dark' ? 'text-slate-200' : 'text-slate-900'">
              Slide {{ chunkIdx + 2 }} de {{ totalSlides() }}
            </span>
          </div>
        </div>
      </ng-template>

      <!-- TEMPLATE 3: ROADMAP ESTRATÉGICO -->
      <ng-template #roadmapSlideTpl>
        <div class="h-full flex flex-col justify-between">
          <!-- Slide Header (Executive High-Contrast Header Bar) -->
          <div class="flex items-center justify-between px-3.5 py-2 rounded-xl border mb-2 bg-slate-900 border-slate-800 text-white shadow-xs">
            <div class="flex items-center gap-3">
              <img src="/assets/logos/ilc.png" alt="ILC Logística" class="h-7 w-auto object-contain bg-white rounded p-0.5 border border-slate-300 shadow-2xs" onerror="this.style.display='none'" />
              <div class="flex flex-col">
                <span class="text-xs font-black tracking-wider uppercase text-white leading-none">ROADMAP ESTRATÉGICO & PIPELINE DE OPORTUNIDADES</span>
                <span class="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">Visão de Médio e Longo Prazo do Portfólio</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-black px-2.5 py-1 rounded-md bg-blue-900/90 text-blue-200 border border-blue-700">
                Edição {{ service.formatEditionTitle(currentReport()) }}
              </span>
              <span class="text-[9px] font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Planejamento Futuro
              </span>
            </div>
          </div>

          <!-- Roadmap Cards Grid & Governança -->
          <div class="flex-1 flex flex-col justify-between gap-3 overflow-hidden my-1">
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-xs font-black uppercase tracking-tight flex items-center gap-1.5"
                  [ngClass]="presentationTheme() === 'dark' ? 'text-white' : 'text-slate-950'">
                  <span>🔭</span> Projetos no Radar & Expansões Planejadas ({{ currentReport()?.roadmapProjects?.length || 0 }})
                </h3>
                <span class="text-[9px] font-extrabold" [ngClass]="presentationTheme() === 'dark' ? 'text-blue-400' : 'text-blue-800'">
                  Novas Demandas e Extensões
                </span>
              </div>
              <div class="grid grid-cols-5 gap-2.5">
                <div *ngFor="let road of currentReport()?.roadmapProjects"
                  class="p-2.5 rounded-xl border shadow-xs flex flex-col justify-between"
                  [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-900 border-blue-800/60 text-slate-200' : 'bg-white border-2 border-blue-200 text-slate-900'">
                  <div>
                    <div class="flex items-center justify-between gap-1 mb-1">
                      <span class="text-[8px] font-black px-1.5 py-0.2 rounded border"
                        [ngClass]="presentationTheme() === 'dark' ? 'bg-blue-950 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-900 border-blue-300'">
                        {{ road.client }}
                      </span>
                      <span class="text-[8px] font-bold px-1.5 py-0.2 rounded-full" [ngClass]="getRoadmapStageClass(road.stage)">
                        {{ road.stage }}
                      </span>
                    </div>
                    <h4 class="text-[11px] font-black truncate leading-snug"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-white' : 'text-slate-950'"
                      [title]="road.name">
                      {{ road.name }}
                    </h4>
                    <p class="text-[9px] leading-snug line-clamp-3 mt-1 font-medium"
                      [ngClass]="presentationTheme() === 'dark' ? 'text-slate-300' : 'text-slate-700'">
                      {{ road.description }}
                    </p>
                  </div>
                  <div class="mt-2 pt-1 border-t flex items-center justify-between text-[8px]"
                    [ngClass]="presentationTheme() === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'">
                    <span>Início: <strong [ngClass]="presentationTheme() === 'dark' ? 'text-slate-200' : 'text-slate-800'">{{ road.estimatedStart }}</strong></span>
                    <span class="text-[8px] px-1.5 py-0.2 rounded-full font-black border"
                      [ngClass]="getStrategicValueBadgeClass(road.strategicValue, presentationTheme())">
                      Valor: {{ road.strategicValue }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Governança & Próximos Passos -->
            <div class="p-3 rounded-xl border flex items-center justify-between gap-4 shadow-xs"
              [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-2 border-slate-300 text-slate-800'">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  🗓️
                </div>
                <div>
                  <h4 class="text-xs font-black" [ngClass]="presentationTheme() === 'dark' ? 'text-white' : 'text-slate-950'">
                    Calendário de Governança & Próximos Passos
                  </h4>
                  <p class="text-[10px] mt-0.5" [ngClass]="presentationTheme() === 'dark' ? 'text-slate-400' : 'text-slate-600'">
                    Acompanhamento semanal às sextas-feiras com a diretoria executiva de tecnologia e operações.
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[9px] font-bold px-2.5 py-1 rounded-lg border shadow-2xs"
                  [ngClass]="presentationTheme() === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'">
                  PMO ILC • Governança Ágil
                </span>
              </div>
            </div>
          </div>

          <!-- Slide Footer -->
          <div class="flex items-center justify-between pt-1.5 mt-1 border-t text-[9px] font-semibold"
            [ngClass]="presentationTheme() === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-600'">
            <span>ILC • Planejamento Estratégico & Pipeline Futuro</span>
            <span class="text-slate-500">Roadmap Corporativo</span>
            <span class="font-extrabold" [ngClass]="presentationTheme() === 'dark' ? 'text-slate-200' : 'text-slate-900'">
              Slide {{ totalSlides() }} de {{ totalSlides() }}
            </span>
          </div>
        </div>
      </ng-template>

    </div>
  `
})
export class ExecutiveReportComponent implements OnInit {
  service = inject(ProjectService);
  Math = Math;

  // Theme signal: default to 'dark' for supreme executive contrast
  presentationTheme = signal<'dark' | 'light'>('dark');

  // Interactive Presenter signals
  isPresenterOpen = signal<boolean>(false);
  currentSlideIndex = signal<number>(0);

  ngOnInit() {
    this.service.sortBy.set('targetDelivery');
  }

  togglePresentationTheme(): void {
    this.presentationTheme.update(t => t === 'dark' ? 'light' : 'dark');
  }

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
    if (status !== 'Todos') {
      list = list.filter(p => (p.status || 'Ativo') === status);
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
        const membersMatch = (p.teamMembers || p.team?.members || []).some(m => m.toLowerCase().includes(query));
        const systemMatch = (p.systems || []).some(s => s.toLowerCase().includes(query));
        const milestoneMatch = (p.currentMilestone || '').toLowerCase().includes(query);
        const statusReportMatch = (p.statusReport || '').toLowerCase().includes(query);
        const previousStatusReportMatch = (p.previousStatusReport || '').toLowerCase().includes(query);
        const attentionMatch = (p.attentionPoints || '').toLowerCase().includes(query);
        return nameMatch || clientMatch || leaderMatch || membersMatch || systemMatch || milestoneMatch || statusReportMatch || previousStatusReportMatch || attentionMatch;
      });
    }

    // 6. Sort Dropdown (from FiltersComponent)
    if (sort === 'priority') {
      const priorityOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
      list.sort((a, b) => {
        const pA = priorityOrder[a.priority || 'P2'] || 99;
        const pB = priorityOrder[b.priority || 'P2'] || 99;
        if (pA !== pB) return pA - pB;
        return this.compareByTargetDelivery(a, b);
      });
    } else if (sort === 'progress') {
      list.sort((a, b) => {
        const progDiff = (b.progress || 0) - (a.progress || 0);
        if (progDiff !== 0) return progDiff;
        return this.compareByTargetDelivery(a, b);
      });
    } else if (sort === 'client') {
      list.sort((a, b) => {
        const cDiff = (a.client || '').localeCompare(b.client || '', 'pt-BR', { sensitivity: 'base' });
        if (cDiff !== 0) return cDiff;
        return this.compareByTargetDelivery(a, b);
      });
    } else {
      list.sort((a, b) => this.compareByTargetDelivery(a, b));
    }

    return list;
  });

  // Milestones da EAP para os Steppers dos Cards
  milestones: string[] = [
    'Planejamento',
    'Desenvolvimento',
    'Homologação',
    'Treinamento',
    'Operação Assistida'
  ];

  milestoneShortLabels: Record<string, string> = {
    'Planejamento': 'Plan',
    'Desenvolvimento': 'Dev',
    'Homologação': 'Homolog',
    'Treinamento': 'Trein',
    'Operação Assistida': 'Op. Assist'
  };

  getMilestoneIndex(mName?: string): number {
    if (!mName) return 0;
    const clean = mName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const idx = this.milestones.findIndex(m => 
      m.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === clean
    );
    return idx >= 0 ? idx : 0;
  }

  getMilestoneStepLabel(p: WeeklyReportProject): string {
    if (p.status === 'Finalizado') {
      return 'Concluído (5/5)';
    }
    const idx = this.getMilestoneIndex(p.currentMilestone);
    return `Etapa ${idx + 1} de 5`;
  }

  getMilestoneStepClass(m: string, currentMilestone?: string, status?: string, theme: 'dark' | 'light' = 'light'): string {
    if (status === 'Finalizado') {
      return 'bg-emerald-500 shadow-2xs';
    }
    const currentIdx = this.getMilestoneIndex(currentMilestone);
    const mIdx = this.milestones.indexOf(m);

    if (mIdx < currentIdx) {
      return 'bg-emerald-500 shadow-2xs';
    }
    if (mIdx === currentIdx) {
      if (status === 'Congelado') {
        return theme === 'dark' ? 'bg-slate-500 ring-2 ring-slate-400' : 'bg-slate-400 ring-2 ring-slate-300';
      }
      return theme === 'dark' ? 'bg-blue-500 ring-2 ring-blue-400/70 shadow-xs' : 'bg-blue-600 ring-2 ring-blue-300 shadow-xs';
    }
    return theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200';
  }

  getMilestoneLabelClass(m: string, currentMilestone?: string, status?: string, theme: 'dark' | 'light' = 'light'): string {
    if (status === 'Finalizado') {
      return theme === 'dark' ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold';
    }
    const currentIdx = this.getMilestoneIndex(currentMilestone);
    const mIdx = this.milestones.indexOf(m);

    if (mIdx < currentIdx) {
      return theme === 'dark' ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold';
    }
    if (mIdx === currentIdx) {
      if (status === 'Congelado') {
        return theme === 'dark' ? 'text-slate-300 font-black' : 'text-slate-700 font-black';
      }
      return theme === 'dark' ? 'text-blue-300 font-black' : 'text-blue-700 font-black';
    }
    return theme === 'dark' ? 'text-slate-500 font-medium' : 'text-slate-400 font-medium';
  }

  // Project chunks: 2 projects per slide in landscape orientation
  projectChunks = computed<WeeklyReportProject[][]>(() => {
    const list = this.displayedProjects();
    const chunkSize = 2;
    const chunks: WeeklyReportProject[][] = [];
    for (let i = 0; i < list.length; i += chunkSize) {
      chunks.push(list.slice(i, i + chunkSize));
    }
    return chunks;
  });

  hasRoadmap = computed<boolean>(() => {
    return (this.currentReport()?.roadmapProjects?.length || 0) > 0;
  });

  totalSlides = computed<number>(() => {
    // Slide 1 (Capa & Visão Consolidada) + N project slides + 1 roadmap slide (if exists)
    return 1 + this.projectChunks().length + (this.hasRoadmap() ? 1 : 0);
  });

  getChunkEnd(chunkIdx: number): number {
    return Math.min((chunkIdx + 1) * 2, this.displayedProjects().length);
  }

  openPresenter(): void {
    this.currentSlideIndex.set(0);
    this.isPresenterOpen.set(true);
  }

  closePresenter(): void {
    this.isPresenterOpen.set(false);
  }

  nextSlide(): void {
    if (this.currentSlideIndex() < this.totalSlides() - 1) {
      this.currentSlideIndex.update(i => i + 1);
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex() > 0) {
      this.currentSlideIndex.update(i => i - 1);
    }
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.totalSlides()) {
      this.currentSlideIndex.set(index);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isPresenterOpen()) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ' || event.key === 'PageDown') {
      event.preventDefault();
      this.nextSlide();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      this.prevSlide();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closePresenter();
    }
  }

  topCriticalProjects = computed(() => {
    const report = this.currentReport();
    if (!report || !report.activeProjects) return [];
    return report.activeProjects
      .filter(p => p.ragStatus === 'red' || p.ragStatus === 'amber' || this.hasAttentionPoints(p))
      .sort((a, b) => {
        // Red first, then Amber, then Green with attention points
        const score = (proj: WeeklyReportProject) => {
          if (proj.ragStatus === 'red') return 0;
          if (proj.ragStatus === 'amber') return 1;
          return 2;
        };
        const diff = score(a) - score(b);
        if (diff !== 0) return diff;
        return (a.name || '').localeCompare(b.name || '', 'pt-BR');
      });
  });

  compareByTargetDelivery(a: WeeklyReportProject, b: WeeklyReportProject): number {
    const dateA = a.targetDelivery || '9999-12-31';
    const dateB = b.targetDelivery || '9999-12-31';
    const dateDiff = dateA.localeCompare(dateB);
    if (dateDiff !== 0) return dateDiff;
    return (a.name || '').localeCompare(b.name || '', 'pt-BR');
  }

  getActiveCount(): number {
    const list = this.currentReport()?.activeProjects || [];
    return list.filter(p => (p.status || 'Ativo') === 'Ativo').length;
  }

  getOnTrackCount(): number {
    const list = this.currentReport()?.activeProjects || [];
    return list.filter(p => (p.status || 'Ativo') === 'Ativo' && p.ragStatus === 'green').length;
  }

  getAttentionCount(): number {
    const list = this.currentReport()?.activeProjects || [];
    return list.filter(p => (p.status || 'Ativo') === 'Ativo' && p.ragStatus === 'amber').length;
  }

  getCriticalCount(): number {
    const list = this.currentReport()?.activeProjects || [];
    return list.filter(p => (p.status || 'Ativo') === 'Ativo' && p.ragStatus === 'red').length;
  }

  getCompletedCount(): number {
    const list = this.currentReport()?.activeProjects || [];
    return list.filter(p => p.status === 'Finalizado').length;
  }

  getFrozenCount(): number {
    const list = this.currentReport()?.activeProjects || [];
    return list.filter(p => p.status === 'Congelado').length;
  }

  getAverageProgress(): number {
    const list = this.currentReport()?.activeProjects || [];
    const activeList = list.filter(p => (p.status || 'Ativo') === 'Ativo');
    if (activeList.length === 0) return this.currentReport()?.statusPulse?.averageProgress || 0;
    const total = activeList.reduce((acc, p) => acc + (p.progress || 0), 0);
    return Math.round(total / activeList.length);
  }

  getPercent(count?: number, total?: number): number {
    if (!count || !total || total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  getPriorityCount(priority: string): number {
    const list = this.currentReport()?.activeProjects || [];
    return list.filter(p => ((p.priority || 'P2').trim().toUpperCase()) === priority.toUpperCase()).length;
  }

  togglePriorityFilter(priority: string): void {
    if (this.service.selectedPriority() === priority) {
      this.service.selectedPriority.set('Todos');
    } else {
      this.service.selectedPriority.set(priority);
    }
  }

  systemMetrics = computed(() => {
    const list = this.currentReport()?.activeProjects || [];
    const map = new Map<string, number>();

    for (const p of list) {
      for (const sys of (p.systems || [])) {
        if (sys) {
          map.set(sys, (map.get(sys) || 0) + 1);
        }
      }
    }

    const systemMeta: Record<string, { icon: string; activeClass: string; idleClass: string; textClass: string; countClass: string }> = {
      'Portal Integrator': {
        icon: '🌐',
        activeClass: 'ring-2 ring-indigo-500 bg-indigo-100 border-indigo-400',
        idleClass: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300',
        textClass: 'text-indigo-950 font-black',
        countClass: 'text-indigo-800 font-black'
      },
      'App ILC': {
        icon: '🚚',
        activeClass: 'ring-2 ring-cyan-500 bg-cyan-100 border-cyan-400',
        idleClass: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300',
        textClass: 'text-cyan-950 font-black',
        countClass: 'text-cyan-800 font-black'
      },
      'App Smart Tracking': {
        icon: '📱',
        activeClass: 'ring-2 ring-emerald-500 bg-emerald-100 border-emerald-400',
        idleClass: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300',
        textClass: 'text-emerald-950 font-black',
        countClass: 'text-emerald-800 font-black'
      },
      'Smart X': {
        icon: '📋',
        activeClass: 'ring-2 ring-purple-500 bg-purple-100 border-purple-400',
        idleClass: 'bg-purple-50 hover:bg-purple-100 border-purple-300',
        textClass: 'text-purple-950 font-black',
        countClass: 'text-purple-800 font-black'
      },
      'Infraestrutura': {
        icon: '🏗️',
        activeClass: 'ring-2 ring-sky-500 bg-sky-100 border-sky-400',
        idleClass: 'bg-sky-50 hover:bg-sky-100 border-sky-300',
        textClass: 'text-sky-950 font-black',
        countClass: 'text-sky-800 font-black'
      }
    };

    const order = ['Portal Integrator', 'App ILC', 'App Smart Tracking', 'Smart X', 'Infraestrutura'];
    const systems = Array.from(map.keys()).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return (map.get(b) || 0) - (map.get(a) || 0);
    });

    return systems.map(sys => {
      const meta = systemMeta[sys] || {
        icon: '⚙️',
        activeClass: 'ring-2 ring-slate-500 bg-slate-200 border-slate-400',
        idleClass: 'bg-slate-100 hover:bg-slate-200 border-slate-300',
        textClass: 'text-slate-900 font-black',
        countClass: 'text-slate-800 font-black'
      };
      return {
        name: sys,
        count: map.get(sys) || 0,
        ...meta
      };
    });
  });

  toggleSystemFilter(systemName: string): void {
    if (this.service.selectedSystem() === systemName) {
      this.service.selectedSystem.set('Todos');
    } else {
      this.service.selectedSystem.set(systemName);
    }
  }

  getTeamMembers(p: WeeklyReportProject): string[] {
    let members = p.team?.members || p.teamMembers || [];
    if (!members || members.length === 0) {
      const proj = this.service.projects().find(x => x.id === p.projectId || x.name === p.name);
      members = proj?.team?.members || [];
    }
    return members;
  }

  getAllTeamMembers(p: WeeklyReportProject): string[] {
    const list: string[] = [];
    const leader = (p.teamLeader || p.team?.leader || '').trim();
    if (leader) list.push(leader);

    const members = this.getTeamMembers(p);
    for (const m of members) {
      const trimmed = m.trim();
      if (trimmed && !list.some(x => x.toLowerCase() === trimmed.toLowerCase())) {
        list.push(trimmed);
      }
    }
    return list;
  }

  getNonLeaderMembers(p: WeeklyReportProject): string[] {
    const leader = (p.teamLeader || p.team?.leader || '').trim().toLowerCase();
    const all = this.getAllTeamMembers(p);
    return all.filter(m => m.trim().toLowerCase() !== leader);
  }

  onSelectReport(reportId: string) {
    this.service.loadWeeklyReport(reportId);
  }

  getRagLabel(p: WeeklyReportProject): string {
    if (p.status === 'Congelado') return 'Congelado';
    if (p.status === 'Finalizado') return 'Finalizado';
    if (p.ragStatus === 'red') return 'Desvio';
    if (p.ragStatus === 'amber') return 'Atenção';
    return 'No Prazo';
  }

  getRagPillClass(rag: string, status?: string) {
    if (status === 'Congelado') return 'bg-slate-200 text-slate-800 border border-slate-400 font-extrabold';
    if (status === 'Finalizado') return 'bg-blue-100 text-blue-900 border border-blue-300 font-extrabold';
    if (rag === 'red') return 'bg-rose-100 text-rose-900 border border-rose-300 font-extrabold';
    if (rag === 'amber') return 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold';
    return 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold';
  }

  getRoadmapStageClass(stage: string) {
    const s = (stage || '').toLowerCase();
    if (s.includes('proposta')) return 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold';
    if (s.includes('negociação') || s.includes('negociacao')) return 'bg-orange-100 text-orange-900 border border-orange-300 font-extrabold';
    if (s.includes('discovery')) return 'bg-sky-100 text-sky-900 border border-sky-300 font-extrabold';
    if (s.includes('arquitetura')) return 'bg-blue-100 text-blue-900 border border-blue-300 font-extrabold';
    if (s.includes('escopo')) return 'bg-teal-100 text-teal-900 border border-teal-300 font-extrabold';
    if (s.includes('kick-off') || s.includes('início')) return 'bg-emerald-200 text-emerald-950 border border-emerald-400 font-extrabold';
    if (s.includes('contrato')) return 'bg-purple-100 text-purple-900 border border-purple-300 font-extrabold';
    if (s.includes('budget') || s.includes('orçamento')) return 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold';
    if (s.includes('viabilidade')) return 'bg-teal-100 text-teal-900 border border-teal-300 font-extrabold';
    if (s.includes('ideação') || s.includes('ideacao')) return 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300 font-extrabold';
    if (s.includes('prospecção') || s.includes('prospeccao')) return 'bg-violet-100 text-violet-900 border border-violet-300 font-extrabold';
    if (s.includes('priorização') || s.includes('priorizacao')) return 'bg-lime-100 text-lime-900 border border-lime-300 font-extrabold';
    if (s.includes('espera') || s.includes('pausado')) return 'bg-slate-200 text-slate-800 border border-slate-400 font-extrabold';
    if (s.includes('cancelado')) return 'bg-rose-100 text-rose-900 border border-rose-300 font-extrabold';
    return 'bg-blue-100 text-blue-900 border border-blue-300 font-extrabold';
  }

  getStrategicValueBadgeClass(val: string, theme: 'dark' | 'light' = 'light'): string {
    const v = (val || '').toLowerCase();
    if (v.includes('muito alto') || v.includes('crítico')) {
      return theme === 'dark' 
        ? 'bg-purple-950/80 text-purple-200 border border-purple-700' 
        : 'bg-purple-100 text-purple-900 border border-purple-300';
    }
    if (v.includes('alto') || v.includes('estratégico')) {
      return theme === 'dark' 
        ? 'bg-blue-950/80 text-blue-200 border border-blue-700' 
        : 'bg-blue-100 text-blue-900 border border-blue-300';
    }
    if (v.includes('médio')) {
      return theme === 'dark' 
        ? 'bg-amber-950/80 text-amber-200 border border-amber-700' 
        : 'bg-amber-100 text-amber-900 border border-amber-300';
    }
    return theme === 'dark' 
      ? 'bg-slate-800 text-slate-300 border border-slate-700 font-semibold' 
      : 'bg-slate-100 text-slate-800 border border-slate-300 font-semibold';
  }

  hasAttentionPoints(p?: WeeklyReportProject | null): boolean {
    if (!p || !p.attentionPoints) return false;
    const text = p.attentionPoints.trim();
    if (!text) return false;
    const lower = text.toLowerCase();
    if (lower === 'execução fluindo dentro dos marcos acordados.' ||
        lower === 'execucao fluindo dentro dos marcos acordados.' ||
        lower === 'sem registro.' ||
        lower === 'sem pontos de atenção.' ||
        lower === 'sem pontos de atencao.' ||
        lower === 'nenhum' ||
        lower === 'n/a' ||
        lower === '-') {
      return false;
    }
    return true;
  }

  getAttentionBoxClass(p: WeeklyReportProject, theme: 'dark' | 'light' = 'light'): string {
    if (theme === 'dark') {
      if (p.ragStatus === 'red') {
        return 'bg-rose-950/80 border-rose-700 text-rose-200';
      }
      return 'bg-amber-950/80 border-amber-700 text-amber-200';
    }
    if (p.ragStatus === 'red') {
      return 'bg-rose-100 border-2 border-rose-300 text-rose-950';
    }
    return 'bg-amber-100 border-2 border-amber-300 text-amber-950';
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

  getCurrentReportDate(p?: WeeklyReportProject): string {
    if (p?.statusReportDate) return this.formatDate(p.statusReportDate);
    const meetingDate = this.currentReport()?.meetingDate;
    if (meetingDate) return this.formatDate(meetingDate);
    return '16/10/2026';
  }

  getPreviousReportDate(p?: WeeklyReportProject): string {
    if (p?.previousStatusReportDate) return this.formatDate(p.previousStatusReportDate);
    const current = this.currentReport();
    const summaries = this.service.weeklyReports();
    if (current && summaries.length > 0) {
      const prev = summaries.find(s => s.id !== current.id && (s.weekNumber < current.weekNumber || s.id < current.id));
      if (prev?.meetingDate) return this.formatDate(prev.meetingDate);
    }
    return '06/10/2026';
  }

  printReport() {
    const prevTitle = document.title;
    const edition = this.currentReport()?.id || 'Semana';
    const themeName = this.presentationTheme() === 'dark' ? 'Escuro' : 'Claro';
    document.title = `Status_Report_Executivo_${edition}_ILC_Paisagem_${themeName}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  }
}
