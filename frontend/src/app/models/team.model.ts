export interface TeamMemberConfig {
  name: string;
  isVisible: boolean;
  role: string;
  allocatedProjects: string[];
}

export interface TeamMemberProjectShare {
  projectId: string;
  projectName: string;
  client: string;
  category: 'new_project' | 'maintenance';
  hours: number;
  tasksCount: number;
}

export interface TeamMemberAllocation {
  name: string;
  isVisible: boolean;
  role: string;
  avatarColor?: string;
  totalHours: number;
  newProjectHours: number;
  maintenanceHours: number;
  maintenancePercent: number;
  tasksCount: number;
  allocatedProjects: string[];
  projects: TeamMemberProjectShare[];
}

export interface ProjectTeamAllocation {
  id: string;
  name: string;
  client: string;
  category: 'new_project' | 'maintenance';
  leader: string;
  teamMembersCount: number;
  teamMembers: Array<{ name: string; role: string; hours: number }>;
  totalHours: number;
}

export interface TeamAllocationReport {
  period: string;
  clientFilter: string;
  totalMembers: number;
  totalCompanyHours: number;
  totalNewProjectHours: number;
  totalMaintenanceHours: number;
  maintenanceRatio: number;
  coveredProjectsCount: number;
  members: TeamMemberAllocation[];
  projects: ProjectTeamAllocation[];
}
