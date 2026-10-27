import { Project } from './project.model';

export type MaintenancePeriod = 'current_month' | 'last_quarter' | 'year_2026' | 'all';

export interface MonthlyEffort {
  monthKey: string; // '2026-01', '2026-02', etc.
  label: string;    // 'Jan/26', 'Fev/26', etc.
  newProjectHours: number;
  maintenanceHours: number;
  totalHours: number;
  maintenancePercent: number;
}

export interface MemberProjectShare {
  projectName: string;
  client: string;
  hours: number;
  category: 'new_project' | 'maintenance';
}

export interface MemberEffort {
  name: string;
  avatarColor?: string;
  newProjectHours: number;
  maintenanceHours: number;
  totalHours: number;
  maintenancePercent: number;
  topProjects: MemberProjectShare[];
}

export interface MaintenanceMetrics {
  period: MaintenancePeriod;
  clientFilter: string;
  totalMaintenanceHours: number;
  totalNewProjectHours: number;
  totalCompanyHours: number;
  maintenancePercent: number;
  maintenanceProjectsCount: number;
  activeMaintenanceProjects: Project[];
  monthlyHistory: MonthlyEffort[];
  teamMembers: MemberEffort[];
}
