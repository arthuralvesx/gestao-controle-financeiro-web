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

  ngOnInit() {
    this.load();
  }

  private load() {
    this.svc.listAll().subscribe((r) => this.receitas.set(r));
  }

  protected openForm() {
    this.editValor = this.totalAtual() > 0 ? String(this.totalAtual()) : '';
    this.showForm.set(true);
  }

  protected save() {
    const valor = parseFloat(this.editValor.replace(',', '.'));
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
}
