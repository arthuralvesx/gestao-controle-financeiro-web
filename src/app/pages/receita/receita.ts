import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Receita, ReceitaService } from './receita.service';

@Component({
  selector: 'app-receita-page',
  imports: [CommonModule],
  templateUrl: './receita.html',
  styleUrl: './receita.scss',
})
export class ReceitaPage implements OnInit {
  private readonly svc = inject(ReceitaService);

  protected readonly receitas = signal<Receita[]>([]);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected editValor = '';

  protected readonly receitaMes = computed(() => {
    const now = new Date();
    return (
      this.receitas().find((r) => {
        const d = new Date(r.data + 'T00:00:00');
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }) ?? null
    );
  });

  protected readonly totalAtual = computed(() => this.receitaMes()?.valor ?? 0);

  protected formatBrl(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  protected formatMoneyInput(value: string, previous = ''): string {
    const normalizedInput = this.normalizeCurrencyTyping(value, previous);
    const hasDecimal = normalizedInput.includes(',');
    const onlyDigits = normalizedInput.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

    if (!onlyDigits) return '';

    if (hasDecimal) {
      const [integerPart, decimalPart = ''] = normalizedInput.split(',');
      const integerDigits = integerPart.replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0';
      return `${this.groupThousands(integerDigits)},${decimalPart.replace(/\D/g, '').padEnd(2, '0').slice(0, 2)}`;
    }

    const integerValue = this.groupThousands(onlyDigits);
    return onlyDigits.length >= 4 ? `${integerValue},00` : integerValue;
  }

  ngOnInit() {
    this.load();
  }

  private load() {
    this.svc.listAll().subscribe((r) => this.receitas.set(r));
  }

  protected openForm() {
    this.editValor = this.totalAtual() > 0 ? this.formatMoneyInput(String(this.totalAtual())) : '';
    this.showForm.set(true);
  }

  protected save() {
    const valor = this.parseMoney(this.editValor);
    if (!valor || valor <= 0) return;
    this.saving.set(true);
    const today = new Date().toISOString().split('T')[0];
    const existing = this.receitaMes();
    const obs = existing
      ? this.svc.atualizar(existing.id, today, valor)
      : this.svc.incluir(today, valor);
    obs.subscribe({
      next: () => {
        this.load();
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  private parseMoney(value: string): number | null {
    const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : null;
  }

  private normalizeCurrencyTyping(value: string, previous: string): string {
    if (previous.endsWith(',00') && value.startsWith(previous) && value.length > previous.length) {
      return `${previous.slice(0, -3)}${value.slice(previous.length)}`;
    }
    return value;
  }

  private groupThousands(value: string): string {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
