import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  template: `
    <div class="skeleton-list" aria-hidden="true">
      @for (item of items(); track $index) {
        <span class="skeleton"></span>
      }
    </div>
  `,
  styleUrl: './loading-skeleton.component.scss',
})
export class LoadingSkeletonComponent {
  rows = input(3);

  protected items() {
    return Array.from({ length: this.rows() });
  }
}
