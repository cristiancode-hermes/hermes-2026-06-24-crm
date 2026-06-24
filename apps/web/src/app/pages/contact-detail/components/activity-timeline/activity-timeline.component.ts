import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Activity } from '../../../../shared/models/activity.model';

@Component({
  selector: 'app-activity-timeline',
  imports: [DatePipe],
  templateUrl: './activity-timeline.component.html',
})
export class ActivityTimelineComponent {
  readonly activities = input<Activity[]>([]);
  readonly newActivity = output<void>();
}
