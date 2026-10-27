import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { MaintenancePeriod } from '../../models/maintenance.model';
import { TeamAllocationReport, TeamMemberAllocation, ProjectTeamAllocation, MemberProjectTasksGroup } from '../../models/team.model';

@Component({
  selector: 'app-team-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 mb-12 animate-fade-in">
      
      <!-- TOP EXECUTIVE HEADER & CONTROLS BAR -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 md:p-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <!-- Title & Description -->
          <div>
            <div class="flex items-center gap-2">
              <span class="text-2xl">👥</span>
              <h2 class="text-xl font-black text-slate-900 tracking-tight">
                Análise & Alocação de Equipe
              </h2>
            </div>
          </div>

          <!-- Controls: Period Selector -->
          <div class="flex items-center gap-2.5">
            <!-- Period Selector Tabs -->
            <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                (click)="onPeriodChange('current_month')"
                [ngClass]="service.selectedTeamPeriod() === 'current_month' ? 'bg-white text-indigo-700 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 font-semibold'"
                class="px-2.5 py-1 rounded-lg text-xs transition cursor-pointer">
                📅 Mês Atual
              </button>
              <button
                type="button"
                (click)="onPeriodChange('last_quarter')"
                [ngClass]="service.selectedTeamPeriod() === 'last_quarter' ? 'bg-white text-indigo-700 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 font-semibold'"
                class="px-2.5 py-1 rounded-lg text-xs transition cursor-pointer">
                📊 Trimestre
              </button>
              <button
                type="button"
                (click)="onPeriodChange('year_2026')"
                [ngClass]="service.selectedTeamPeriod() === 'year_2026' ? 'bg-white text-indigo-700 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 font-semibold'"
                class="px-2.5 py-1 rounded-lg text-xs transition cursor-pointer">
                📈 Ano 2026
              </button>
              <button
                type="button"
                (click)="onPeriodChange('all')"
                [ngClass]="service.selectedTeamPeriod() === 'all' ? 'bg-white text-indigo-700 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 font-semibold'"
                class="px-2.5 py-1 rounded-lg text-xs transition cursor-pointer">
                🌐 Todo Período
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- LOADING STATE -->
      <div *ngIf="service.isLoadingTeam()" class="py-16 text-center bg-white rounded-2xl border border-slate-200">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p class="mt-3 text-xs font-semibold text-slate-500">Calculando alocações e dedicação da equipe...</p>
      </div>

      <!-- MAIN CONTENT -->
      <ng-container *ngIf="!service.isLoadingTeam()">
        
        <!-- ROW 1: 4 TOP KPI CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- KPI 1: Integrantes Ativos -->
          <div class="bg-gradient-to-br from-indigo-50 to-indigo-100/60 p-4 rounded-2xl border border-indigo-200 shadow-2xs">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>👥</span> Integrantes no Período
              </span>
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900">
                Ativos
              </span>
            </div>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-3xl font-black text-indigo-950">
                {{ report()?.totalMembers || 0 }}
              </span>
              <span class="text-xs font-bold text-indigo-800">colaboradores</span>
            </div>
            <p class="text-[10px] text-indigo-800/80 font-medium mt-3.5">
              Colaboradores com esforço apontado no período selecionado.
            </p>
          </div>

          <!-- KPI 2: Horas em Novos Projetos -->
          <div class="bg-gradient-to-br from-blue-50 to-blue-100/60 p-4 rounded-2xl border border-blue-200 shadow-2xs">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🚀</span> Novos Projetos
              </span>
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                {{ 100 - (report()?.maintenanceRatio || 0) }}% capacidade
              </span>
            </div>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-3xl font-black text-blue-950">
                {{ formatHours(report()?.totalNewProjectHours) }}
              </span>
              <span class="text-xs font-bold text-blue-800">horas</span>
            </div>
            <div class="mt-3">
              <div class="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                <div class="bg-blue-600 h-1.5 rounded-full transition-all" [style.width.%]="100 - (report()?.maintenanceRatio || 0)"></div>
              </div>
              <p class="text-[10px] text-blue-800/80 font-medium mt-1">
                Dedicação voltada a desenvolvimento e novas entregas.
              </p>
            </div>
          </div>

          <!-- KPI 3: Horas em Sustentação -->
          <div class="bg-gradient-to-br from-purple-50 to-purple-100/60 p-4 rounded-2xl border border-purple-200 shadow-2xs">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🛠️</span> Sustentação
              </span>
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                {{ report()?.maintenanceRatio || 0 }}% capacidade
              </span>
            </div>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-3xl font-black text-purple-950">
                {{ formatHours(report()?.totalMaintenanceHours) }}
              </span>
              <span class="text-xs font-bold text-purple-800">horas</span>
            </div>
            <div class="mt-3">
              <div class="w-full bg-purple-200 rounded-full h-1.5 overflow-hidden">
                <div class="bg-purple-600 h-1.5 rounded-full transition-all" [style.width.%]="report()?.maintenanceRatio || 0"></div>
              </div>
              <p class="text-[10px] text-purple-800/80 font-medium mt-1">
                Apoio operacional, correção de bugs e manutenção de sistemas.
              </p>
            </div>
          </div>

          <!-- KPI 4: Capacidade Total Executada -->
          <div class="bg-gradient-to-br from-slate-50 to-slate-100/80 p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>⏱️</span> Capacidade Total
              </span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {{ report()?.coveredProjectsCount || 0 }} projetos
              </span>
            </div>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-3xl font-black text-slate-900">
                {{ formatHours(report()?.totalCompanyHours) }}
              </span>
              <span class="text-xs font-bold text-slate-600">horas</span>
            </div>
            <p class="text-[10px] text-slate-500 font-medium mt-3.5">
              Média de <strong>{{ getAverageHoursPerMember() }}h</strong> por colaborador no período.
            </p>
          </div>

        </div>

        <!-- ROW 2: FILTERS & VIEW MODE SWITCHER BAR -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <!-- View Switcher: Colaborador vs Projeto -->
          <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              (click)="viewMode.set('members')"
              [ngClass]="viewMode() === 'members' ? 'bg-white text-indigo-700 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 font-semibold'"
              class="px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5">
              <span>👤</span> Visão por Colaborador
            </button>
            <button
              type="button"
              (click)="viewMode.set('projects')"
              [ngClass]="viewMode() === 'projects' ? 'bg-white text-indigo-700 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 font-semibold'"
              class="px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5">
              <span>📂</span> Visão por Projeto
            </button>
          </div>

          <!-- Secondary Filters (Search & Profile Filter) -->
          <div class="flex flex-wrap items-center gap-2.5">
            
            <!-- Dedication Profile Filter -->
            <select
              [(ngModel)]="profileFilter"
              class="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 outline-none cursor-pointer">
              <option value="all">Todos os Perfis de Atuação</option>
              <option value="new_only">🚀 Apenas Novos Projetos (100%)</option>
              <option value="maint_only">🛠️ Apenas Sustentação (100%)</option>
              <option value="mixed">⚖️ Misto (Novos + Sustentação)</option>
            </select>

            <!-- Search Input -->
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Buscar colaborador..."
                class="text-xs bg-slate-50 border border-slate-300 rounded-xl pl-7 pr-3 py-1.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500 w-48">
              <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            </div>

            <!-- Sort Selector -->
            <select
              [(ngModel)]="sortMode"
              class="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 outline-none cursor-pointer">
              <option value="hours">Mais Horas Totais</option>
              <option value="maint_desc">Maior % Sustentação</option>
              <option value="new_desc">Maior % Novos Projetos</option>
              <option value="name">Nome (A-Z)</option>
            </select>

          </div>

        </div>

        <!-- VIEW 1: GRID DE COLABORADORES (MEMBERS VIEW) -->
        <div *ngIf="viewMode() === 'members'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div
            *ngFor="let member of filteredMembers()"
            class="p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 bg-white hover:shadow-md transition flex flex-col justify-between">
            
            <div>
              <!-- Top bar: Avatar, Name, Role & Dedication Pill -->
              <div class="flex items-start justify-between gap-2 mb-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0"
                    [ngClass]="member.avatarColor || 'bg-indigo-600'">
                    {{ getInitials(member.name) }}
                  </div>
                  <div class="min-w-0">
                    <h4 class="text-sm font-black text-slate-900 truncate leading-snug" [title]="member.name">
                      {{ member.name }}
                    </h4>
                    <span class="text-[11px] text-slate-500 font-semibold block truncate" [title]="member.role">
                      {{ member.role }}
                    </span>
                  </div>
                </div>

                <!-- Dedication Profile Badge -->
                <span
                  class="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 border"
                  [ngClass]="getMemberBadgeClass(member.maintenancePercent)">
                  {{ getMemberBadgeLabel(member.maintenancePercent) }}
                </span>
              </div>

              <!-- Bicolor Horizontal Bar: Blue (New) vs Purple (Maintenance) -->
              <div class="mb-3.5">
                <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex shadow-2xs">
                  <!-- Blue segment (Novos) -->
                  <div
                    class="bg-blue-600 h-full transition-all"
                    [style.width.%]="100 - member.maintenancePercent"
                    [title]="'Novos Projetos: ' + formatHours(member.newProjectHours) + 'h (' + (100 - member.maintenancePercent) + '%)'">
                  </div>
                  <!-- Purple segment (Sustentação) -->
                  <div
                    class="bg-purple-600 h-full transition-all"
                    [style.width.%]="member.maintenancePercent"
                    [title]="'Sustentação: ' + formatHours(member.maintenanceHours) + 'h (' + member.maintenancePercent + '%)'">
                  </div>
                </div>

                <!-- Numeric breakdown row -->
                <div class="flex items-center justify-between text-[11px] font-bold mt-1.5 text-slate-600">
                  <span class="flex items-center gap-1 text-blue-700">
                    <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                    Novos: <strong>{{ formatHours(member.newProjectHours) }}h</strong> ({{ 100 - member.maintenancePercent }}%)
                  </span>
                  <span class="flex items-center gap-1 text-purple-700">
                    <span class="w-2 h-2 rounded-full bg-purple-600"></span>
                    Sustentação: <strong>{{ formatHours(member.maintenanceHours) }}h</strong> ({{ member.maintenancePercent }}%)
                  </span>
                </div>
              </div>

              <!-- Allocated Projects List -->
              <div class="pt-3 border-t border-slate-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Projetos Alocados & Horas:
                  </span>
                  <span class="text-[10px] font-bold text-slate-500">
                    Total: <strong class="text-slate-900">{{ formatHours(member.totalHours) }}h</strong>
                  </span>
                </div>

                <!-- Projects list -->
                <div class="space-y-1.5">
                  <div
                    *ngFor="let p of member.projects?.slice(0, 4)"
                    class="p-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[10px] gap-2">
                    <div class="min-w-0 flex items-center gap-1.5">
                      <span *ngIf="p.category === 'maintenance'" class="text-purple-600 font-bold shrink-0">🛠️</span>
                      <span *ngIf="p.category !== 'maintenance'" class="text-blue-600 font-bold shrink-0">🚀</span>
                      <span class="font-bold text-slate-800 truncate" [title]="p.projectName">
                        {{ p.projectName }}
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <span class="text-[9px] font-semibold text-slate-500">
                        {{ p.client }}
                      </span>
                      <span class="font-black px-1.5 py-0.2 rounded border"
                        [ngClass]="p.category === 'maintenance' ? 'bg-purple-100 text-purple-900 border-purple-200' : 'bg-blue-100 text-blue-900 border-blue-200'">
                        {{ formatHours(p.hours) }}h
                      </span>
                    </div>
                  </div>

                  <div *ngIf="member.projects && member.projects.length > 4" class="text-[9px] text-slate-400 italic text-right">
                    +{{ member.projects.length - 4 }} outros projetos
                  </div>

                  <div *ngIf="!member.projects || member.projects.length === 0" class="p-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-[10px] text-slate-400 italic">
                    Sem apontamentos registrados neste período.
                  </div>
                </div>
              </div>

              <!-- Tasks List in Period Grouped by Project -->
              <div class="pt-3 border-t border-slate-100 mt-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <span>📋</span> Tasks por Projeto:
                  </span>
                  <span class="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {{ member.tasks?.length || 0 }} {{ (member.tasks?.length || 0) === 1 ? 'task' : 'tasks' }}
                  </span>
                </div>

                <!-- Grouped Project Tasks Container -->
                <div class="space-y-2.5" [ngClass]="{'max-h-[420px] overflow-y-auto pr-1': isMemberExpanded(member.name)}">
                  <div
                    *ngFor="let group of getMemberTaskGroups(member, !isMemberExpanded(member.name))"
                    class="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
                    
                    <!-- Project Group Header -->
                    <div class="px-2.5 py-1.5 bg-slate-100/80 border-b border-slate-200/70 flex items-center justify-between gap-2 text-[10px]">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span *ngIf="group.category === 'maintenance'" class="text-purple-600 font-bold shrink-0">🛠️</span>
                        <span *ngIf="group.category !== 'maintenance'" class="text-blue-600 font-bold shrink-0">🚀</span>
                        <span class="font-extrabold text-slate-900 truncate" [title]="group.projectName">
                          {{ group.projectName }}
                        </span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0">
                        <span *ngIf="group.client" class="text-[9px] text-slate-400 font-medium hidden sm:inline truncate max-w-[80px]">
                          {{ group.client }}
                        </span>
                        <span class="text-[9px] font-black px-1.5 py-0.2 rounded border bg-white text-slate-800 border-slate-200">
                          {{ formatHours(group.totalHours) }}h
                        </span>
                      </div>
                    </div>

                    <!-- Tasks in this Project -->
                    <div class="p-1.5 space-y-1.5 bg-slate-50/50">
                      <div
                        *ngFor="let t of group.tasks"
                        class="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/70 flex flex-col gap-1 text-[11px] transition shadow-2xs">
                        
                        <!-- Top line: ID/type badge + title + hours -->
                        <div class="flex items-start justify-between gap-1.5">
                          <div class="min-w-0 flex items-center gap-1.5">
                            <span *ngIf="t.type === 'Bug'" class="text-[9px] px-1.5 py-0.2 bg-rose-100 text-rose-800 font-black rounded shrink-0">Bug</span>
                            <span *ngIf="t.type !== 'Bug' && t.id" class="text-[9px] px-1.5 py-0.2 bg-slate-200 text-slate-700 font-bold rounded shrink-0">#{{ t.id }}</span>
                            <span class="font-bold text-slate-800 truncate" [title]="t.title">
                              {{ t.title }}
                            </span>
                          </div>
                          <span class="font-black text-slate-900 shrink-0 ml-1 text-[10px] bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                            {{ formatHours(t.hours) }}h
                          </span>
                        </div>

                        <!-- Bottom line: type + state badge -->
                        <div class="flex items-center justify-between text-[9px] text-slate-400">
                          <span class="text-[9px] text-slate-500 font-medium">
                            {{ t.type || 'Task' }}
                          </span>
                          <span class="px-1.5 py-0.2 rounded font-semibold shrink-0"
                            [ngClass]="t.state === 'Closed' || t.state === 'Done' || t.state === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
                            {{ t.state }}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  <!-- Expand/Collapse Button if more than 3 tasks -->
                  <button
                    *ngIf="member.tasks && member.tasks.length > 3"
                    type="button"
                    (click)="toggleMemberTasks(member.name)"
                    class="w-full py-1.5 text-center text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/50 hover:bg-indigo-100/70 rounded-xl transition cursor-pointer border border-indigo-100">
                    {{ isMemberExpanded(member.name) ? '▲ Recolher tarefas' : '▼ Ver todas as ' + member.tasks.length + ' tarefas (' + getMemberTaskGroups(member).length + ' projetos)' }}
                  </button>

                  <div *ngIf="!member.tasks || member.tasks.length === 0" class="p-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-[10px] text-slate-400 italic">
                    Nenhuma task detalhada registrada neste período.
                  </div>
                </div>
              </div>

            </div>

            <!-- Footer: Tasks Count & Projects Count -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 mt-3">
              <span>{{ member.tasksCount }} tarefas registradas</span>
              <span class="font-medium text-slate-500">{{ member.projects?.length || 0 }} projeto(s) com apontamento</span>
            </div>

          </div>

          <!-- Empty search state -->
          <div *ngIf="filteredMembers().length === 0" class="col-span-full py-12 text-center text-xs text-slate-400 italic bg-white rounded-2xl border border-slate-200">
            Nenhum colaborador encontrado com os filtros selecionados.
          </div>

        </div>

        <!-- VIEW 2: GRID POR PROJETO (PROJECTS VIEW) -->
        <div *ngIf="viewMode() === 'projects'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div
            *ngFor="let proj of filteredProjectsBreakdown()"
            class="p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 bg-white hover:shadow-md transition flex flex-col justify-between">
            
            <div>
              <!-- Top bar with Client, Project Name and Category -->
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="text-[10px] font-black px-2 py-0.5 rounded-md border"
                  [ngClass]="proj.category === 'maintenance' ? 'bg-purple-100 text-purple-900 border-purple-200' : 'bg-blue-100 text-blue-900 border-blue-200'">
                  {{ proj.client }}
                </span>
                <span class="text-[10px] font-black px-2 py-0.5 rounded-full"
                  [ngClass]="proj.category === 'maintenance' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'">
                  {{ proj.category === 'maintenance' ? '🛠️ Sustentação' : '🚀 Novo Projeto' }}
                </span>
              </div>

              <h4 class="text-sm font-black text-slate-900 leading-snug mb-1">
                {{ proj.name }}
              </h4>

              <div class="flex items-center justify-between text-xs text-slate-500 font-medium mb-3">
                <span *ngIf="proj.leader">Líder: <strong class="text-slate-800">{{ proj.leader }}</strong></span>
                <span *ngIf="!proj.leader">Equipe ILC</span>
                <span class="font-black text-slate-900">{{ formatHours(proj.totalHours) }}h totais</span>
              </div>

              <!-- Team members allocated list -->
              <div class="pt-2.5 border-t border-slate-100 space-y-1.5">
                <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                  Equipe Alocada ({{ proj.teamMembers?.length || 0 }}):
                </span>

                <div *ngFor="let tm of proj.teamMembers" class="p-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[10px]">
                  <div class="min-w-0 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    <span class="font-bold text-slate-800 truncate">{{ tm.name }}</span>
                    <span class="text-[9px] text-slate-400 truncate">({{ tm.role }})</span>
                  </div>
                  <span class="font-black text-slate-700 shrink-0 ml-1">
                    {{ formatHours(tm.hours) }}h
                  </span>
                </div>

                <div *ngIf="!proj.teamMembers || proj.teamMembers.length === 0" class="text-[10px] text-slate-400 italic py-1 text-center">
                  Nenhum colaborador com horas registradas neste período.
                </div>
              </div>

            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
              <span class="text-[10px] text-slate-400">{{ proj.teamMembersCount }} integrantes vinculados</span>
              <button
                type="button"
                (click)="service.openEapForProject(proj.id)"
                class="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer">
                Ver EAP →
              </button>
            </div>

          </div>

        </div>

      </ng-container>

    </div>
  `
})
export class TeamAllocationComponent implements OnInit {
  service = inject(ProjectService);

  viewMode = signal<'members' | 'projects'>('members');
  profileFilter = 'all'; // 'all' | 'new_only' | 'maint_only' | 'mixed'
  searchQuery = '';
  sortMode = 'hours';
  expandedMembers = signal<Set<string>>(new Set());

  report = computed(() => this.service.teamAllocationReport());

  ngOnInit() {
    this.refreshData();
  }

  toggleMemberTasks(memberName: string) {
    const next = new Set(this.expandedMembers());
    if (next.has(memberName)) {
      next.delete(memberName);
    } else {
      next.add(memberName);
    }
    this.expandedMembers.set(next);
  }

  isMemberExpanded(memberName: string): boolean {
    return this.expandedMembers().has(memberName);
  }

  getMemberTaskGroups(member: TeamMemberAllocation, limit = false): MemberProjectTasksGroup[] {
    if (!member.tasks || member.tasks.length === 0) return [];

    const map = new Map<string, MemberProjectTasksGroup>();

    for (const t of member.tasks) {
      const pName = t.projectName || 'Outros Projetos';
      if (!map.has(pName)) {
        const projShare = (member.projects || []).find(p => p.projectName === pName || p.projectId === t.projectId);
        map.set(pName, {
          projectId: t.projectId || projShare?.projectId,
          projectName: pName,
          client: t.client || projShare?.client || '',
          category: t.category || projShare?.category || 'new_project',
          totalHours: 0,
          tasks: []
        });
      }
      const g = map.get(pName)!;
      g.tasks.push(t);
      g.totalHours = Math.round((g.totalHours + (t.hours || 0)) * 10) / 10;
    }

    const groups = Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);

    if (!limit) return groups;

    // In collapsed preview mode, show top projects and up to 2 tasks per project (up to 3 total tasks)
    let remainingBudget = 3;
    const previewGroups: MemberProjectTasksGroup[] = [];

    for (const g of groups) {
      if (remainingBudget <= 0) break;
      const countForThisGroup = Math.min(2, remainingBudget, g.tasks.length);
      previewGroups.push({
        ...g,
        tasks: g.tasks.slice(0, countForThisGroup)
      });
      remainingBudget -= countForThisGroup;
    }

    return previewGroups;
  }

  async refreshData() {
    const client = this.service.isClientPortalMode() ? this.service.selectedClient() : 'Todos';
    await this.service.loadTeamAllocation(
      client,
      this.service.selectedTeamPeriod()
    );
  }

  onPeriodChange(p: MaintenancePeriod) {
    this.service.selectedTeamPeriod.set(p);
    this.refreshData();
  }

  formatHours(val?: number | null): string {
    return this.service.formatHours(val);
  }

  getAverageHoursPerMember(): string {
    const rep = this.report();
    if (!rep || rep.totalMembers === 0) return '0';
    const avg = rep.totalCompanyHours / rep.totalMembers;
    return this.formatHours(avg);
  }

  getInitials(name: string): string {
    if (!name) return 'IL';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getMemberBadgeClass(percent: number): string {
    if (percent === 100) return 'bg-purple-100 text-purple-900 border-purple-200';
    if (percent === 0) return 'bg-blue-100 text-blue-900 border-blue-200';
    return 'bg-indigo-50 text-indigo-900 border-indigo-200';
  }

  getMemberBadgeLabel(percent: number): string {
    if (percent === 100) return '100% Sustentação';
    if (percent === 0) return '100% Novos Projetos';
    return `Misto (${percent}% Sust.)`;
  }

  filteredMembers = computed<TeamMemberAllocation[]>(() => {
    const list = this.report()?.members || [];
    const query = this.searchQuery.toLowerCase().trim();
    const profile = this.profileFilter;
    const sort = this.sortMode;

    let result = list;

    // Filter by query (name, role, allocated project or task title/ID)
    if (query) {
      result = result.filter(m =>
        m.name.toLowerCase().includes(query) ||
        (m.role || '').toLowerCase().includes(query) ||
        (m.allocatedProjects || []).some(ap => ap.toLowerCase().includes(query)) ||
        (m.tasks || []).some(t => t.title.toLowerCase().includes(query) || String(t.id).includes(query) || (t.projectName || '').toLowerCase().includes(query))
      );
    }

    // Filter by dedication profile
    if (profile === 'new_only') {
      result = result.filter(m => m.maintenancePercent === 0);
    } else if (profile === 'maint_only') {
      result = result.filter(m => m.maintenancePercent === 100);
    } else if (profile === 'mixed') {
      result = result.filter(m => m.maintenancePercent > 0 && m.maintenancePercent < 100);
    }

    // Sort
    return result.slice().sort((a, b) => {
      if (sort === 'hours') return b.totalHours - a.totalHours;
      if (sort === 'maint_desc') return b.maintenancePercent - a.maintenancePercent;
      if (sort === 'new_desc') return a.maintenancePercent - b.maintenancePercent;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  });

  filteredProjectsBreakdown = computed<ProjectTeamAllocation[]>(() => {
    const list = this.report()?.projects || [];
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return list;

    return list.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.client.toLowerCase().includes(query) ||
      (p.teamMembers || []).some(m => m.name.toLowerCase().includes(query))
    );
  });
}
