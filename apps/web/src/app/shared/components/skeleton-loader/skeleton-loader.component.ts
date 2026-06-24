import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  imports: [],
  templateUrl: './skeleton-loader.component.html',
})
export class SkeletonLoaderComponent {
  readonly type = input<'card' | 'table' | 'chart' | 'timeline'>('card');
  readonly count = input<number>(3);
}
