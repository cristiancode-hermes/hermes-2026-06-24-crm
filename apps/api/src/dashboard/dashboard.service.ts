import { Injectable } from '@nestjs/common';
import { DealsService } from '../deals/deals.service';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dealsService: DealsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async getDashboard(organizationId: number) {
    const kpis = await this.dealsService.getKpi(organizationId);
    const { stageValues } = kpis;

    const deals = await this.dealsService.findAll(organizationId);
    const upcomingDeals = await this.dealsService.getUpcoming(organizationId);
    const recentActivities = await this.activitiesService.findRecentByOrg(
      organizationId,
      5,
    );

    return {
      kpis: {
        totalDeals: kpis.totalDeals,
        pipelineValue: kpis.pipelineValue,
        wonValue: kpis.wonValue,
        conversionRate: kpis.conversionRate,
      },
      chartData: stageValues,
      upcomingDeals,
      recentActivities,
    };
  }
}
