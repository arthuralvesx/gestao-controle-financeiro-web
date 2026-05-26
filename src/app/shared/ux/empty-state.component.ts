import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty" role="status">
      <strong>{{ title() }}</strong>
      @if (text()) {
        <p>{{ text() }}</p>
      }
      <ng-content />
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  title = input.required<string>();
  text = input<string>('');
}
