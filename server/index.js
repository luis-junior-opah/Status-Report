const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const projectStore = require('./services/projectStore');
const syncScheduler = require('./services/syncScheduler');
const weeklyReportStore = require('./services/weeklyReportStore');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static logos if uploaded
const publicLogos = path.join(__dirname, 'public/assets/logos');
if (!require('fs').existsSync(publicLogos)) {
  require('fs').mkdirSync(publicLogos, { recursive: true });
}
app.use('/assets/logos', express.static(publicLogos));

// Public API endpoints
app.get('/api/public/projects', (req, res) => {
  const clientFilter = req.query.client || null;
  res.json({
    success: true,
    data: projectStore.getPublicProjects(clientFilter)
  });
});

app.get('/api/public/clients', (req, res) => {
  res.json({
    success: true,
    data: projectStore.getClients()
  });
});

app.get('/api/public/stats', (req, res) => {
  const clientFilter = req.query.client || null;
  res.json({
    success: true,
    data: projectStore.getStats(clientFilter)
  });
});

// Client Portal Endpoint (Secure Token-gated view)
app.get('/api/public/client-portal/:slug', (req, res) => {
  const { slug } = req.params;
  const token = req.query.token;

  const client = projectStore.getClientBySlug(slug);
  if (!client) {
    return res.status(404).json({ success: false, message: 'Cliente não encontrado.' });
  }

  // Token validation
  if (!token || token !== client.token) {
    return res.status(401).json({ success: false, message: 'Token de acesso inválido ou expirado para este cliente.' });
  }

  const projects = projectStore.getPublicProjects(client.name);
  const stats = projectStore.getStats(client.name);

  res.json({
    success: true,
    client: {
      name: client.name,
      slug: client.slug,
      logoUrl: client.logoUrl,
      description: client.description
    },
    data: projects,
    stats: stats
  });
});

// Public Weekly Status Reports (for Executive Presentation & History)
app.get('/api/public/weekly-reports', (req, res) => {
  res.json({
    success: true,
    data: weeklyReportStore.getAllReports()
  });
});

app.get('/api/public/weekly-reports/:id', (req, res) => {
  const report = weeklyReportStore.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Relatório semanal não encontrado.' });
  }
  res.json({
    success: true,
    data: report
  });
});

// Admin / Curator Authentication
function checkAdminAuth(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.query.pin;
  if (!pin || pin !== config.adminPin) {
    return res.status(401).json({ success: false, message: 'PIN administrativo incorreto ou ausente.' });
  }
  next();
}

// Admin Weekly Report Management
app.post('/api/admin/weekly-reports/generate', checkAdminAuth, (req, res) => {
  try {
    const report = weeklyReportStore.generateCurrentWeek();
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/weekly-reports', checkAdminAuth, (req, res) => {
  try {
    const saved = weeklyReportStore.saveReport(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/weekly-reports/:id', checkAdminAuth, (req, res) => {
  try {
    const updated = weeklyReportStore.saveReport({ id: req.params.id, ...req.body });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/weekly-reports/:id', checkAdminAuth, (req, res) => {
  const ok = weeklyReportStore.deleteReport(req.params.id);
  res.json({ success: ok });
});

app.get('/api/admin/projects', checkAdminAuth, (req, res) => {
  res.json({
    success: true,
    data: projectStore.getAllProjects()
  });
});

app.post('/api/admin/projects', checkAdminAuth, (req, res) => {
  const newProj = projectStore.createManualProject(req.body);
  try { weeklyReportStore.syncAllReportsWithProjects(); } catch (_) {}
  res.json({ success: true, data: newProj });
});

app.put('/api/admin/projects/:id', checkAdminAuth, (req, res) => {
  const updated = projectStore.updateProject(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Projeto não encontrado.' });
  }
  try { weeklyReportStore.syncAllReportsWithProjects(); } catch (_) {}
  res.json({ success: true, data: updated });
});

app.delete('/api/admin/projects/:id', checkAdminAuth, (req, res) => {
  const deleted = projectStore.deleteProject(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Projeto não encontrado.' });
  }
  try { weeklyReportStore.syncAllReportsWithProjects(); } catch (_) {}
  res.json({ success: true, message: 'Projeto excluído com sucesso.', data: deleted });
});

app.get('/api/admin/projects/:id/azure-audit', checkAdminAuth, async (req, res) => {
  try {
    const proj = projectStore.projects.find(p => p.id === req.params.id);
    if (!proj) {
      return res.status(404).json({ success: false, message: 'Projeto não encontrado.' });
    }
    const azureService = require('./services/azureDevOpsService');
    const auditData = await azureService.getProjectFullAudit(proj.name);
    res.json({ success: true, data: auditData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/clients/:slug', checkAdminAuth, (req, res) => {
  const updatedClient = projectStore.updateClient(req.params.slug, req.body);
  if (!updatedClient) {
    return res.status(404).json({ success: false, message: 'Cliente não encontrado.' });
  }
  res.json({ success: true, data: updatedClient });
});

app.post('/api/admin/clients/:slug/logo', checkAdminAuth, (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const updated = projectStore.saveClientLogo(req.params.slug, imageBase64);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Azure DevOps PAT & Status Endpoints
app.get('/api/admin/azure/status', checkAdminAuth, async (req, res) => {
  const status = projectStore.getAzureStatus();
  res.json({ success: true, data: status });
});

app.post('/api/admin/azure/test', checkAdminAuth, async (req, res) => {
  const azureService = require('./services/azureDevOpsService');
  const result = await azureService.testConnection();
  res.json(result);
});

app.post('/api/admin/azure/pat', checkAdminAuth, (req, res) => {
  try {
    const { pat } = req.body;
    const updated = projectStore.updateAzurePat(pat);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/sync', checkAdminAuth, async (req, res) => {
  const result = await syncScheduler.runSync();
  res.json(result);
});

// Serve frontend build
const frontendDist = path.join(__dirname, '../frontend/dist/frontend/browser');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`[Server] Backend executando na porta ${config.port}`);
  syncScheduler.start();
});
