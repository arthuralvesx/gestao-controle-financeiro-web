import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  handler: () => void;
}

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly messages = signal<ToastMessage[]>([]);

  success(message: string, action?: ToastAction) {
    this.show('success', message, action);
  }

  error(message: string, action?: ToastAction) {
    this.show('error', message, action);
  }

  warning(message: string, action?: ToastAction) {
    this.show('warning', message, action);
  }

  info(message: string, action?: ToastAction) {
    this.show('info', message, action);
  }

  fromApiError(error: unknown, fallback: string) {
    const err = error as { error?: { message?: string } | string; message?: string };
    const apiMessage =
      typeof err?.error === 'string'
        ? err.error
        : err?.error?.message || err?.message || fallback;

    this.error(apiMessage);
  }

  dismiss(id: number) {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  private show(type: ToastType, message: string, action?: ToastAction) {
    const toast = { id: this.nextId++, type, message, action };
    this.messages.update((messages) => [...messages, toast]);
    window.setTimeout(() => this.dismiss(toast.id), action ? 7000 : 4200);
  }
}
