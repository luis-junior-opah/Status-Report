import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { WeeklyReportProject, RoadmapProject, BoardDecision } from '../../models/weekly-report.model';

@Component({
  selector: 'app-executive-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      [ngClass]="{
        'fixed inset-0 z-50 bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-8': service.presentationMode(),
        'space-y-5 mb-10': !service.presentationMode()
      }"
      class="print:p-0 print:bg-white print:text-slate-900 transition-all font-sans">

      <!-- ======================================================== -->
      <!-- TOP EXECUTIVE CONTROL BAR                                -->
      <!-- ======================================================== -->
      <div
        class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 print:hidden"
        [ngClass]="service.presentationMode() ? '!bg-slate-900/90 !border-slate-800 !text-white' : ''">
        
        <!-- Left: Co-branding & Title -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0"
            [ngClass]="service.presentationMode() ? '!bg-blue-600' : ''">
            📊
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm sm:text-base font-extrabold tracking-tight"
                [ngClass]="service.presentationMode() ? 'text-white' : 'text-slate-900'">
                Status Report
              </h1>
            </div>
            <p class="text-[11px]" [ngClass]="service.presentationMode() ? 'text-slate-400' : 'text-slate-500'">
              Edição: <strong [ngClass]="service.presentationMode() ? 'text-slate-200' : 'text-slate-800'">{{ service.formatEditionTitle(currentReport()) }}</strong>
              • Período: {{ currentReport()?.period }}
            </p>
          </div>
        </div>

        <!-- Center / Right: Quick Filters, Layout Toggle & Actions -->
        <div class="flex items-center flex-wrap gap-2">
          
          <!-- Quick Client Filter Pills -->
          <div class="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold"
            [ngClass]="service.presentationMode() ? '!bg-slate-800 text-slate-300' : 'text-slate-600'">
            <button
              (click)="selectedClientFilter.set('Todos')"
              [ngClass]="selectedClientFilter() === 'Todos' ? 'bg-white shadow-xs text-blue-700' : 'hover:text-slate-900'"
              class="px-2.5 py-1 rounded-lg transition">
              Todos ({{ currentReport()?.activeProjects?.length || 0 }})
            </button>
            <button
              *ngFor="let c of distinctClients()"
              (click)="selectedClientFilter.set(c)"
              [ngClass]="selectedClientFilter() === c ? 'bg-white shadow-xs text-blue-700' : 'hover:text-slate-900'"
              class="px-2.5 py-1 rounded-lg transition whitespace-nowrap">
              {{ c }} ({{ getClientCount(c) }})
            </button>
            <button
              (click)="selectedClientFilter.set('Alertas')"
              [ngClass]="selectedClientFilter() === 'Alertas' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600 hover:text-rose-800'"
              class="px-2.5 py-1 rounded-lg transition flex items-center gap-1 font-extrabold">
              <span>🚨 Críticos</span>
              <span>({{ getAlertCount() }})</span>
            </button>
          </div>

          <!-- Layout Mode Switcher (One Page Matrix vs Detailed Cards) -->
          <div class="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold"
            [ngClass]="service.presentationMode() ? '!bg-slate-800 text-slate-300' : 'text-slate-600'">
            <button
              (click)="viewMode.set('matrix')"
              [ngClass]="viewMode() === 'matrix' ? 'bg-white shadow-xs text-slate-900' : 'hover:text-slate-900'"
              class="px-2.5 py-1 rounded-lg transition flex items-center gap-1"
              title="Tabela Executiva Compacta de Altíssima Densidade (Recomendado)">
              <span>📑 Matriz Síntese</span>
            </button>
            <button
              (click)="viewMode.set('cards')"
              [ngClass]="viewMode() === 'cards' ? 'bg-white shadow-xs text-slate-900' : 'hover:text-slate-900'"
              class="px-2.5 py-1 rounded-lg transition flex items-center gap-1"
              title="Visão em Cards Compactos">
              <span>🗂️ Cards</span>
            </button>
          </div>

          <!-- History Dropdown -->
          <select
            [ngModel]="service.selectedReportId()"
            (ngModelChange)="onSelectReport($event)"
            class="text-[11px] font-bold rounded-xl px-2.5 py-1.5 border focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
            [ngClass]="service.presentationMode() ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'">
            <option *ngFor="let rep of service.weeklyReports()" [value]="rep.id">
              {{ service.formatEditionTitle(rep) }}
            </option>
          </select>

          <!-- Presentation Mode Button -->
          <button
            (click)="service.togglePresentationMode()"
            class="px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1.5 shadow-2xs"
            [ngClass]="service.presentationMode() ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'">
            <span>{{ service.presentationMode() ? '✕ Fechar Apresentação' : '🖥️ Modo Apresentação' }}</span>
          </button>

          <!-- Print / PDF Button -->
          <button
            (click)="printReport()"
            class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 border shadow-2xs"
            [ngClass]="service.presentationMode() ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'">
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
        <!-- 1. HERO BANNER: HEADLINE & EXECUTIVE PULSE KPIS          -->
        <!-- ======================================================== -->
        <div
          class="rounded-2xl border shadow-sm p-4 sm:p-5 transition-all"
          [ngClass]="service.presentationMode() ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-900 text-white border-slate-800'">
          
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <!-- Left: Headline Statement -->
            <div class="max-w-2xl">
              <div class="flex items-center gap-2 mb-1.5 text-[10px] font-bold text-blue-400 tracking-wider uppercase">
                <span>🗓️ Reunião de Diretoria: {{ formatDate(currentReport()?.meetingDate) }}</span>
                <span>•</span>
                <span>Ciclo Semanal Oficial</span>
              </div>
              <h2 class="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug">
                {{ currentReport()?.executiveSummary }}
              </h2>
            </div>

            <!-- Right: 4 Sleek Pulse Metrics -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <!-- Active Projects -->
              <div class="px-3.5 py-2.5 bg-white/5 rounded-xl border border-white/10 text-center min-w-[95px]">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Projetos Ativos</span>
                <span class="text-xl font-black text-white block mt-0.5">
                  {{ currentReport()?.statusPulse?.totalActive || 0 }}
                </span>
                <span class="text-[9px] text-slate-400">100% monitorados</span>
              </div>

              <!-- On Track -->
              <div class="px-3.5 py-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center min-w-[95px]">
                <span class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">No Prazo</span>
                <span class="text-xl font-black text-emerald-400 block mt-0.5">
                  {{ currentReport()?.statusPulse?.onTrack || 0 }}
                </span>
                <span class="text-[9px] text-emerald-300">
                  {{ getPercent(currentReport()?.statusPulse?.onTrack, currentReport()?.statusPulse?.totalActive) }}% do portfólio
                </span>
              </div>

              <!-- Attention & Critical -->
              <div class="px-3.5 py-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center min-w-[95px]">
                <span class="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">Em Alerta / Desvio</span>
                <span class="text-xl font-black text-rose-400 block mt-0.5">
                  {{ (currentReport()?.statusPulse?.critical || 0) + (currentReport()?.statusPulse?.attention || 0) }}
                </span>
                <span class="text-[9px] text-rose-300">
                  {{ getPercent((currentReport()?.statusPulse?.critical || 0) + (currentReport()?.statusPulse?.attention || 0), currentReport()?.statusPulse?.totalActive) }}% demandam foco
                </span>
              </div>

              <!-- Average Progress -->
              <div class="px-3.5 py-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center min-w-[95px]">
                <span class="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">Avanço Médio</span>
                <span class="text-xl font-black text-blue-400 block mt-0.5">
                  {{ currentReport()?.statusPulse?.averageProgress || 0 }}%
                </span>
                <span class="text-[9px] text-blue-300">conclusão física</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- 2. EXECUTIVE CALLOUT: FOCO IMEDIATO DA DIRETORIA         -->
        <!-- ======================================================== -->
        <div *ngIf="topCriticalProjects().length > 0"
          class="rounded-2xl border p-4 transition-all"
          [ngClass]="service.presentationMode() ? 'bg-slate-900/90 border-rose-950/60' : 'bg-rose-50/50 border-rose-200/90'">
          
          <div class="flex items-center justify-between pb-2.5 mb-3 border-b"
            [ngClass]="service.presentationMode() ? 'border-slate-800' : 'border-rose-200/60'">
            <div class="flex items-center gap-2">
              <span class="text-xs">🚨</span>
              <h3 class="text-xs font-black tracking-tight"
                [ngClass]="service.presentationMode() ? 'text-rose-400' : 'text-rose-950'">
                Radar de Atenção Imediata da Diretoria ({{ topCriticalProjects().length }} Projetos com Desvio ou Atenção Crítica)
              </h3>
            </div>
            <span class="text-[10px] font-bold"
              [ngClass]="service.presentationMode() ? 'text-slate-400' : 'text-rose-700'">
              Itens prioritários para deliberação na reunião de hoje
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              *ngFor="let item of topCriticalProjects()"
              class="p-3 rounded-xl border flex flex-col justify-between"
              [ngClass]="service.presentationMode() ? 'bg-slate-950 border-rose-900/40 text-slate-200' : 'bg-white border-rose-200 text-slate-800 shadow-2xs'">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span class="text-[10px] font-bold text-slate-500">{{ item.client }}</span>
                  <span class="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {{ item.ragStatus === 'red' ? 'Com Desvio' : 'Atenção' }}
                  </span>
                </div>
                <h4 class="text-xs font-black leading-snug truncate" [title]="item.name">{{ item.name }}</h4>
                <p class="text-[11px] text-rose-900 mt-1 leading-snug font-medium line-clamp-2">
                  {{ item.attentionPoints }}
                </p>
              </div>
              <div class="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Fase: <strong class="text-slate-700">{{ item.currentMilestone }}</strong></span>
                <span class="font-bold text-rose-600">{{ item.progress }}% concluído</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- 3. MATRIZ EXECUTIVA DO PORTFÓLIO (HIGH-DENSITY MATRIX)   -->
        <!-- ======================================================== -->
        <div *ngIf="viewMode() === 'matrix'"
          class="rounded-2xl border shadow-2xs overflow-hidden"
          [ngClass]="service.presentationMode() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'">
          
          <!-- Matrix Header Bar -->
          <div class="p-3.5 border-b flex items-center justify-between gap-3"
            [ngClass]="service.presentationMode() ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/70 border-slate-100'">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                📌
              </span>
              <h3 class="text-xs sm:text-sm font-extrabold"
                [ngClass]="service.presentationMode() ? 'text-white' : 'text-slate-900'">
                Matriz Consolidada de Projetos Ativos ({{ displayedProjects().length }})
              </h3>
            </div>

            <!-- EAP Badges Legend helper -->
            <div class="hidden md:flex items-center gap-1.5 text-[10px]">
              <span class="font-bold text-slate-400 mr-0.5 uppercase text-[9px]">Fases EAP:</span>
              <span class="px-1.5 py-0.2 rounded font-semibold bg-purple-50 text-purple-700 border border-purple-200">Planejamento</span>
              <span class="px-1.5 py-0.2 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">Desenvolvimento</span>
              <span class="px-1.5 py-0.2 rounded font-semibold bg-orange-50 text-orange-700 border border-orange-200">Homologação</span>
              <span class="px-1.5 py-0.2 rounded font-semibold bg-teal-50 text-teal-700 border border-teal-200">Treinamento</span>
              <span class="px-1.5 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Operação Assistida</span>
            </div>
          </div>

          <!-- The Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="text-[10px] uppercase tracking-wider font-extrabold border-b"
                  [ngClass]="service.presentationMode() ? 'bg-slate-950/60 text-slate-400 border-slate-800' : 'bg-slate-100/80 text-slate-500 border-slate-200'">
                  <th class="py-2.5 px-3.5 w-36">Cliente</th>
                  <th class="py-2.5 px-3 w-64">Projeto</th>
                  <th class="py-2.5 px-3 w-36">Etapa EAP</th>
                  <th class="py-2.5 px-3 w-32">Progresso</th>
                  <th class="py-2.5 px-3 w-28">Saúde</th>
                  <th class="py-2.5 px-3 w-24">Entrega</th>
                  <th class="py-2.5 px-3">Destaque da Semana & Ponto de Atenção</th>
                  <th class="py-2.5 px-3 w-16 text-center">EAP</th>
                </tr>
              </thead>
              <tbody class="divide-y" [ngClass]="service.presentationMode() ? 'divide-slate-800' : 'divide-slate-100'">
                <tr
                  *ngFor="let p of displayedProjects()"
                  class="transition group"
                  [ngClass]="service.presentationMode() ? 'hover:bg-slate-800/60' : 'hover:bg-blue-50/40'">
                  
                  <!-- Cliente -->
                  <td class="py-2.5 px-3.5 whitespace-nowrap">
                    <span class="font-bold text-[11px] px-2 py-0.5 rounded-md border"
                      [ngClass]="service.presentationMode() ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'">
                      {{ p.client }}
                    </span>
                  </td>

                  <!-- Projeto, Prioridade & Sistemas -->
                  <td class="py-2.5 px-3 font-extrabold"
                    [ngClass]="service.presentationMode() ? 'text-white' : 'text-slate-900'">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <!-- Priority Pill -->
                      <span
                        class="text-[9px] font-black px-1.5 py-0.2 rounded border shadow-2xs shrink-0 cursor-default"
                        [ngClass]="service.getPriorityBadgeClass(p.priority || 'P2')"
                        [title]="'Prioridade ' + (p.priority || 'P2') + ' (' + service.getPriorityLabel(p.priority || 'P2') + ')'">
                        {{ p.priority || 'P2' }}
                      </span>
                      <span class="truncate block max-w-xs group-hover:text-blue-600 transition" [title]="p.name">
                        {{ p.name }}
                      </span>
                    </div>
                    <!-- Systems Chips -->
                    <div *ngIf="p.systems && p.systems.length > 0" class="flex flex-wrap items-center gap-1 mt-1 font-normal">
                      <span
                        *ngFor="let sys of p.systems"
                        [ngClass]="service.getSystemBadgeClass(sys)"
                        class="px-1.5 py-0.2 rounded text-[9px] font-bold border shadow-2xs">
                        {{ sys }}
                      </span>
                    </div>
                  </td>

                  <!-- Etapa EAP -->
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    <span [ngClass]="service.getMilestoneBadgeClass(p.currentMilestone)" class="px-2 py-0.5 rounded-md font-semibold text-[10px]">
                      {{ p.currentMilestone }}
                    </span>
                  </td>

                  <!-- Progresso -->
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden"
                        [ngClass]="service.presentationMode() ? '!bg-slate-700' : ''">
                        <div
                          class="h-full rounded-full"
                          [ngClass]="p.ragStatus === 'red' ? 'bg-rose-500' : (p.ragStatus === 'amber' ? 'bg-amber-500' : 'bg-blue-600')"
                          [style.width.%]="p.progress">
                        </div>
                      </div>
                      <span class="font-black text-[11px]"
                        [ngClass]="service.presentationMode() ? 'text-slate-200' : 'text-slate-800'">
                        {{ p.progress }}%
                      </span>
                    </div>
                  </td>

                  <!-- Saúde RAG -->
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-block"
                      [ngClass]="getRagPillClass(p.ragStatus)">
                      {{ p.ragStatus === 'red' ? 'Desvio' : (p.ragStatus === 'amber' ? 'Atenção' : 'No Prazo') }}
                    </span>
                  </td>

                  <!-- Entrega -->
                  <td class="py-2.5 px-3 whitespace-nowrap font-medium text-[11px]"
                    [ngClass]="service.presentationMode() ? 'text-slate-400' : 'text-slate-600'">
                    {{ formatDate(p.targetDelivery) }}
                  </td>

                  <!-- Resumo da Semana & Atenção -->
                  <td class="py-2 px-3 text-[11px] leading-snug">
                    <div class="line-clamp-2">
                      <span [ngClass]="service.presentationMode() ? 'text-slate-200' : 'text-slate-800 font-medium'">
                        {{ p.statusReport }}
                      </span>
                      <span *ngIf="p.ragStatus === 'red' || p.ragStatus === 'amber'"
                        class="ml-1 font-bold inline-flex items-center gap-0.5"
                        [ngClass]="p.ragStatus === 'red' ? 'text-rose-600' : 'text-amber-600'">
                        • ⚠️ {{ p.attentionPoints }}
                      </span>
                    </div>
                  </td>

                  <!-- EAP Link -->
                  <td class="py-2.5 px-3 whitespace-nowrap text-center">
                    <button
                      (click)="service.openEapForProject(p.projectId)"
                      class="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                      title="Abrir Cronograma EAP Detalhado">
                      Ver EAP
                    </button>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- ALTERNATIVE VIEW: CARDS EXECUTIVOS COMPACTOS             -->
        <!-- ======================================================== -->
        <div *ngIf="viewMode() === 'cards'"
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          <div
            *ngFor="let p of displayedProjects()"
            class="rounded-2xl border p-4 flex flex-col justify-between transition-all hover:shadow-xs"
            [ngClass]="service.presentationMode() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'">
            
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
                  <span class="text-[10px] font-bold px-1.5 py-0.2 rounded border"
                    [ngClass]="service.presentationMode() ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'">
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
              <h4 class="text-xs sm:text-sm font-extrabold tracking-tight truncate leading-snug mb-1"
                [ngClass]="service.presentationMode() ? 'text-white' : 'text-slate-900'"
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
                <div class="flex items-center justify-between text-[10px] font-bold mb-1"
                  [ngClass]="service.presentationMode() ? 'text-slate-400' : 'text-slate-500'">
                  <span>Progresso</span>
                  <span class="font-black text-slate-800" [ngClass]="service.presentationMode() ? '!text-white' : ''">{{ p.progress }}%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"
                  [ngClass]="service.presentationMode() ? '!bg-slate-800' : ''">
                  <div
                    class="h-full rounded-full"
                    [ngClass]="p.ragStatus === 'red' ? 'bg-rose-500' : (p.ragStatus === 'amber' ? 'bg-amber-500' : 'bg-blue-600')"
                    [style.width.%]="p.progress">
                  </div>
                </div>
              </div>

              <!-- Highlights paragraph -->
              <p class="text-[11px] leading-relaxed mb-2"
                [ngClass]="service.presentationMode() ? 'text-slate-300' : 'text-slate-700'">
                {{ p.statusReport }}
              </p>

              <!-- Attention Point callout if any -->
              <div *ngIf="p.ragStatus === 'red' || p.ragStatus === 'amber'"
                class="p-2 rounded-lg text-[10px] leading-snug mb-2"
                [ngClass]="p.ragStatus === 'red' ? 'bg-rose-50 text-rose-900 border border-rose-200' : 'bg-amber-50 text-amber-900 border border-amber-200'">
                <strong>⚠️ Ponto de Atenção:</strong> {{ p.attentionPoints }}
              </div>
            </div>

            <!-- Card Bottom -->
            <div class="pt-2 border-t flex items-center justify-between text-[10px] text-slate-400"
              [ngClass]="service.presentationMode() ? 'border-slate-800' : 'border-slate-100'">
              <span>Meta: <strong class="text-slate-600">{{ formatDate(p.targetDelivery) }}</strong></span>
              <button
                (click)="service.openEapForProject(p.projectId)"
                class="text-blue-600 font-bold hover:underline cursor-pointer">
                Ver EAP →
              </button>
            </div>

          </div>
        </div>

        <!-- ======================================================== -->
        <!-- 4. BOTTOM GRID: ROADMAP (PIPELINE) & BOARD DECISIONS     -->
        <!-- ======================================================== -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          <!-- Radar de Projetos no Roadmap (Pipeline) -->
          <div
            class="rounded-2xl border shadow-2xs p-4 sm:p-5 flex flex-col justify-between"
            [ngClass]="service.presentationMode() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'">
            
            <div>
              <div class="flex items-center justify-between pb-2.5 mb-3 border-b"
                [ngClass]="service.presentationMode() ? 'border-slate-800' : 'border-slate-100'">
                <div class="flex items-center gap-2">
                  <span class="text-xs">🔭</span>
                  <h3 class="text-xs sm:text-sm font-extrabold"
                    [ngClass]="service.presentationMode() ? 'text-white' : 'text-slate-900'">
                    Projetos no Radar & Roadmap Estratégico ({{ currentReport()?.roadmapProjects?.length || 0 }})
                  </h3>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Pipeline
                </span>
              </div>

              <!-- Roadmap Cards Grid (2x2) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  *ngFor="let road of currentReport()?.roadmapProjects"
                  class="p-3 rounded-xl border flex flex-col justify-between"
                  [ngClass]="service.presentationMode() ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/60 border-slate-200/80'">
                  <div>
                    <div class="flex items-center justify-between gap-1 mb-1">
                      <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-700">
                        {{ road.client }}
                      </span>
                      <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full"
                        [ngClass]="getRoadmapStageClass(road.stage)">
                        {{ road.stage }}
                      </span>
                    </div>
                    <h4 class="text-xs font-black truncate leading-snug"
                      [ngClass]="service.presentationMode() ? 'text-white' : 'text-slate-900'"
                      [title]="road.name">
                      {{ road.name }}
                    </h4>
                    <p class="text-[10px] leading-snug line-clamp-2 mt-1 text-slate-500">
                      {{ road.description }}
                    </p>
                  </div>
                  <div class="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                    <span>Início: <strong class="text-slate-700">{{ road.estimatedStart }}</strong></span>
                    <span class="font-extrabold text-indigo-600">{{ road.strategicValue }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Deliberações da Diretoria -->
          <div
            class="rounded-2xl border shadow-2xs p-4 sm:p-5 flex flex-col justify-between"
            [ngClass]="service.presentationMode() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'">
            
            <div>
              <div class="flex items-center justify-between pb-2.5 mb-3 border-b"
                [ngClass]="service.presentationMode() ? 'border-slate-800' : 'border-slate-100'">
                <div class="flex items-center gap-2">
                  <span class="text-xs">⚖️</span>
                  <h3 class="text-xs sm:text-sm font-extrabold"
                    [ngClass]="service.presentationMode() ? 'text-white' : 'text-slate-900'">
                    Deliberações & Decisões Esperadas da Diretoria
                  </h3>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Pauta
                </span>
              </div>

              <!-- Decisions List -->
              <div class="space-y-2">
                <div
                  *ngFor="let dec of currentReport()?.boardDecisions"
                  class="p-2.5 rounded-xl border flex items-start justify-between gap-3"
                  [ngClass]="service.presentationMode() ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/60 border-slate-200/80'">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <span class="text-[9px] font-bold text-slate-400 uppercase">{{ dec.client }}</span>
                      <span>•</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full"
                        [ngClass]="dec.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
                        {{ dec.status }}
                      </span>
                    </div>
                    <h4 class="text-xs font-black truncate leading-snug"
                      [ngClass]="service.presentationMode() ? 'text-white' : 'text-slate-900'">
                      {{ dec.title }}
                    </h4>
                    <p class="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-1">
                      {{ dec.impact }}
                    </p>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="text-[9px] text-slate-400 block">Prazo</span>
                    <strong class="text-[10px] text-blue-600 font-bold block">{{ dec.deadline }}</strong>
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
export class ExecutiveReportComponent {
  service = inject(ProjectService);

  selectedClientFilter = signal<string>('Todos');
  viewMode = signal<'matrix' | 'cards'>('matrix');

  currentReport = computed(() => this.service.currentWeeklyReport());

  distinctClients = computed(() => {
    const list = this.currentReport()?.activeProjects || [];
    const set = new Set(list.map(p => p.client));
    return Array.from(set).sort();
  });

  displayedProjects = computed(() => {
    const report = this.currentReport();
    if (!report || !report.activeProjects) return [];
    const filter = this.selectedClientFilter();
    if (filter === 'Todos') return report.activeProjects;
    if (filter === 'Alertas') {
      return report.activeProjects.filter(p => p.ragStatus === 'red' || p.ragStatus === 'amber');
    }
    return report.activeProjects.filter(p => p.client.toLowerCase() === filter.toLowerCase());
  });

  topCriticalProjects = computed(() => {
    const report = this.currentReport();
    if (!report || !report.activeProjects) return [];
    return report.activeProjects.filter(p => p.ragStatus === 'red' || p.ragStatus === 'amber').slice(0, 3);
  });

  getClientCount(client: string): number {
    const list = this.currentReport()?.activeProjects || [];
    return list.filter(p => p.client.toLowerCase() === client.toLowerCase()).length;
  }

  getAlertCount(): number {
    const list = this.currentReport()?.activeProjects || [];
    return list.filter(p => p.ragStatus === 'red' || p.ragStatus === 'amber').length;
  }

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
