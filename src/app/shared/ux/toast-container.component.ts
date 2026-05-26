import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastMessage, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-relevant="additions removals">
      @for (toast of toasts.messages(); track toast.id) {
        <div class="toast" [class]="'toast toast--' + toast.type" role="status">
          <span class="toast__dot" aria-hidden="true"></span>
          <span class="toast__message">{{ toast.message }}</span>
          @if (toast.action) {
            <button type="button" class="toast__action" (click)="runAction(toast)">DESFAZER</button>
          }
          <button type="button" class="toast__close" (click)="toasts.dismiss(toast.id)" aria-label="Fechar mensagem">
            <span aria-hidden="true">x</span>
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-container.component.scss',
})
export class ToastContainerComponent {
  protected readonly toasts = inject(ToastService);

  protected runAction(toast: ToastMessage) {
    toast.action?.handler();
    this.toasts.dismiss(toast.id);
  }
}
