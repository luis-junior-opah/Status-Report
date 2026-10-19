import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-kpi-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      <!-- Total -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition">
        <div class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Visível</div>
        <div class="mt-1.5 flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-slate-900 tracking-tight">{{ service.stats()?.total || 0 }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">Projetos</span>
        </div>
      </div>

      <!-- Ativos -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-blue-300 transition">
        <div class="text-xs font-medium text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Ativos
        </div>
        <div class="mt-1.5 flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-blue-700 tracking-tight">{{ service.stats()?.active || 0 }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">Em curso</span>
        </div>
      </div>

      <!-- No Prazo -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
        <div class="text-xs font-medium text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          No Prazo
        </div>
        <div class="mt-1.5 flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-emerald-700 tracking-tight">{{ service.stats()?.onTrack || 0 }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">Saudável</span>
        </div>
      </div>

      <!-- Em Atenção / Risco -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-amber-300 transition">
        <div class="text-xs font-medium text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          Em Atenção
        </div>
        <div class="mt-1.5 flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-amber-700 tracking-tight">{{ service.stats()?.warning || 0 }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Margem curta</span>
        </div>
      </div>

      <!-- Atrasados / Desvio -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-rose-300 transition">
        <div class="text-xs font-medium text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          Com Desvio
        </div>
        <div class="mt-1.5 flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-rose-700 tracking-tight">{{ service.stats()?.delayed || 0 }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold">Atraso</span>
        </div>
      </div>

      <!-- Finalizados / Congelados -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition">
        <div class="text-xs font-medium text-slate-500 uppercase tracking-wider">Concluídos / Congelados</div>
        <div class="mt-1.5 flex items-baseline justify-between">
          <div class="text-xl font-extrabold text-slate-800 tracking-tight">
            {{ service.stats()?.completed || 0 }} <span class="text-xs text-slate-400 font-normal">/</span> {{ service.stats()?.frozen || 0 }}
          </div>
          <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">Histórico</span>
        </div>
      </div>
    </section>
  `
})
export class KpiSummaryComponent {
  service = inject(ProjectService);
}
