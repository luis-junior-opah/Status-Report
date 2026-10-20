import { Component, inject, computed, signal, OnInit } from '@angular/core';
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
          
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <!-- Left: Headline Statement / Emission Date -->
            <div class="flex flex-col justify-center">
              <div class="flex items-center gap-2 text-[11px] font-bold text-blue-700 tracking-wider uppercase">
                <span>🗓️ Emissão: {{ formatDate(currentReport()?.meetingDate) }}</span>
              </div>
              <h2 *ngIf="currentReport()?.executiveSummary && !currentReport()?.executiveSummary?.includes('Visão executiva consolidada')"
                class="text-sm font-extrabold text-slate-900 tracking-tight leading-snug mt-1 max-w-xl">
                {{ currentReport()?.executiveSummary }}
              </h2>
            </div>

            <!-- Right: 6 Sleek Pulse Metrics (Light Theme) -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">
              <!-- 1. Projetos Ativos -->
              <div class="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-center min-w-[95px] shadow-2xs">
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Projetos Ativos</span>
                <span class="text-xl font-black text-slate-900 block mt-0.5">
                  {{ currentReport()?.statusPulse?.totalActive || 0 }}
                </span>
                <span class="text-[9px] text-slate-500 font-medium">100% monitorados</span>
              </div>

              <!-- 2. No Prazo -->
              <div class="px-3 py-2 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-center min-w-[95px] shadow-2xs">
                <span class="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">No Prazo</span>
                <span class="text-xl font-black text-emerald-700 block mt-0.5">
                  {{ currentReport()?.statusPulse?.onTrack || 0 }}
                </span>
                <span class="text-[9px] text-emerald-700 font-medium">
                  {{ getPercent(currentReport()?.statusPulse?.onTrack, currentReport()?.statusPulse?.totalActive) }}% portfólio
                </span>
              </div>

              <!-- 3. Atenção (Radar de Atenção Imediata da Diretoria) -->
              <div class="px-3 py-2 bg-rose-50/70 rounded-xl border border-rose-200/80 text-center min-w-[95px] shadow-2xs">
                <span class="text-[9px] font-bold text-rose-800 uppercase tracking-wider block">Atenção</span>
                <span class="text-xl font-black text-rose-700 block mt-0.5">
                  {{ topCriticalProjects().length }}
                </span>
                <span class="text-[9px] text-rose-700 font-medium">radar imediato</span>
              </div>

              <!-- 4. Deliberações (Deliberações & Decisões Esperadas da Diretoria) -->
              <div class="px-3 py-2 bg-amber-50/70 rounded-xl border border-amber-200/80 text-center min-w-[95px] shadow-2xs">
                <span class="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">Deliberações</span>
                <span class="text-xl font-black text-amber-800 block mt-0.5">
                  {{ currentReport()?.boardDecisions?.length || 0 }}
                </span>
                <span class="text-[9px] text-amber-800 font-medium">pautas diretoria</span>
              </div>

              <!-- 5. Roadmap (Projetos no Radar & Roadmap Estratégico) -->
              <div class="px-3 py-2 bg-blue-50/70 rounded-xl border border-blue-200/80 text-center min-w-[95px] shadow-2xs">
                <span class="text-[9px] font-bold text-blue-800 uppercase tracking-wider block">Roadmap</span>
                <span class="text-xl font-black text-blue-700 block mt-0.5">
                  {{ currentReport()?.roadmapProjects?.length || 0 }}
                </span>
                <span class="text-[9px] text-blue-700 font-medium">pipeline estratégico</span>
              </div>

              <!-- 6. Avanço Médio -->
              <div class="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-center min-w-[95px] shadow-2xs">
                <span class="text-[9px] font-bold text-slate-600 uppercase tracking-wider block">Avanço Médio</span>
                <span class="text-xl font-black text-blue-700 block mt-0.5">
                  {{ currentReport()?.statusPulse?.averageProgress || 0 }}%
                </span>
                <span class="text-[9px] text-slate-500 font-medium">conclusão física</span>
              </div>
            </div>
          </div>

          <!-- Priority Distribution Bar -->
          <div class="mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs">🎯</span>
              <span class="text-xs font-black text-slate-900 tracking-tight">Prioridade do Projeto:</span>
              <span class="text-[11px] text-slate-500 font-medium hidden sm:inline">Volume de projetos ativos por nível de criticidade</span>
              <button
                *ngIf="service.selectedPriority() !== 'Todos'"
                type="button"
                (click)="service.selectedPriority.set('Todos')"
                class="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline ml-1 cursor-pointer">
                (Limpar filtro: {{ service.selectedPriority() }})
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <!-- P1 - Crítica -->
              <button
                type="button"
                (click)="togglePriorityFilter('P1')"
                [ngClass]="service.selectedPriority() === 'P1' ? 'ring-2 ring-rose-500 bg-rose-100/90 border-rose-300' : 'bg-rose-50/70 hover:bg-rose-100/60 border-rose-200/80'"
                class="px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs"
                title="Filtrar por Prioridade P1 - Crítica">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-rose-800 uppercase tracking-wider leading-none">P1 • Crítica</span>
                    <span class="text-[9px] text-rose-600/80 font-medium mt-0.5 leading-none">Urgência máxima</span>
                  </div>
                </div>
                <span class="text-base font-black text-rose-700 leading-none">
                  {{ getPriorityCount('P1') }}
                </span>
              </button>

              <!-- P2 - Alta -->
              <button
                type="button"
                (click)="togglePriorityFilter('P2')"
                [ngClass]="service.selectedPriority() === 'P2' ? 'ring-2 ring-amber-500 bg-amber-100/90 border-amber-300' : 'bg-amber-50/70 hover:bg-amber-100/60 border-amber-200/80'"
                class="px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs"
                title="Filtrar por Prioridade P2 - Alta">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-amber-800 uppercase tracking-wider leading-none">P2 • Alta</span>
                    <span class="text-[9px] text-amber-600/80 font-medium mt-0.5 leading-none">Impacto direto</span>
                  </div>
                </div>
                <span class="text-base font-black text-amber-800 leading-none">
                  {{ getPriorityCount('P2') }}
                </span>
              </button>

              <!-- P3 - Média -->
              <button
                type="button"
                (click)="togglePriorityFilter('P3')"
                [ngClass]="service.selectedPriority() === 'P3' ? 'ring-2 ring-blue-500 bg-blue-100/90 border-blue-300' : 'bg-blue-50/70 hover:bg-blue-100/60 border-blue-200/80'"
                class="px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs"
                title="Filtrar por Prioridade P3 - Média">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-blue-800 uppercase tracking-wider leading-none">P3 • Média</span>
                    <span class="text-[9px] text-blue-600/80 font-medium mt-0.5 leading-none">Evolução regular</span>
                  </div>
                </div>
                <span class="text-base font-black text-blue-700 leading-none">
                  {{ getPriorityCount('P3') }}
                </span>
              </button>

              <!-- P4 - Baixa -->
              <button
                type="button"
                (click)="togglePriorityFilter('P4')"
                [ngClass]="service.selectedPriority() === 'P4' ? 'ring-2 ring-slate-500 bg-slate-200/90 border-slate-300' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'"
                class="px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs"
                title="Filtrar por Prioridade P4 - Baixa">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-slate-700 uppercase tracking-wider leading-none">P4 • Baixa</span>
                    <span class="text-[9px] text-slate-500 font-medium mt-0.5 leading-none">Demanda rotina</span>
                  </div>
                </div>
                <span class="text-base font-black text-slate-700 leading-none">
                  {{ getPriorityCount('P4') }}
                </span>
              </button>
            </div>
          </div>

          <!-- Systems Distribution Bar -->
          <div *ngIf="systemMetrics().length > 0"
            class="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs">🖥️</span>
              <span class="text-xs font-black text-slate-900 tracking-tight">Projetos por Sistema:</span>
              <span class="text-[11px] text-slate-500 font-medium hidden sm:inline">Volume de projetos ativos por ecossistema tecnológico</span>
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
                class="px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-2xs"
                [title]="'Filtrar por Sistema ' + s.name">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-xs shrink-0">{{ s.icon }}</span>
                  <div class="flex flex-col min-w-0">
                    <span class="text-[9px] font-black truncate leading-tight" [ngClass]="s.textClass">{{ s.name }}</span>
                    <span class="text-[9px] text-slate-400 font-medium mt-0.5 leading-none">sistema</span>
                  </div>
                </div>
                <span class="text-base font-black leading-none shrink-0" [ngClass]="s.countClass">
                  {{ s.count }}
                </span>
              </button>
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

              <!-- Equipe Alocada -->
              <div *ngIf="getAllTeamMembers(p).length > 0" class="mt-2.5 pt-2 border-t border-slate-100">
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span>👥</span>
                    <span>Equipe Alocada</span>
                  </span>
                  <span class="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
                    {{ getAllTeamMembers(p).length }} pessoa{{ getAllTeamMembers(p).length > 1 ? 's' : '' }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-1">
                  <!-- Leader Badge -->
                  <span
                    *ngIf="p.teamLeader"
                    class="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900 shadow-2xs"
                    [title]="'Líder Técnico: ' + p.teamLeader">
                    <span>👑</span>
                    <span>{{ p.teamLeader }}</span>
                    <span class="text-[8px] font-bold px-1 rounded bg-blue-200/80 text-blue-800">Líder</span>
                  </span>

                  <!-- Other Members Badges -->
                  <span
                    *ngFor="let member of getNonLeaderMembers(p)"
                    class="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs"
                    [title]="'Integrante da equipe: ' + member">
                    <span class="text-[8px] text-slate-400">👤</span>
                    <span>{{ member }}</span>
                  </span>
                </div>
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
export class ExecutiveReportComponent implements OnInit {
  service = inject(ProjectService);

  ngOnInit() {
    this.service.sortBy.set('targetDelivery');
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
        const membersMatch = (p.teamMembers || p.team?.members || []).some(m => m.toLowerCase().includes(query));
        const systemMatch = (p.systems || []).some(s => s.toLowerCase().includes(query));
        const milestoneMatch = (p.currentMilestone || '').toLowerCase().includes(query);
        const statusReportMatch = (p.statusReport || '').toLowerCase().includes(query);
        const attentionMatch = (p.attentionPoints || '').toLowerCase().includes(query);
        return nameMatch || clientMatch || leaderMatch || membersMatch || systemMatch || milestoneMatch || statusReportMatch || attentionMatch;
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
      // default: Data "Meta" da mais próxima para a mais distante (targetDelivery)
      list.sort((a, b) => this.compareByTargetDelivery(a, b));
    }

    return list;
  });

  topCriticalProjects = computed(() => {
    const report = this.currentReport();
    if (!report || !report.activeProjects) return [];
    return report.activeProjects.filter(p => p.ragStatus === 'red' || p.ragStatus === 'amber').slice(0, 3);
  });

  compareByTargetDelivery(a: WeeklyReportProject, b: WeeklyReportProject): number {
    const dateA = a.targetDelivery || '9999-12-31';
    const dateB = b.targetDelivery || '9999-12-31';
    const dateDiff = dateA.localeCompare(dateB);
    if (dateDiff !== 0) return dateDiff;
    return (a.name || '').localeCompare(b.name || '', 'pt-BR');
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
        activeClass: 'ring-2 ring-indigo-500 bg-indigo-100/90 border-indigo-300',
        idleClass: 'bg-indigo-50/70 hover:bg-indigo-100/60 border-indigo-200/80',
        textClass: 'text-indigo-800',
        countClass: 'text-indigo-700'
      },
      'App ILC': {
        icon: '🚚',
        activeClass: 'ring-2 ring-cyan-500 bg-cyan-100/90 border-cyan-300',
        idleClass: 'bg-cyan-50/70 hover:bg-cyan-100/60 border-cyan-200/80',
        textClass: 'text-cyan-800',
        countClass: 'text-cyan-700'
      },
      'App Smart Tracking': {
        icon: '📱',
        activeClass: 'ring-2 ring-emerald-500 bg-emerald-100/90 border-emerald-300',
        idleClass: 'bg-emerald-50/70 hover:bg-emerald-100/60 border-emerald-200/80',
        textClass: 'text-emerald-800',
        countClass: 'text-emerald-700'
      },
      'Smart X': {
        icon: '📋',
        activeClass: 'ring-2 ring-purple-500 bg-purple-100/90 border-purple-300',
        idleClass: 'bg-purple-50/70 hover:bg-purple-100/60 border-purple-200/80',
        textClass: 'text-purple-800',
        countClass: 'text-purple-700'
      },
      'Infraestrutura': {
        icon: '🏗️',
        activeClass: 'ring-2 ring-sky-500 bg-sky-100/90 border-sky-300',
        idleClass: 'bg-sky-50/70 hover:bg-sky-100/60 border-sky-200/80',
        textClass: 'text-sky-800',
        countClass: 'text-sky-700'
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
        activeClass: 'ring-2 ring-slate-500 bg-slate-100/90 border-slate-300',
        idleClass: 'bg-slate-50/70 hover:bg-slate-100/60 border-slate-200/80',
        textClass: 'text-slate-800',
        countClass: 'text-slate-700'
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
