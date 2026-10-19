export interface WeeklyReportSummary {
  id: string;
  weekNumber: number;
  year: number;
  title: string;
  period: string;
  meetingDate: string;
  executiveSummary: string;
  statusPulse: {
    totalActive: number;
    onTrack: number;
    attention: number;
    critical: number;
    averageProgress: number;
  };
  activeProjectsCount: number;
  roadmapCount: number;
}

export interface WeeklyReportProject {
  projectId: string;
  name: string;
  client: string;
  clientLogo?: string | null;
  currentMilestone: string;
  progress: number;
  ragStatus: 'green' | 'amber' | 'red';
  agreedDelivery: string | null;
  targetDelivery: string | null;
  varianceDays: number;
  statusReport: string;
  attentionPoints: string;
  hoursExecuted?: number;
  hoursPlanned?: number;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  systems?: string[];
  teamLeader?: string;
}

export interface RoadmapProject {
  id: string;
  name: string;
  client: string;
  estimatedStart: string;
  stage: string;
  strategicValue: string;
  description: string;
  responsible: string;
}

export interface BoardDecision {
  id: string;
  title: string;
  client: string;
  impact: string;
  status: string;
  deadline: string;
}

export interface WeeklyReport {
  id: string;
  weekNumber: number;
  year: number;
  title: string;
  period: string;
  meetingDate: string;
  executiveSummary: string;
  statusPulse: {
    totalActive: number;
    onTrack: number;
    attention: number;
    critical: number;
    averageProgress: number;
  };
  activeProjects: WeeklyReportProject[];
  roadmapProjects: RoadmapProject[];
  boardDecisions: BoardDecision[];
}
