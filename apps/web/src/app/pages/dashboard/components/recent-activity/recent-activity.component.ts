import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Activity } from '../../../../shared/models/activity.model';

@Component({
  selector: 'app-recent-activity',
  imports: [DatePipe],
  templateUrl: './recent-activity.component.html',
})
export class RecentActivityComponent {
  readonly activities = input<Activity[]>([]);

  getActivityIcon(type: string): string {
    switch (type) {
      case 'note': return 'note';
      case 'call': return 'call';
      case 'email': return 'email';
      case 'meeting': return 'meeting';
      default: return 'note';
    }
  }
}
