import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DealsModule } from '../deals/deals.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [DealsModule, ActivitiesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
