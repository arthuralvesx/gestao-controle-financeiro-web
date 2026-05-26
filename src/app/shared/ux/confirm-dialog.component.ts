import { Component, EventEmitter, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (open()) {
      <div class="overlay" role="presentation" (click)="cancel.emit()">
        <section
          class="dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          tabindex="-1"
          (click)="$event.stopPropagation()"
        >
          <h2>{{ title() }}</h2>
          <p>{{ message() }}</p>
          @if (detail()) {
            <div class="dialog__detail">{{ detail() }}</div>
          }
          <div class="dialog__actions">
            <button type="button" class="btn btn--secondary" (click)="cancel.emit()">Cancelar</button>
            <button type="button" class="btn btn--danger" (click)="confirm.emit()">{{ confirmLabel() }}</button>
          </div>
        </section>
      </div>
    }
  `,
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  open = input(false);
  title = input('Confirmar ação');
  message = input.required<string>();
  detail = input('');
  confirmLabel = input('Excluir');
  confirm = output<void>();
  cancel = output<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open()) {
      this.cancel.emit();
    }
  }
}
