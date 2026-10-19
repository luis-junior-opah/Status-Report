# 📊 Dashboard Gerencial Executivo & Governança de Projetos (ILC Integrator)

Plataforma corporativa de **governança de projetos, monitoramento executivo de portfólio e apresentação para diretoria e clientes**, desenvolvida em **Angular 19+** com integração automatizada com o **Azure DevOps**.

A solução foi projetada para transformar dados operacionais do Azure DevOps em uma **visão executiva limpa, orientada a negócios e de alto impacto visual**, dispensando a necessidade de licenças do Azure DevOps para a alta liderança e clientes.

---

## 📑 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
  - [1. Home (Visão Macro do Portfólio)](#1-home-visão-macro-do-portfólio)
  - [2. Cards de Projetos (Status Report da Semana)](#2-cards-de-projetos-status-report-da-semana)
  - [3. Tabela Consolidada (Visão Diretoria)](#3-tabela-consolidada-visão-diretoria)
  - [4. Cronograma Oficial EAP (Gantt Dinâmico)](#4-cronograma-oficial-eap-gantt-dinâmico)
  - [5. Status Report Executivo One-Page (Reunião de Diretoria)](#5-status-report-executivo-one-page-reunião-de-diretoria)
  - [6. Painel de Curadoria & Gestão Gerencial](#6-painel-de-curadoria--gestão-gerencial)
  - [7. Auditoria & Diagnóstico Azure DevOps](#7-auditoria--diagnóstico-azure-devops)
  - [8. Portais Seguros por Cliente & Links Customizados](#8-portais-seguros-por-cliente--links-customizados)
- [Classificação de Prioridades & Critérios](#-classificação-de-prioridades--critérios)
- [Sistemas ILC Suportados](#-sistemas-ilc-suportados)
- [Arquitetura Tecnológica](#-arquitetura-tecnológica)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Execução Local](#-instalação-e-execução-local)
- [Configuração de Variáveis de Ambiente](#-configuração-de-variáveis-de-ambiente)
- [Integração com o Azure DevOps](#-integração-com-o-azure-devops)
- [Instruções para Publicação no GitHub](#-instruções-para-publicação-no-github)
- [Segurança & Privacidade](#-segurança--privacidade)

---

## 🎯 Visão Geral

Nas organizações corporativas e de logística integrada, gerentes de projetos, diretores e clientes necessitam de respostas rápidas:
- *Quais projetos são estratégicos e qual a criticidade de cada um?*
- *Em qual das 5 etapas da EAP o projeto se encontra?*
- *Qual o desvio em dias em relação ao acordo contratual inicial?*
- *Quais os principais sistemas envolvidos (Portal Integrator, App Smart Tracking, Smart X, App ILC, SAP, etc.)?*
- *Quem é o líder do projeto e quais especialistas compõem o time?*
- *Quais são as decisões pendentes e os alertas para a reunião de diretoria da semana?*

Este dashboard responde a todas essas perguntas em uma experiência de usuário **moderna, fluida, responsiva e com suporte a modo apresentação executiva**.

---

## 🚀 Funcionalidades Principais

### 1. Home (Visão Macro do Portfólio)
- **Régua Percentual (0% a 100%)**: Visualização em barras de progresso proporcionais ao avanço real de cada iniciativa.
- **Farol de Saúde RAG**: Coloração dinâmica por semáforo de saúde (*Verde/No Prazo*, *Amarelo/Em Atenção*, *Vermelho/Com Desvio*).
- **Pills de Prioridade (`P1` a `P4`)**: Identificação rápida da criticidade de cada projeto.
- **Badges de Sistemas Envolvidos**: Exibição dos sistemas impactados por linha de projeto.
- **Identificação do Líder**: Visualização instantânea do gestor responsável (`👤 Líder`).
- **Navegação 1-Clique para EAP**: Botão direto para inspecionar o cronograma detalhado do projeto.

### 2. Cards de Projetos (Status Report da Semana)
- **Stepper Visual da EAP Oficial**: Acompanhamento linear das 5 fases padronizadas:
  1. `Planejamento`
  2. `Desenvolvimento`
  3. `Homologação`
  4. `Treinamento`
  5. `Operação Assistida`
- **Comparativo de Prazos**: Confronto direto entre o **Acordo Firmado (Linha de Base)** e a **Previsão Real de Término**, calculando automaticamente o desvio em dias (ex: *No Prazo*, *+14d desvio*, *-5d adiantado*).
- **Resumo Executivo da Semana**: Boletim textual das entregas recentes e impedimentos.
- **Detalhamento de Esforço em Horas**: Proporção de horas executadas versus horas planejadas.
- **Equipe no Rodapé**: Líder do projeto e número de especialistas alocados.

### 3. Tabela Consolidada (Visão Diretoria)
- Tabela analítica completa desenhada para pautas de reuniões, atas e exportações.
- Colunas estruturadas: `Prioridade`, `Cliente`, `Projeto`, `Sistemas Envolvidos`, `Equipe (Líder + Especialistas)`, `Status`, `Saúde (RAG)`, `Marco Atual`, `Acordo (Fim)`, `Previsão Real`, `Desvio (dias)`, `Progresso (%)` e `Horas (Exec/Plan)`.
- Compatível com filtros combinados de busca, cliente, status e prioridade.

### 4. Cronograma Oficial EAP (Gantt Dinâmico)
- Linha do tempo precisa com posicionamento de cada entrega/feature de acordo com suas **datas exatas de início e término (Dia / Mês / Ano)**.
- Marcadores de **Atraso** e **Margem Apertada** para destacar riscos operacionais com antecedência.
- Agrupamento visual das entregas nas 5 etapas macro da EAP.

### 5. Status Report Executivo One-Page (Reunião de Diretoria)
- **Visão Semanal Executiva**: Página dedicada e sintetizada para ser projetada na reunião semanal de diretoria.
- **Headline Estratégica**: Destaque semanal oficial do portfólio.
- **Pulse KPIs**: Cartões com métricas vitais:
  - *Projetos Ativos Monitorados*
  - *Percentual No Prazo*
  - *Projetos em Atenção / Desvio Crítico*
  - *Média de Conclusão Global*
- **Matriz Consolidada de Projetos Ativos**: Tabela de alta densidade informativa com prioridade, cliente, etapa EAP, progresso, saúde, previsão de entrega e pontos de atenção.
- **Radar de Projetos no Roadmap**: Bloco para apresentação de projetos em prospecção/pipeline (*Ideação*, *Proposta Técnica*, *Kick-off*), com valor estratégico estimado e responsável.
- **Decisões & Deliberações da Diretoria**: Registro das decisões tomadas na reunião (*Aguardando Aval*, *Em Deliberação*, *Alinhado*, *Aprovado*) com prazo e impacto.
- **Histórico de Edições**: Seletor para navegar entre atas e edições de semanas anteriores.
- **Modo Apresentação (Dark Mode Executivo)**: Visual escuro sofisticado projetado para telões e salas de reunião com contraste aprimorado.
- **Exportação em PDF**: Botão integrado com folhas de estilo otimizadas para impressão limpa sem elementos de navegação.

### 6. Painel de Curadoria & Gestão Gerencial
- Acesso restrito protegido por PIN administrativo (padrão: `admin`).
- **Definição de Prioridades com Legenda Inline**: 4 cards explicativos detalhando os critérios de negócio para enquadramento em P1, P2, P3 ou P4.
- **Vínculo Manual de Sistemas**: Seleção manual com suporte dinâmico para cadastrar novos sistemas legados ou ERPs externos (ex: *SAP*, *TMS Rodopar*, *Senior RH*).
- **Atribuição de Equipe**: Registro do Líder / GP / Scrum Master e membros do time técnico.
- **Gestão Granular de Bloqueios**: Capacidade de bloquear ou desbloquear a sincronização do Azure DevOps para datas, horas e percentual de progresso, permitindo intervenção manual quando necessário.
- **Restauração 1-Clique do Azure**: Reversão imediata para os valores sincronizados do Azure DevOps.
- **Gestão do Status Report**: Interface para gerar a edição da semana atual, sincronizar itens do Azure e editar deliberações.
- **Gerenciamento de Clientes & Logotipos**: Cadastro de clientes, geração de tokens e upload de arquivos de imagem de logotipos.

### 7. Auditoria & Diagnóstico Azure DevOps
- Modal de auditoria profunda que avalia o nível de preenchimento dos itens de trabalho no Azure DevOps (*Épicos*, *Features*, *User Stories*, *Tasks* e *Bugs*).
- **Score de Conformidade (%)**: Indicador de qualidade cadastral das equipes.
- **Diagnóstico de Pendências**: Alerta automático de itens sem datas de início/término, sem estimativa de horas ou sem responsável atribuído.

### 8. Portais Seguros por Cliente & Links Customizados
- **Portais Dedicados**: Acesso isolado para clientes via URL segura tokenizada (`/cliente/{slug}?token={token}`).
- **Gerador de Links Multi-Cliente**: Seleção livre de qualquer conjunto de projetos para criar um link compartilhável independente de cliente (`/?projects=id1,id2,id3`).

---

## 🎯 Classificação de Prioridades & Critérios

A governança do portfólio adota 4 níveis oficiais de criticidade, com critérios visíveis diretamente na interface de curadoria:

| Nível | Descrição | Critério de Enquadramento | Badge Visual |
| :--- | :--- | :--- | :--- |
| **`P1`** | **Crítica / Estratégica** | Impacto direto em receita, conformidade legal/regulatória urgente ou risco iminente de paralisação de operações logísticas críticas. | Vermelho / Rose |
| **`P2`** | **Alta** | Iniciativas estratégicas prioritárias com prazos acordados rígidos e alto valor agregado para o negócio ou cliente contratante. | Âmbar / Laranja |
| **`P3`** | **Média** | Evoluções funcionais programadas, melhorias de processos internos e automações com prazo moderado de entrega. | Azul / Índigo |
| **`P4`** | **Baixa / Desejável** | Ajustes cosméticos, melhorias secundárias, débitos técnicos de baixo impacto ou tarefas sob demanda. | Cinza / Slate |

---

## 💻 Sistemas ILC Suportados

O dashboard oferece suporte nativo aos 4 sistemas do ecossistema ILC, além de inclusão dinâmica ilimitada:

1. **`Portal Integrator`** — *Web / B2B*
2. **`App Smart Tracking`** — *Mobile Motoristas / Operacional*
3. **`Smart X`** — *Formulários*
4. **`App ILC`** — *Mobile / Rastreamento de Cargas*
5. **Sistemas Dinâmicos Adicionais**: Suporte para registrar qualquer integração corporativa via Curadoria (ex: *SAP S/4HANA*, *TMS Rodopar*, *Senior RH*, etc.).

> **Regra de Governança**: O vínculo entre sistemas e projetos é **100% manual**, realizado no painel de curadoria para garantir precisão e evitar associações automatizadas incorretas.

---

## 🏛️ Arquitetura Tecnológica

```
┌────────────────────────────────────────────────────────────────┐
│                       Frontend (Angular 19+)                   │
│   Standalone Components • Signals • Computed • Tailwind CSS    │
└───────────────────────────────┬────────────────────────────────┘
                                │ HTTP REST / JSON
┌───────────────────────────────▼────────────────────────────────┐
│                    Backend Server (Node.js / Express)          │
│   APIs Públicas • API de Curadoria (PIN) • Sincronizador 30m   │
└───────────────┬───────────────────────────────┬────────────────┘
                │                               │
┌───────────────▼──────────────┐ ┌──────────────▼────────────────┐
│      Azure DevOps Services   │ │      Data Store (JSON)        │
│  REST API v7.1 • Work Items  │ │  projects.json • clients.json │
│   Analytics • WIQL Queries   │ │  weekly_reports.json (Hist.)  │
└──────────────────────────────┘ └───────────────────────────────┘
```

- **Frontend**:
  - **Framework**: Angular 19+ (Standalone Components, Signals reativos, computed signals).
  - **Estilização**: Tailwind CSS com design system executivo customizado.
  - **Ícones**: SVG nativos com estilo consistente.
- **Backend**:
  - **Runtime**: Node.js com Express.
  - **Integração Azure**: Chamadas REST com autenticação PAT segura (Basic Auth com base64).
  - **Agendador**: Polling assíncrono programado a cada 30 minutos com fallback resiliente.
  - **Persistência**: Base de dados em JSON estruturado com persistência transacional de curadorias manuais.

---

## 📂 Estrutura do Repositório

```
Dashboard/
├── docs/
│   └── guia-uso-azure-devops.md        # Manual de boas práticas e cadastro no Azure
├── frontend/                           # Aplicação Angular 19+
│   ├── public/
│   │   └── assets/                     # Logotipos oficiais de clientes e ILC
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── curator-modal/      # Painel de Curadoria, Prioridades e Sistemas
│   │   │   │   ├── eap-gantt/          # Cronograma EAP e linha do tempo precisa
│   │   │   │   ├── executive-report/   # Status Report One-Page para Diretoria
│   │   │   │   ├── filters/            # Barra de busca, filtros de prioridade e ordenação
│   │   │   │   ├── header/             # Cabeçalho executivo e menu de navegação
│   │   │   │   ├── kpi-summary/        # Cards de métricas rápidas de saúde
│   │   │   │   ├── portfolio-macro/    # Visão Macro Home (Régua 0-100%)
│   │   │   │   ├── project-cards/      # Cards com stepper das 5 fases da EAP
│   │   │   │   ├── project-table/      # Tabela consolidada de projetos
│   │   │   │   └── timeline/           # Linha do tempo visual
│   │   │   ├── models/                 # Interfaces TypeScript e definições de domínio
│   │   │   └── services/               # Serviços de API e estado reativo por Signals
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── server/                             # Servidor Backend Node.js
│   ├── data/                           # Bases de dados JSON persistidas
│   │   ├── clients.json                # Configuração e tokens dos clientes
│   │   ├── projects.json               # Projetos sincronizados e curados
│   │   └── weekly_reports.json         # Histórico semanal dos status reports
│   ├── public/                         # Assets estáticos e logotipos servidos
│   ├── services/
│   │   ├── azureDevOpsService.js       # Cliente REST para a API do Azure DevOps
│   │   ├── projectStore.js             # Repositório de projetos, cálculo RAG e curadoria
│   │   ├── syncScheduler.js            # Rotina de sincronização periódica
│   │   └── weeklyReportStore.js        # Gestão de edições do Status Report
│   ├── .env.example                    # Modelo de configuração de variáveis de ambiente
│   ├── config.js
│   ├── index.js
│   └── package.json
├── .gitignore                          # Regras estritas de segurança (ignora .env e temporários)
├── package.json                        # Scripts raiz para execução integrada
└── README.md                           # Documentação técnica e operacional
```

---

## ⚙️ Pré-requisitos

Antes de iniciar, verifique se você possui instalado em sua máquina:
- **Node.js**: Versão 18.x ou superior (Recomendado: 20.x ou 22.x LTS).
- **npm**: Versão 9.x ou superior.
- **Git**: Para controle de versão e publicação no GitHub.

---

## 🛠️ Instalação e Execução Local

### Passo 1: Clonar ou Baixar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd Dashboard
```

### Passo 2: Instalar as Dependências

Instale as dependências da raiz, do servidor e do frontend:

```bash
# Na pasta raiz
npm install

# Instalar dependências do servidor
cd server
npm install

# Instalar dependências do frontend
cd ../frontend
npm install

# Retornar à raiz
cd ..
```

### Passo 3: Configurar o Arquivo `.env` do Servidor

Crie o arquivo `server/.env` a partir do modelo `server/.env.example`:

```bash
cp server/.env.example server/.env
```

Edite o arquivo `server/.env` com suas credenciais (veja a seção [Integração com o Azure DevOps](#-integração-com-o-azure-devops)).

### Passo 4: Compilar o Frontend

Gere a compilação de produção do frontend Angular:

```bash
cd frontend
npm run build
cd ..
```

### Passo 5: Iniciar a Aplicação

Inicie o servidor integrado (ele servirá tanto as APIs quanto o frontend compilado):

```bash
npm start
```

Abra seu navegador em:
👉 **`http://localhost:3000`**

- **PIN da Área de Curadoria**: `admin`
- **Sincronização**: Realizada automaticamente na inicialização e a cada 30 minutos.

---

## 🔑 Configuração de Variáveis de Ambiente

O arquivo `server/.env` aceita as seguintes variáveis:

```ini
# Porta onde o servidor Express irá responder
PORT=3000

# URL da Organização no Azure DevOps
AZURE_DEVOPS_ORG_URL=https://projetosmirassol1.visualstudio.com

# Personal Access Token (PAT) com permissão de leitura em Work Items
AZURE_DEVOPS_PAT=SEU_TOKEN_PAT_AQUI

# Frequência de sincronização automática com o Azure em minutos (padrão: 30)
SYNC_INTERVAL_MINUTES=30

# Senha PIN para acessar o painel de Curadoria no dashboard
ADMIN_PIN=admin
```

---

## ☁️ Integração com o Azure DevOps

### Como Gerar o Personal Access Token (PAT):
1. Acesse sua organização no Azure DevOps: `https://projetosmirassol1.visualstudio.com` (ou a URL de sua empresa).
2. Clique no ícone de perfil no canto superior direito e selecione **User settings** $\rightarrow$ **Personal access tokens**.
3. Clique em **+ New Token**.
4. Defina as seguintes opções:
   - **Name**: `Dashboard-Executivo`
   - **Organization**: Selecione sua organização oficial.
   - **Expiration**: 1 ano ou conforme a política de segurança interna.
   - **Scopes**: Selecione **Custom defined**:
     - **Work Items**: `Read`
     - **Project and Team**: `Read`
     - **Analytics**: `Read`
5. Clique em **Create** e copie o token gerado.
6. Cole o token na variável `AZURE_DEVOPS_PAT` no arquivo `server/.env` ou atualize diretamente pelo modal de Curadoria na aba **Azure DevOps**.

---

## 📤 Instruções para Publicação no GitHub

Para publicar esta versão do projeto em um repositório no seu GitHub, siga o passo a passo abaixo:

### 1. Criar um Novo Repositório no GitHub
1. Acesse [github.com/new](https://github.com/new).
2. Dê um nome ao repositório (ex: `dashboard-gerencial-projetos` ou `ilc-portfolio-dashboard`).
3. Escolha se o repositório será **Private** (recomendado para uso corporativo) ou **Public**.
4. **Não marque** as opções *"Add a README file"*, *"Add .gitignore"* ou *"Choose a license"*, pois o projeto local já possui esses arquivos configurados.
5. Clique em **Create repository**.
6. Copie a URL do repositório (ex: `https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git`).

### 2. Comitar e Enviar os Arquivos Locais via Terminal
No terminal, dentro da pasta raiz do projeto (`Dashboard`), execute:

```bash
# 1. Verificar o status dos arquivos a serem comitados
git status

# 2. Adicionar todos os arquivos rastreados
git add .

# 3. Criar o commit inicial desta versão
git commit -m "feat: versão inicial da plataforma de governança executiva de projetos com prioridades, sistemas e status report semanal"

# 4. Vincular o repositório remoto do GitHub (substitua pela sua URL)
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git

# 5. Definir a branch principal como main e enviar
git branch -M main
git push -u origin main
```

---

## 🛡️ Segurança & Privacidade

- **Proteção de Segredos**: O arquivo `server/.env` que contém o token PAT e o PIN administrativo está explicitamente adicionado ao `.gitignore` e **nunca** é enviado para o GitHub.
- **Sanitização de Dados**: O backend filtra e entrega ao navegador apenas os dados consolidados e públicos dos projetos curados.
- **Token por Cliente**: Cada cliente corporativo possui um token isolado (`clients.json`), permitindo visualização exclusiva dos seus respectivos projetos sem vazamento entre empresas.

---

**Desenvolvido para Governança Estratégica & Apresentação Executiva — ILC Integrator Logistics**
