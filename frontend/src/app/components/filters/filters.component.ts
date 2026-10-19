import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm mb-6 space-y-3">
      <!-- Top Row: Status Tabs & Search -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Status Tabs -->
        <div class="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          <button
            *ngFor="let s of ['Todos', 'Ativo', 'Finalizado', 'Congelado']"
            (click)="service.selectedStatus.set(s)"
            [ngClass]="service.selectedStatus() === s ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
            <span>{{ s === 'Ativo' ? 'Ativos' : (s === 'Finalizado' ? 'Finalizados' : (s === 'Congelado' ? 'Congelados' : s)) }}</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full"
              [ngClass]="service.selectedStatus() === s ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'">
              {{ getCountByStatus(s) }}
            </span>
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative w-full sm:w-72">
          <input
            type="text"
            [ngModel]="service.searchQuery()"
            (ngModelChange)="service.searchQuery.set($event)"
            placeholder="Buscar por projeto, líder, sistema..."
            class="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 font-medium">
          <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <button
            *ngIf="service.searchQuery()"
            (click)="service.searchQuery.set('')"
            class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
            ×
          </button>
        </div>
      </div>

      <!-- Bottom Row: Filters (Cliente, Prioridade, Sistema, Ordenação) -->
      <div class="flex items-center flex-wrap gap-2.5 pt-2 border-t border-slate-100 text-xs">
        
        <!-- Client Filter Dropdown -->
        <div *ngIf="!service.isClientPortalMode()" class="flex items-center space-x-1.5">
          <label class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Cliente:</label>
          <select
            [ngModel]="service.selectedClient()"
            (ngModelChange)="service.selectedClient.set($event)"
            class="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer">
            <option value="Todos">Todos os Clientes</option>
            <option *ngFor="let c of service.clients()" [value]="c.name">
              {{ c.name }} ({{ getCountByClient(c.name) }})
            </option>
          </select>
        </div>

        <div *ngIf="service.isClientPortalMode()" class="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
          <span>🏢</span>
          <span>Parceiro: {{ service.selectedClient() }}</span>
        </div>

        <!-- Priority Filter Dropdown -->
        <div class="flex items-center space-x-1.5">
          <label class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Prioridade:</label>
          <select
            [ngModel]="service.selectedPriority()"
            (ngModelChange)="service.selectedPriority.set($event)"
            class="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer">
            <option value="Todos">Todas as Prioridades</option>
            <option value="P1">🚨 P1 - Crítica ({{ getCountByPriority('P1') }})</option>
            <option value="P2">⚡ P2 - Alta ({{ getCountByPriority('P2') }})</option>
            <option value="P3">🔷 P3 - Média ({{ getCountByPriority('P3') }})</option>
            <option value="P4">⚪ P4 - Baixa ({{ getCountByPriority('P4') }})</option>
          </select>
        </div>

        <!-- System Filter Dropdown -->
        <div class="flex items-center space-x-1.5">
          <label class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Sistema:</label>
          <select
            [ngModel]="service.selectedSystem()"
            (ngModelChange)="service.selectedSystem.set($event)"
            class="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer">
            <option value="Todos">Todos os Sistemas</option>
            <option value="Portal Integrator">🌐 Portal Integrator</option>
            <option value="App Smart Tracking">📱 App Smart Tracking</option>
            <option value="Smart X">📋 Smart X</option>
            <option value="App ILC">🚚 App ILC</option>
          </select>
        </div>

        <!-- Sort By Dropdown -->
        <div class="flex items-center space-x-1.5">
          <label class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Ordenar por:</label>
          <select
            [ngModel]="service.sortBy()"
            (ngModelChange)="service.sortBy.set($event)"
            class="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer">
            <option value="client">Cliente (A-Z)</option>
            <option value="priority">Prioridade (P1 → P4)</option>
            <option value="progress">Maior Progresso</option>
          </select>
        </div>

        <!-- Clear filters button if any active -->
        <button
          *ngIf="hasActiveFilters()"
          (click)="clearFilters()"
          class="ml-auto text-[11px] text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-1 cursor-pointer">
          <span>✕ Limpar Filtros</span>
        </button>

      </div>
    </div>
  `
})
export class FiltersComponent {
  service = inject(ProjectService);

  getCountByStatus(status: string) {
    const list = this.service.projects();
    if (status === 'Todos') return list.length;
    return list.filter(p => p.status === status).length;
  }

  getCountByClient(client: string) {
    return this.service.projects().filter(p => p.client === client).length;
  }

  getCountByPriority(priority: string) {
    return this.service.projects().filter(p => (p.priority || 'P2') === priority).length;
  }

  hasActiveFilters(): boolean {
    return this.service.selectedClient() !== 'Todos' ||
      this.service.selectedPriority() !== 'Todos' ||
      this.service.selectedSystem() !== 'Todos' ||
      this.service.selectedStatus() !== 'Todos' ||
      this.service.sortBy() !== 'client' ||
      !!this.service.searchQuery();
  }

  clearFilters(): void {
    this.service.selectedClient.set('Todos');
    this.service.selectedPriority.set('Todos');
    this.service.selectedSystem.set('Todos');
    this.service.selectedStatus.set('Todos');
    this.service.sortBy.set('client');
    this.service.searchQuery.set('');
  }
}
