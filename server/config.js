require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  azureDevOps: {
    orgUrl: process.env.AZURE_DEVOPS_ORG_URL || 'https://projetosmirassol1.visualstudio.com',
    pat: process.env.AZURE_DEVOPS_PAT || ''
  },
  syncIntervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '30', 10),
  adminPin: process.env.ADMIN_PIN || 'admin'
};
