import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrlCurrencyDirective } from '../../shared/directives/brl-currency.directive';
import { ConfirmDialogComponent } from '../../shared/ux/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/ux/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ux/loading-skeleton.component';
import { ToastService } from '../../shared/ux/toast.service';
import { DashboardService } from '../painel/dashboard.service';
import { Meta, MetasService, MovimentacaoMeta } from './metas.service';

const META_CATEGORIAS = [
  { id: 'Viagem', label: 'Viagem', icon: 'plane' },
  { id: 'Casa propria', label: 'Casa própria', icon: 'home' },
  { id: 'Carro', label: 'Carro', icon: 'car' },
  { id: 'Investimento', label: 'Investimento', icon: 'trend' },
  { id: 'Educacao', label: 'Educação', icon: 'book' },
  { id: 'Presente', label: 'Presente', icon: 'gift' },
];

const ICON_BY_META = new Map(META_CATEGORIAS.map((cat) => [cat.id, cat.icon]));

@Component({
  selector: 'app-metas-page',
  imports: [CommonModule, FormsModule, BrlCurrencyDirective, ConfirmDialogComponent, EmptyStateComponent, LoadingSkeletonComponent],
  templateUrl: './metas.html',
  styleUrl: './metas.scss',
})
export class MetasPage implements OnInit {
  private readonly svc = inject(MetasService);
  private readonly dashboardSvc = inject(DashboardService);
  private readonly toast = inject(ToastService);

  protected readonly metaCategorias = META_CATEGORIAS;
  protected readonly metas = signal<Meta[]>([]);
  protected readonly movimentacoes = signal<MovimentacaoMeta[]>([]);
  protected readonly saldoDisponivel = signal(0);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly guardandoId = signal<number | null>(null);
  protected readonly retirandoId = signal<number | null>(null);
  protected readonly editingMeta = signal<Meta | null>(null);
  protected readonly confirmingDelete = signal<Meta | null>(null);
  protected readonly historicoId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected formCategoria = 'Viagem';
  protected formValorMeta: number | null = null;
  protected formValorInicial: number | null = null;
  protected guardandoValor: number | null = null;
  protected retirandoValor: number | null = null;
  protected valorMetaError = '';
  protected valorInicialError = '';
  protected movimentoError = '';

  protected readonly disponivel = computed(() => this.saldoDisponivel());

  ngOnInit() {
    this.load();
  }

  protected formatBrl(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  protected progresso(m: Meta): number {
    if (!m.valorMeta || m.valorMeta <= 0) return 0;
    return Math.min(100, Math.round((m.valor / m.valorMeta) * 1000) / 10);
  }

  protected openForm() {
    this.editingMeta.set(null);
    this.formCategoria = 'Viagem';
    this.formValorMeta = null;
    this.formValorInicial = null;
    this.errorMessage.set(null);
    this.clearFormErrors();
    this.showForm.set(true);
  }

  protected openEdit(meta: Meta) {
    this.editingMeta.set(meta);
    this.formCategoria = this.normalizeCategory(meta.metaCategoria);
    this.formValorMeta = meta.valorMeta;
    this.formValorInicial = meta.valor;
    this.errorMessage.set(null);
    this.clearFormErrors();
    this.showForm.set(true);
  }

  protected adicionar() {
    const valorMeta = this.formValorMeta;
    const valor = this.formValorInicial ?? 0;
    if (!this.validateForm()) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    const editing = this.editingMeta();
    const request = editing
      ? this.svc.atualizar(editing.id, valorMeta!, editing.valor, this.formCategoria)
      : this.svc.incluir(valorMeta!, valor, this.formCategoria);

    request.subscribe({
      next: () => {
        this.load();
        this.showForm.set(false);
        this.saving.set(false);
        this.toast.success(editing ? 'Meta atualizada.' : 'Meta criada com sucesso.');
      },
      error: (err) => {
        this.toast.fromApiError(err, editing ? 'Não foi possível atualizar a meta.' : 'Não foi possível criar a meta.');
        this.saving.set(false);
      },
    });
  }

  protected excluir(id: number) {
    this.confirmingDelete.set(this.metas().find((m) => m.id === id) ?? null);
  }

  protected confirmDelete() {
    const meta = this.confirmingDelete();
    if (!meta) return;

    this.svc.excluir(meta.id).subscribe({
      next: () => {
        this.confirmingDelete.set(null);
        this.load();
        this.toast.success('Meta excluída. O valor guardado voltou ao disponível.');
      },
      error: (err) => this.toast.fromApiError(err, 'Não foi possível excluir a meta.'),
    });
  }

  protected openGuardar(id: number) {
    this.guardandoId.set(id);
    this.retirandoId.set(null);
    this.guardandoValor = null;
    this.movimentoError = '';
    this.errorMessage.set(null);
  }

  protected openRetirar(id: number) {
    this.retirandoId.set(id);
    this.guardandoId.set(null);
    this.retirandoValor = null;
    this.movimentoError = '';
    this.errorMessage.set(null);
  }

  protected guardar(meta: Meta) {
    const add = this.guardandoValor;
    if (!add || add <= 0) {
      this.movimentoError = 'Informe um valor maior que zero para guardar.';
      return;
    }

    if (add > this.disponivel()) {
      this.movimentoError = 'Valor maior que o saldo disponível.';
      return;
    }

    this.errorMessage.set(null);
    this.movimentoError = '';
    this.svc.guardar(meta.id, add).subscribe({
      next: () => {
        this.load();
        this.guardandoId.set(null);
        this.toast.success(`${this.formatBrl(add)} guardados na meta.`);
      },
      error: (err) => {
        this.toast.fromApiError(err, 'Não foi possível guardar esse valor.');
      },
    });
  }

  protected retirar(meta: Meta) {
    const value = this.retirandoValor;
    if (!value || value <= 0) {
      this.movimentoError = 'Informe um valor maior que zero para retirar.';
      return;
    }
    if (value > meta.valor) {
      this.movimentoError = 'O valor de saída não pode ser maior que o guardado.';
      return;
    }

    this.movimentoError = '';
    this.svc.retirar(meta.id, value).subscribe({
      next: () => {
        this.load();
        this.retirandoId.set(null);
        this.toast.success(`${this.formatBrl(value)} retirados da meta.`);
      },
      error: (err) => {
        this.toast.fromApiError(err, 'Não foi possível retirar esse valor.');
      },
    });
  }

  protected getIcon(cat: string): string {
    return ICON_BY_META.get(this.normalizeCategory(cat)) ?? 'target';
  }

  protected formatMetaLabel(cat: string): string {
    const labels: Record<string, string> = {
      Viagem: 'Viagem',
      'Casa propria': 'Casa própria',
      Carro: 'Carro',
      Investimento: 'Investimento',
      Educacao: 'Educação',
      Presente: 'Presente',
    };

    return labels[this.normalizeCategory(cat)] ?? cat;
  }

  protected setCategoria(id: string) {
    this.formCategoria = id;
  }

  private load() {
    this.loading.set(true);
    this.svc.listAll().subscribe({
      next: (m) => {
        this.metas.set(m);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.fromApiError(err, 'Não foi possível carregar as metas.');
        this.loading.set(false);
      },
    });
    this.dashboardSvc.resumo().subscribe((resumo) => this.saldoDisponivel.set(resumo.saldoTotal));
  }

  protected loadHistorico(meta: Meta) {
    this.historicoId.set(this.historicoId() === meta.id ? null : meta.id);
    this.movimentacoes.set([]);
    if (this.historicoId() === meta.id) {
      this.svc.movimentacoes(meta.id).subscribe({
        next: (items) => this.movimentacoes.set(items),
        error: (err) => this.toast.fromApiError(err, 'Não foi possível carregar o histórico.'),
      });
    }
  }

  private normalizeCategory(value: string): string {
    const key = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z]/g, '')
      .toLowerCase();

    const aliases: Record<string, string> = {
      viagem: 'Viagem',
      casapropria: 'Casa propria',
      carro: 'Carro',
      investimento: 'Investimento',
      educacao: 'Educacao',
      presente: 'Presente',
    };

    return aliases[key] ?? 'Viagem';
  }

  protected restante(m: Meta): number {
    return Math.max(0, m.valorMeta - m.valor);
  }

  protected isFormInvalid(): boolean {
    return !this.formValorMeta || this.formValorMeta <= 0 || (this.formValorInicial ?? 0) < 0;
  }

  private validateForm(): boolean {
    this.clearFormErrors();
    if (!this.formValorMeta || this.formValorMeta <= 0) {
      this.valorMetaError = 'Informe uma meta maior que zero.';
    }
    if ((this.formValorInicial ?? 0) < 0) {
      this.valorInicialError = 'O valor inicial não pode ser negativo.';
    }
    if (!this.editingMeta() && (this.formValorInicial ?? 0) > this.disponivel()) {
      this.valorInicialError = 'Valor inicial maior que o saldo disponível.';
    }
    return !this.valorMetaError && !this.valorInicialError;
  }

  private clearFormErrors() {
    this.valorMetaError = '';
    this.valorInicialError = '';
    this.movimentoError = '';
  }
}
