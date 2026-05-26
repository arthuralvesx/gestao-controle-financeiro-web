import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  template: `
    <article class="stat" [class.stat--accent]="accent()">
      <div class="stat__icon" [class]="'stat__icon stat__icon--' + tone()" aria-hidden="true">
        <ng-content select="[icon]" />
      </div>
      <div class="stat__meta">
        <div class="stat__label">{{ label() }}</div>
        <div class="stat__value">{{ value() }}</div>
        @if (hint()) {
          <div class="stat__hint">{{ hint() }}</div>
        }
      </div>
    </article>
  `,
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  hint = input<string>('');
  tone = input<'income' | 'expense' | 'reserve' | 'balance' | 'neutral'>('neutral');
  accent = input(false);
}
