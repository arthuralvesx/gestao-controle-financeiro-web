import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-painel-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './painel.html',
  styleUrl: './painel.scss'
})
export class PainelPage {
  /** Dados ainda serão conectados à API — valores iniciais como no layout de referência */
  protected readonly userEmail = signal('teste@teste.com');
  protected readonly receitas = signal(0);
  protected readonly despesas = signal(0);

  protected readonly viewDate = signal(this.startOfMonth(new Date()));

  protected readonly disponivel = computed(() => this.receitas() - this.despesas());

  protected readonly monthTitle = computed(() => this.formatMonthTitle(this.viewDate()));

  protected readonly isCurrentMonth = computed(() => this.isSameMonth(this.viewDate(), new Date()));

  protected readonly despesaPercentReceita = computed(() => {
    const r = this.receitas();
    if (r <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.despesas() / r) * 1000) / 10);
  });

  protected formatBrl(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected previousMonth(): void {
    this.viewDate.update((d) => this.addMonths(d, -1));
  }

  protected nextMonth(): void {
    this.viewDate.update((d) => this.addMonths(d, 1));
  }

  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private addMonths(d: Date, delta: number): Date {
    return new Date(d.getFullYear(), d.getMonth() + delta, 1);
  }

  private isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  private formatMonthTitle(d: Date): string {
    const raw = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
}
