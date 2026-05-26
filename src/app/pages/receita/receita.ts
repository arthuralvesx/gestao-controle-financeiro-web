import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrlCurrencyDirective } from '../../shared/directives/brl-currency.directive';
import { ToastService } from '../../shared/ux/toast.service';
import { Receita, ReceitaService } from './receita.service';

@Component({
  selector: 'app-receita-page',
  imports: [CommonModule, FormsModule, BrlCurrencyDirective],
  templateUrl: './receita.html',
  styleUrl: './receita.scss',
})
export class ReceitaPage implements OnInit {
  private readonly svc = inject(ReceitaService);
  private readonly toast = inject(ToastService);

  protected readonly receitas = signal<Receita[]>([]);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected editValor: number | null = null;
  protected valorError = '';

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

  ngOnInit() {
    this.load();
  }

  private load() {
    this.svc.listAll().subscribe((r) => this.receitas.set(r));
  }

  protected openForm() {
    this.editValor = this.totalAtual() > 0 ? this.totalAtual() : null;
    this.valorError = '';
    this.showForm.set(true);
  }

  protected save() {
    const valor = this.editValor;
    if (!valor || valor <= 0) {
      this.valorError = 'Informe uma receita maior que zero.';
      return;
    }
    this.saving.set(true);
    this.valorError = '';
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
        this.toast.success('Receita salva com sucesso.');
      },
      error: (err) => {
        this.toast.fromApiError(err, 'Não foi possível salvar a receita.');
        this.saving.set(false);
      },
    });
  }
}
