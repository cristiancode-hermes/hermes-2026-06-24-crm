import { Deal } from './deal.model';
import { Activity } from './activity.model';

export interface KpiData {
  totalDeals: number;
  pipelineValue: number;
  wonValue: number;
  conversionRate: number;
}

export interface StageValue {
  stage: string;
  value: number;
  count: number;
}

export interface DashboardData {
  kpis: KpiData;
  chartData: StageValue[];
  upcomingDeals: Deal[];
  recentActivities: Activity[];
}
