# Design System Oficial — Painel Executivo de Projetos ILC

> **Propósito deste Documento:** Este guia de Design System foi estruturado especificamente para servir como **referência técnica e visual definitiva (Contexto / System Prompt / `CLAUDE.md`)** para agentes de IA (como Claude) e desenvolvedores ao criar, refatorar ou expandir interfaces neste projeto.

---

## 1. Identidade Visual & Filosofia de Design

- **Produto:** Dashboard Gerencial de Projetos | Visão Executiva (**ILC - Integrator Logistics Company**).
- **Arquitetura de UI:** B2B Enterprise SaaS / Executive Portfolio Management, integrado ao **Azure DevOps**.
- **Estética Principal:**
  - **Alta Densidade Informacional com Clareza Executiva:** Uso estratégico de micro-tipografia (`9px` a `12px`), badges semânticos com bordas sutis, divisores leves (`slate-100`/`slate-200`) e agrupamento visual em cartões arredondados (`rounded-2xl` e `rounded-3xl`).
  - **Contraste de Governança (Dark Chrome + Light Canvas):** O cabeçalho global (`<app-header>`), os cabeçalhos de réguas temporais/percentuais (Gantt e Portfólio Macro) e os Hero Banners executivos utilizam fundo escuro profundo (`bg-slate-900` / `#0f172a`), enquanto o plano de fundo da aplicação é claro (`bg-slate-50` / `#f8fafc`) com superfícies de conteúdo em branco puro (`bg-white` / `#ffffff`).
  - **Co-Branding Dinâmico:** Suporte nativo à exibição simultânea da marca **ILC** e do logotipo do cliente parceiro (Mirassol, John Deere, Petrobras, Boge Ruber, etc.) em molduras padronizadas.
  - **Modo Apresentação (Boardroom Dark Mode):** A visão de *Status Report Executivo da Diretoria* possui alternância para tela cheia em tema escuro (`bg-slate-950` com cartões `bg-slate-900` e bordas `border-slate-800`) e suporte nativo para exportação/impressão (`print:`).

---

## 2. Stack Tecnológica de Estilização

- **Framework Frontend:** Angular (Standalone Components, Signals, `@angular/common`, `@angular/forms`).
- **CSS Framework:** **Tailwind CSS** (carregado via CDN em `src/index.html`, com suporte a classes utilitárias modernas como `shadow-2xs`, `shadow-xs`, `backdrop-blur-xs`, opacidades de cor `/80`, `/90` e valores arbitrários `text-[10px]`, `w-[420px]`).
- **Fonte Oficial:** **Plus Jakarta Sans** (Google Fonts) — pesos `300`, `400`, `500`, `600`, `700`, `800` (e `font-black` `900`).
- **Ícones:**
  - **Heroicons Outline (SVG inline):** `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`. Tamanhos típicos: `w-3.5 h-3.5` ou `w-4 h-4`.
  - **Emojis Semânticos Executivos:** Usados pontualmente como âncoras visuais rápidas (`🎯` Prioridade, `👤` Líder, `👥` Equipe, `📋` Extrato/EAP, `🚨` Crítico, `⚠️` Alerta, `🔒` Bloqueio/Acesso, `📍` Hoje, `📊` Status Report).

### Configuração Base do Tailwind (`src/index.html`)

```javascript
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1d4ed8',
          600: '#1e40af',
          700: '#1e3a8a',
          900: '#0f172a'
        }
      }
    }
  }
}
```

**Classes Globais do `<body>`:**
```html
<body class="bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
```

---

## 3. Tipografia & Escala Hierárquica

A interface privilegia alta densidade para caber múltiplas colunas, cronogramas e indicadores sem quebras de layout. **Raramente se usa texto maior que `text-base`**, exceto em números de KPIs e títulos principais de projeto no Gantt.

| Nível / Papel | Classes Tailwind | Tamanho / Peso | Uso Principal |
| :--- | :--- | :--- | :--- |
| **Display KPI / Horas** | `text-3xl font-black tracking-tight leading-none` | `30px` / `900` | Grande totalizador de horas (`totalExecuted / totalPlanned`) |
| **KPI Number / Título Gantt** | `text-2xl font-extrabold` ou `font-black tracking-tight` | `24px` / `800-900` | Números dos 6 cards de KPI do topo; Nome do projeto no cabeçalho da EAP |
| **Sub-KPI / Pulse Metric** | `text-xl font-black` ou `font-extrabold tracking-tight` | `20px` / `800-900` | Métricas de pulso no Hero Banner do Status Report; KPI Concluídos/Congelados |
| **Section / Card Title** | `text-base font-bold` ou `font-extrabold tracking-tight leading-snug` | `16px` / `700-800` | Títulos de seções principais (`Home`), títulos de Cards de Projeto, cabeçalhos de Modais |
| **Table / Block Header** | `text-sm font-bold` ou `font-extrabold` | `14px` / `700-800` | Cabeçalho da Tabela Consolidada, subtítulos de modais |
| **Body / UI Standard** | `text-xs font-medium` / `font-semibold` / `font-bold` | `12px` / `400-700` | **Tamanho padrão de toda a aplicação**: tabelas, botões, inputs, descrições, resumos |
| **Dense Table / Meta** | `text-[11px] font-semibold` ou `font-bold` | `11px` / `600-700` | Cabeçalhos `<thead>` (`uppercase tracking-wider`), filtros, células densas |
| **Micro Labels / Pills** | `text-[10px] font-bold uppercase tracking-wider` | `10px` / `700-800` | Rótulos de campos ("FASE DA EAP", "DATAS ACORDADAS"), badges de status e marcos |
| **Nano Chips / Badges** | `text-[9px] font-black` ou `font-bold` | `9px` / `700-900` | Pílulas compactas de Prioridade (`P1`-`P4`), chips de Sistemas em tabelas e contadores |
| **IDs Técnicos Azure** | `font-mono text-xs` ou `text-[10px] font-bold` | `10-12px` / `700` | IDs de Work Items do Azure DevOps (`#1234`) |

---

## 4. Sistema de Cores & Tokens Semânticos

### 4.1. Superfícies, Fundos e Bordas (`Slate`)

| Elemento | Modo Padrão (Light Executive) | Modo Apresentação (Dark Boardroom) |
| :--- | :--- | :--- |
| **Fundo da Página (Canvas)** | `bg-slate-50` (`#f8fafc`) | `bg-slate-950` (`#020617`) |
| **Superfície Primária (Cards/Containers)** | `bg-white` (`#ffffff`) | `bg-slate-900` (`#0f172a`) |
| **Superfície Secundária (Sub-boxes/Headers)** | `bg-slate-50/60`, `bg-slate-50/80`, `bg-slate-100/80` | `bg-slate-950`, `bg-slate-800/90` |
| **Barras Superiores / Réguas (Header/Gantt)** | `bg-slate-900 text-white` (`#0f172a`) | `bg-slate-900/90 text-white` |
| **Borda de Card Principal** | `border border-slate-200/90` (`#e2e8f0`) | `border border-slate-800` (`#1e293b`) |
| **Borda Interna / Divisores** | `border-slate-100` / `divide-y divide-slate-100` | `border-slate-800` / `divide-y divide-slate-800` |
| **Borda de Inputs / Selects** | `border border-slate-300` (`#cbd5e1`) | `border border-slate-700` (`#334155`) |
| **Texto Primário** | `text-slate-900` (`#0f172a`) / `text-slate-800` | `text-white` / `text-slate-100` |
| **Texto Secundário** | `text-slate-600` / `text-slate-500` | `text-slate-300` / `text-slate-400` |
| **Texto Muted / Placeholders** | `text-slate-400` (`#94a3b8`) | `text-slate-500` |

### 4.2. Cores de Ação e Destaque Institucional (`Blue` & `Indigo`)

- **Ação Primária / Aba Ativa / Barra de Progresso Padrão:**
  - `bg-blue-600 hover:bg-blue-700 text-white` (`#2563eb` → `#1d4ed8`)
  - Focus ring padrão em formulários: `focus:outline-none focus:ring-2 focus:ring-blue-500`
- **Destaque Executivo / Botão Curadoria:**
  - Gradiente: `bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/20`
- **Ações de Auditoria Azure / Links Secundários:**
  - Botão secundário Indigo: `bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200`
  - Botão secundário Blue: `bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200`
- **Callout de Status Report da Semana:**
  - Fundo: `bg-blue-50/60` ou `bg-blue-50/70`
  - Borda: `border border-blue-100/80` ou `border-blue-200/80`
  - Título: `text-blue-900` com ícone `text-blue-600`

### 4.3. Farol de Saúde — RAG Status (`Green`, `Amber`, `Red`)

Utilizado consistentemente em KPIs, barras de progresso da Visão Macro, pílulas de saúde e alertas:

| Estado RAG | Significado | Badge / Pill (`px-2 py-0.5 rounded-full`) | Barra de Progresso / Dot |
| :--- | :--- | :--- | :--- |
| **`green`** | **No Prazo / Saudável** | `bg-emerald-100 text-emerald-800 border border-emerald-200` | `bg-emerald-500` (Ativo) / `bg-emerald-600` (Finalizado) |
| **`amber`** | **Em Atenção / Margem Curta** | `bg-amber-100 text-amber-800 border border-amber-200` | `bg-amber-500` |
| **`red`** | **Com Desvio / Crítico / Atrasado** | `bg-rose-100 text-rose-800 border border-rose-200` | `bg-rose-500` ou `bg-rose-600` |
| **Congelado** | **Projeto Pausado / Suspenso** | `bg-slate-200 text-slate-700` | `bg-slate-400` ou `bg-slate-500` |

### 4.4. Paleta Estrita de 5 Cores dos Blocos do Gantt EAP (`getCardStyle`)

Nos blocos (cápsulas horizontais) do Cronograma EAP (`<app-eap-gantt>`), **apenas estas 5 combinações** são permitidas:

1. **Concluído (`completed`):**
   ```html
   class="bg-emerald-600 text-white border-emerald-700 shadow-emerald-800/10"
   ```
2. **Em Curso (`in-progress`):**
   ```html
   class="bg-emerald-200 text-emerald-950 border-emerald-400 shadow-emerald-300/10"
   ```
3. **Margem Curta (`isTightMargin` — prazo ≤ 7 dias):**
   ```html
   class="bg-amber-300 text-amber-950 border-amber-500 shadow-amber-400/10 font-medium"
   ```
4. **Atrasado (`isDelayed`):**
   ```html
   class="bg-rose-200 text-rose-950 border-rose-400 shadow-rose-300/10 font-medium"
   ```
5. **Planejado (default / não iniciado):**
   ```html
   class="bg-slate-200 text-slate-700 border-slate-300 shadow-slate-200/10"
   ```

### 4.5. Tokens de Domínio: Prioridades, Fases da EAP, Sistemas e Desvios

#### A. Prioridade do Projeto (`getPriorityBadgeClass`)
| Código | Rótulo | Classes Tailwind |
| :--- | :--- | :--- |
| **`P1`** | 🚨 P1 - Crítica | `bg-rose-100 text-rose-800 border border-rose-300 font-black` |
| **`P2`** | ⚡ P2 - Alta (Default) | `bg-amber-100 text-amber-800 border border-amber-300 font-extrabold` |
| **`P3`** | 🔷 P3 - Média | `bg-blue-100 text-blue-800 border border-blue-300 font-bold` |
| **`P4`** | ⚪ P4 - Baixa | `bg-slate-100 text-slate-700 border border-slate-300 font-medium` |

#### B. As 5 Fases Oficiais da EAP (`getMilestoneBadgeClass`)
| Ordem | Fase da EAP | Subtítulo no Gantt | Classes do Badge |
| :---: | :--- | :--- | :--- |
| **1** | **Planejamento** | Requisitos e Base | `bg-purple-50 text-purple-700 border border-purple-200` |
| **2** | **Desenvolvimento** | Módulos e Backend | `bg-blue-50 text-blue-700 border border-blue-200` |
| **3** | **Homologação** | Testes e Validação | `bg-orange-50 text-orange-700 border border-orange-200` |
| **4** | **Treinamento** | Capacitação | `bg-teal-50 text-teal-700 border border-teal-200` |
| **5** | **Operação Assistida** | Go-Live & Suporte | `bg-emerald-50 text-emerald-700 border border-emerald-200` |
| — | *Fallback / Outros* | — | `bg-slate-100 text-slate-700 border border-slate-200` |

#### C. Sistemas Envolvidos (`getSystemBadgeClass`)
| Sistema | Ícone no Filtro | Classes do Chip |
| :--- | :---: | :--- |
| **Portal Integrator** | 🌐 | `bg-indigo-50 text-indigo-700 border border-indigo-200` |
| **App Smart Tracking** | 📱 | `bg-emerald-50 text-emerald-700 border border-emerald-200` |
| **Smart X** | 📋 | `bg-purple-50 text-purple-700 border border-purple-200` |
| **App ILC** | 🚚 | `bg-cyan-50 text-cyan-700 border border-cyan-200` |
| *Sistemas Adicionais (SAP, etc.)* | 💻 | `bg-slate-100 text-slate-700 border border-slate-200` |

#### D. Pílulas de Desvio de Prazo (`varianceDays`)
- **Desvio Crítico (`> 7` dias):** `bg-rose-100 text-rose-800 border border-rose-200` (Texto em tabela: `text-rose-600`, `+Xd`)
- **Desvio Leve (`1` a `7` dias):** `bg-amber-100 text-amber-800 border border-amber-200`
- **No Prazo (`0` dias):** `bg-emerald-100 text-emerald-800 border border-emerald-200` (Texto em tabela: `text-emerald-600`, `0d`)
- **Adiantado (`< 0` dias):** `bg-cyan-100 text-cyan-800 border border-cyan-200` (Texto em tabela: `text-cyan-600`, `-Xd`)

---

## 5. Geometria, Grid, Espaçamento & Elevação

### 5.1. Estrutura de Layout da Aplicação
- **Shell Principal:** `min-h-screen bg-slate-50 flex flex-col font-sans`
- **Container Central (`<main>`):** `flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6`
- **Espaçamento Vertical entre Seções:** `mb-6` (`24px`) ou `space-y-5` (`20px`).

### 5.2. Escala de Border Radius (Arredondamento)
O projeto utiliza cantos generosamente arredondados que conferem modernidade executiva:
- **`rounded-3xl` (`24px`):** Grandes containers estruturais (Painel da Visão Macro, Container principal do Gantt, Barra de Título do Gantt, Modais de Curadoria/Auditoria/Detalhe).
- **`rounded-2xl` (`16px`):** Cards de Projeto, Cards de KPI, Barra de Filtros, Tabela Consolidada, Sub-blocos de governança e seções de formulário na Curadoria.
- **`rounded-xl` (`12px`):** Botões padrão, Inputs de busca, Selects, Cápsulas de entrega no Gantt, Caixas comparativas internas.
- **`rounded-lg` (`8px`):** Botões internos de seletores (View Switcher), botões de ícone (`w-7 h-7`), inputs compactos de tabela.
- **`rounded-md` (`6px`):** Micro-badges de Prioridade (`P1`-`P4`), chips de Sistemas, indicadores da legenda do Gantt.
- **`rounded-full` (`9999px`):** Pílulas de Status/RAG, contadores numéricos, barras de progresso e marcadores circulares.

### 5.3. Sombras e Efeitos Visuais
- **Cards Padrão:** `shadow-sm` ou `shadow-2xs` combinados com `border border-slate-200/90`.
- **Hover em Cards:** `hover:shadow-md transition` ou `hover:border-slate-300`.
- **Hover em Cápsulas do Gantt:** `transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`.
- **Sombra de Coluna Congelada (Sticky Left no Gantt):**
  - Header escuro: `shadow-[6px_0_16px_rgba(0,0,0,0.22)]`
  - Corpo claro: `bg-slate-50/95 backdrop-blur-xs shadow-[6px_0_16px_rgba(0,0,0,0.06)]`
- **Backdrop de Modais:** `fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4`

---

## 6. Catálogo de Componentes & Padrões de Interface

Abaixo estão os padrões arquiteturais e visuais de cada componente para que o agente Claude possa reproduzi-los com fidelidade 1:1.

### 6.1. Header Executivo Co-Branded (`<app-header>`)
- **Container:** `bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg`
- **Lado Esquerdo:**
  - Logo ILC: `h-9 w-auto object-contain bg-white/5 p-1 rounded-lg border border-slate-700/60`
  - Logo Cliente (quando ativo): `h-9 max-w-[140px] flex items-center bg-white p-1 rounded-lg border border-slate-700/60 shadow-xs`
  - Divisor vertical: `h-6 w-px bg-slate-700/80 block`
  - Botão Sync Azure: `px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700` com ícone SVG azul (`text-blue-400`) que gira (`animate-spin`) durante sincronização.
- **Lado Direito:**
  - **Segmented View Switcher:** Container `bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 flex items-center text-xs font-semibold`.
    - Botão Ativo: `bg-blue-600 text-white shadow-xs px-3 py-1.5 rounded-lg`
    - Botão Inativo: `text-slate-400 hover:text-white px-3 py-1.5 rounded-lg`
  - **Botão Curadoria:** `px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/20`.

### 6.2. Strip de KPIs do Portfólio (`<app-kpi-summary>`)
- **Grid:** `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6`
- **Estrutura de Cada Card:**
  ```html
  <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-blue-300 transition">
    <div class="text-xs font-medium text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
      <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
      Ativos
    </div>
    <div class="mt-1.5 flex items-baseline justify-between">
      <span class="text-2xl font-extrabold text-blue-700 tracking-tight">12</span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">Em curso</span>
    </div>
  </div>
  ```
- **Variações Semânticas dos 6 Cards:**
  1. **Total Visível:** Neutro (`text-slate-500`, valor `text-slate-900`, pill `bg-slate-100 text-slate-600`).
  2. **Ativos:** Azul (`text-blue-600`, dot com `animate-pulse`, valor `text-blue-700`, pill `bg-blue-50 text-blue-600`).
  3. **No Prazo:** Esmeralda (`text-emerald-600`, valor `text-emerald-700`, pill `bg-emerald-50 text-emerald-700`).
  4. **Em Atenção:** Âmbar (`text-amber-600`, valor `text-amber-700`, pill `bg-amber-50 text-amber-700`).
  5. **Com Desvio:** Rose (`text-rose-600`, valor `text-rose-700`, pill `bg-rose-50 text-rose-700`).
  6. **Concluídos / Congelados:** Neutro com barra divisória (`completed / frozen`, valor `text-xl font-extrabold text-slate-800`).

### 6.3. Barra de Filtros & Busca (`<app-filters>`)
- **Container:** `bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm mb-6 space-y-3`
- **Linha Superior:**
  - **Status Tabs (Pills com contador):**
    - Ativo: `bg-slate-900 text-white shadow-sm` (contador interno `bg-white/20 text-white`)
    - Inativo: `bg-slate-100 text-slate-600 hover:bg-slate-200` (contador interno `bg-slate-200 text-slate-700`)
  - **Input de Busca:** `w-full sm:w-72 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500` com lupa à esquerda e botão `×` à direita para limpar.
- **Linha Inferior (`pt-2 border-t border-slate-100`):**
  - Dropdowns compactos (`Cliente`, `Prioridade`, `Sistema`, `Ordenar por`) com label `text-[11px] font-bold text-slate-500` e `<select class="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 font-semibold">`.
  - Botão `✕ Limpar Filtros` alinhado à direita (`ml-auto text-[11px] text-rose-600 hover:text-rose-800 font-extrabold`).

### 6.4. Visão Macro do Portfólio (`<app-portfolio-macro>`)
- **Propósito:** Lista executiva com régua percentual de `0%` a `100%` (sem coluna de horas).
- **Cabeçalho da Régua:** `flex border-b border-slate-200 bg-slate-900 text-white text-xs font-bold py-2.5 px-4 sticky top-0 z-10`.
  - Coluna esquerda fixa em `w-[420px] shrink-0`: Prioridade + Nome do Projeto + Thumbnail do Logo do Cliente (`h-4 max-w-[48px]`) + Badge da Fase EAP + Chips de Sistemas + Líder (`👤`).
  - Eixo central `flex-1`: Grade de fundo com 6 linhas verticais (`w-px h-full bg-slate-100`) marcando `0%`, `20%`, `40%`, `60%`, `80%`, `100%`.
  - Barra de Progresso (`h-6 bg-slate-100 rounded-xl p-0.5`): Preenchimento colorido pelo status RAG (`bg-emerald-500`, `bg-amber-500`, `bg-rose-500`, `bg-slate-400`), exibindo o percentual dentro da barra (`text-white`) se `>= 12%` ou fora (`text-slate-600 ml-2`) se `< 12%`.
  - Coluna direita (`w-12`): Botão de ação chevron `→` (`w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white`).

### 6.5. Cards Executivos de Projeto (`<app-project-cards>`)
- **Grid:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8`
- **Anatomia do Card (`bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md`):**
  1. **Header do Card:** Badge Prioridade + Logo Cliente (`h-5 max-w-[65px]`) + Tag Cliente (`bg-slate-100`) à esquerda; Pílulas de Status e RAG (com bolinha `w-1.5 h-1.5 rounded-full bg-current`) à direita.
  2. **Título & Descrição:** `text-base font-bold text-slate-900` + descrição `text-xs text-slate-500 line-clamp-2`.
  3. **Chips de Sistemas:** Lista flex-wrap de sistemas envolvidos.
  4. **Stepper Visual das 5 Fases da EAP (`grid-cols-5 gap-1`):**
     - Fases concluídas (`idx < current`): `bg-emerald-500 h-1.5 rounded-full`
     - Fase atual (`idx === current`): `bg-blue-600 ring-2 ring-blue-300 h-1.5 rounded-full` (rótulo `font-bold text-blue-700`)
     - Fases futuras (`idx > current`): `bg-slate-200 h-1.5 rounded-full` (rótulo `text-slate-400`)
  5. **Box Comparativo de Prazos (`bg-slate-50 rounded-xl border border-slate-200/80 p-3`):**
     - Lado a lado (`grid-cols-2`): *Acordo Firmado* vs *Previsão Real* (destacado em `text-rose-600` se houver atraso), com pílula de desvio no topo.
  6. **Barra de Progresso Fina (`h-2 rounded-full bg-slate-100`).**
  7. **Callout "Status Report da Semana" (`bg-blue-50/60 border-blue-100/80 rounded-xl p-3`).**
  8. **Footer do Card (`bg-slate-50/70 border-t border-slate-100 p-3.5`):** Líder + contagem de membros (`+N`), Horas (`executadas / planejadas`) e botão `Ver EAP →`.

### 6.6. Cronograma Oficial EAP / Gantt (`<app-eap-gantt>`)
- **Barra de Controle e Governança (`rounded-3xl bg-white p-5`):**
  - **Co-Branding Limpo:** Exibe a miniatura do logotipo do cliente (`h-12 max-w-[140px] rounded-xl border p-1.5`) — *regra de negócio: quando há logo, exibe apenas o logo sem repetir o nome do cliente em texto ao lado*. Se não houver logo, exibe avatar com iniciais (`w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-black`).
  - **Seletor de Zoom Temporal:** `Meses | Semanas | Dias` em pílula segmentada (`bg-slate-100 p-1 rounded-2xl`), com seleção automática inteligente baseada na duração do projeto (`<= 35d` Dias, `<= 90d` Semanas, `> 90d` Meses).
  - **Barra de Governança:** Exibe Prioridade, Sistemas Envolvidos e Equipe Alocada (Líder + Membros em pílulas brancas `bg-white rounded-xl border border-slate-200`).
  - **Faixa de 5 Mini-KPIs (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3`):** Datas Acordadas, Progresso Global, Esforço Total, Divisão ILC vs Cliente, e Entregas na EAP.
- **Matriz do Gantt (`rounded-3xl border overflow-hidden`):**
  - **Coluna Esquerda Congelada (`w-64 shrink-0 sticky left-0 z-20`):** Lista as **5 Etapas Oficiais da EAP** numeradas de `1` a `5` (badge quadrado `w-8 h-8 rounded-xl bg-slate-900 text-white font-black`), subtítulo da etapa, quantidade de entregas e soma de horas da fase.
  - **Marcador "📍 Hoje":** Pílula amarela no cabeçalho escuro (`bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg`) alinhada a uma linha vertical contínua (`w-0.5 bg-amber-400/90`) que atravessa todas as 5 fases.
  - **Algoritmo de Raias Não-Sobrepostas (`Lanes`):** Entregas que colidem horizontalmente na mesma fase são alocadas automaticamente em raias verticais paralelas (`h-10`), mantendo `1.0%` de margem visual mínima.
  - **Cápsulas de Entrega:** Exibem **apenas o título limpo** (sem prefixos `[Épico]`, `#1234` ou emojis iniciais), com `min-w-[70px]`, `rounded-xl`, clicáveis para abrir o modal de detalhes.

### 6.7. Status Report Executivo da Diretoria (`<app-executive-report>`)
- **Foco:** Reuniões de diretoria (Board), com alta densidade ("One-Page Matrix" ou "Cards Compactos").
- **Componentes Exclusivos:**
  - **Hero Banner (`bg-slate-900 text-white rounded-2xl p-5`):** Manchete executiva da semana à esquerda + 4 métricas de pulso translúcidas à direita (`bg-white/5`, `bg-emerald-500/10`, `bg-rose-500/10`, `bg-blue-500/10`).
  - **Radar de Atenção Imediata (`bg-rose-50/50 border-rose-200/90 rounded-2xl p-4`):** Destaca até 3 projetos críticos/em atenção para deliberação imediata.
  - **Grid Inferior Duplo (`grid-cols-1 lg:grid-cols-2 gap-5`):**
    1. *Projetos no Radar & Roadmap Estratégico (Pipeline)* — badges de estágio (`Proposta Comercial` em indigo, `Discovery` em sky, `Kick-off` em emerald).
    2. *Deliberações & Decisões Esperadas da Diretoria (Pauta)* — itens com impacto, prazo e status (`Aprovado` vs `Pendente`).

### 6.8. Modal de Curadoria & Gestão (`<app-curator-modal>`)
- **Estrutura:** Modal amplo (`max-w-6xl w-full h-[92vh] rounded-3xl`) protegido por PIN, organizado em abas superiores (`rounded-t-xl`) e layout **Master-Detail Split View**:
  - **Coluna Mestre Esquerda (`w-80 sm:w-96 border-r`):** Busca rápida, filtro por cliente, botão `⚠️ Alertas` (filtra projetos com inconsistências) e lista rolável de projetos.
  - **Coluna Detalhe Direita (`flex-1`):** Editor completo com bloqueio/desbloqueio de campos sincronizados do Azure DevOps (`🔒 Bloqueado (Azure Oficial)` vs `🔓 Desbloqueado (Edição Manual)`), seletor visual de Prioridade com 4 cards explicativos, checkboxes dos 4 sistemas oficiais + tags dinâmicas para sistemas extras, e tabela editável de entregas da EAP.

---

## 7. Regras de Ouro para o Agente de IA (Prompt Pronto para o Claude)

> **Dica de Uso:** Copie o bloco abaixo e cole diretamente no início da sua conversa com o Claude (ou no arquivo `CLAUDE.md` do projeto) sempre que pedir novas telas, ajustes visuais ou novos componentes.

```markdown
### Diretrizes Obrigatórias de Design System (Painel Executivo ILC)

Ao gerar ou modificar qualquer código HTML/Angular/Tailwind neste projeto, siga estritamente estas regras visuais e arquiteturais:

1. **Stack & Tipografia:**
   - Utilize **Angular Standalone Components** com **Signals** (`signal`, `computed`).
   - Use exclusivamente **Tailwind CSS** para estilização (não crie CSS customizado desnecessário; mantenha os templates inline ou seguindo o padrão dos componentes existentes).
   - A fonte oficial é `"Plus Jakarta Sans"`. Mantenha a densidade executiva usando predominantemente `text-xs` (12px), `text-[11px]` e `text-[10px]` para rótulos/tabelas, e `font-bold` / `font-extrabold` / `font-black` para hierarquia clara.
   - Use textos em `uppercase tracking-wider text-[10px] font-bold text-slate-400` (ou `text-slate-500`) para cabeçalhos de sub-seções e rótulos de KPIs.

2. **Superfícies, Bordas e Arredondamento:**
   - Fundo geral da aplicação: `bg-slate-50 text-slate-800`.
   - Containers macro, Gantt e Modais: `bg-white rounded-3xl border border-slate-200/90 shadow-sm`.
   - Cards de projetos, KPIs e barras de filtro: `bg-white rounded-2xl border border-slate-200/90 shadow-sm`.
   - Sub-containers e caixas informativas internas: `bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5`.
   - Cabeçalhos de navegação e réguas temporais/percentuais: `bg-slate-900 text-white border-b border-slate-800`.
   - Botões e inputs: `rounded-xl text-xs font-bold` (ou `font-semibold`), com foco `focus:outline-none focus:ring-2 focus:ring-blue-500`.

3. **Semântica Estrita de Cores:**
   - **Ação Primária / Ativo:** `bg-blue-600 hover:bg-blue-700 text-white` (ou gradiente `from-blue-600 to-indigo-600` para ações de Curadoria).
   - **Saúde RAG:**
     - Verde (No Prazo): `emerald` (`bg-emerald-100 text-emerald-800`, barra `bg-emerald-500`).
     - Âmbar (Em Atenção / Margem Curta): `amber` (`bg-amber-100 text-amber-800`, barra `bg-amber-500`).
     - Vermelho (Com Desvio / Crítico): `rose` (`bg-rose-100 text-rose-800`, barra `bg-rose-500`).
     - Congelado / Planejado: `slate` (`bg-slate-200 text-slate-700`, barra `bg-slate-400`).
   - **Prioridades:** `P1` = `rose`, `P2` = `amber`, `P3` = `blue`, `P4` = `slate` (sempre use `service.getPriorityBadgeClass()`).
   - **5 Fases da EAP:** Planejamento (`purple`), Desenvolvimento (`blue`), Homologação (`orange`), Treinamento (`teal`), Operação Assistida (`emerald`) — sempre use `service.getMilestoneBadgeClass()`.
   - **Sistemas ILC:** Portal Integrator (`indigo`), App Smart Tracking (`emerald`), Smart X (`purple`), App ILC (`cyan`) — sempre use `service.getSystemBadgeClass()`.
   - **Blocos do Gantt EAP:** Respeite estritamente a paleta de 5 estados: Concluído (`bg-emerald-600 text-white`), Em Curso (`bg-emerald-200 text-emerald-950`), Margem Curta (`bg-amber-300 text-amber-950`), Atrasado (`bg-rose-200 text-rose-950`) e Planejado (`bg-slate-200 text-slate-700`).

4. **Regras de Negócio Visuais Importantes:**
   - **KPIs de Saúde RAG:** Apenas projetos com `status === 'Ativo'` entram na contagem de *No Prazo*, *Em Atenção* e *Com Desvio*. Projetos *Finalizados* ou *Congelados* nunca inflam os indicadores de risco.
   - **Co-Branding de Clientes:** Sempre verifique `service.getClientLogo(client)`. No cabeçalho do Gantt EAP, exiba apenas a imagem do logo dentro de sua moldura (`bg-white p-1.5 rounded-xl border border-slate-200`) sem duplicar o nome do cliente em texto ao lado.
   - **Portal do Cliente (`isClientPortalMode()`):** Oculte botões administrativos (`Sync`, `Curadoria` e filtros globais de outros clientes) quando o modo portal do cliente estiver ativo.
   - **Idioma e Formatação:** Toda a interface deve estar em Português do Brasil (`pt-BR`), com datas formatadas como `DD/MM/AAAA` (ou `DD/MM` em réguas compactas) e valores de esforço sufixados com `h` (ex: `45h / 120h`).
```
