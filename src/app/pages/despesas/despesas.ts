import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BrlCurrencyDirective } from '../../shared/directives/brl-currency.directive';
import { ConfirmDialogComponent } from '../../shared/ux/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/ux/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ux/loading-skeleton.component';
import { ToastService } from '../../shared/ux/toast.service';
import { DashboardService } from '../painel/dashboard.service';
import { Despesa, DespesaService } from './despesas.service';

const CATEGORIAS = [
  { id: 'Alimentacao', label: 'Alimentação', icon: 'utensils' },
  { id: 'Transporte', label: 'Transporte', icon: 'car' },
  { id: 'Saude', label: 'Saúde', icon: 'heart' },
  { id: 'Lazer', label: 'Lazer', icon: 'smile' },
  { id: 'Educacao', label: 'Educação', icon: 'book' },
  { id: 'Casa', label: 'Casa', icon: 'home' },
  { id: 'Compras', label: 'Compras', icon: 'cart' },
  { id: 'Financas', label: 'Finanças', icon: 'card' },
  { id: 'Viagem', label: 'Viagem', icon: 'plane' },
  { id: 'Tecnologia', label: 'Tecnologia', icon: 'monitor' },
  { id: 'Energia', label: 'Energia', icon: 'bolt' },
  { id: 'Cafe', label: 'Café', icon: 'coffee' },
  { id: 'Musica', label: 'Música', icon: 'music' },
  { id: 'Roupas', label: 'Roupas', icon: 'shirt' },
  { id: 'Manutencao', label: 'Manutenção', icon: 'tool' },
  { id: 'Streaming', label: 'Streaming', icon: 'tv' },
  { id: 'Presente', label: 'Presente', icon: 'gift' },
  { id: 'Outros', label: 'Outros', icon: 'more' },
];

const ICON_BY_CATEGORY = new Map(CATEGORIAS.map((cat) => [cat.id, cat.icon]));
const PAGE_SIZE = 7;

@Component({
  selector: 'app-despesas-page',
  imports: [CommonModule, FormsModule, BrlCurrencyDirective, ConfirmDialogComponent, EmptyStateComponent, LoadingSkeletonComponent],
  templateUrl: './despesas.html',
  styleUrl: './despesas.scss',
})
export class DespesasPage implements OnInit {
  private readonly svc = inject(DespesaService);
  private readonly dashboardSvc = inject(DashboardService);
  private readonly toast = inject(ToastService);

  protected readonly categorias = CATEGORIAS;
  protected readonly despesas = signal<Despesa[]>([]);
  protected readonly disponivelTotal = signal(0);
  protected readonly showModal = signal(false);
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected readonly confirmingDelete = signal<Despesa | null>(null);
  protected readonly editingDespesa = signal<Despesa | null>(null);
  protected searchTerm = '';
  protected formNome = '';
  protected formValor: number | null = null;
  protected formCategoria = 'Outros';
  protected nomeError = '';
  protected valorError = '';

  protected readonly totalGasto = computed(() =>
    this.despesas().reduce((s, d) => s + d.valor, 0),
  );
  protected readonly sobra = computed(() => this.disponivelTotal());
  protected readonly filteredDespesas = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.despesas();
    return this.despesas().filter((d) =>
      d.nome.toLowerCase().includes(term) || this.formatCategoryLabel(d.categoria).toLowerCase().includes(term),
    );
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredDespesas().length / PAGE_SIZE)),
  );
  protected readonly paginatedDespesas = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filteredDespesas().slice(start, start + PAGE_SIZE);
  });
  protected readonly pageStart = computed(() =>
    this.filteredDespesas().length === 0 ? 0 : (this.page() - 1) * PAGE_SIZE + 1,
  );
  protected readonly pageEnd = computed(() =>
    Math.min(this.page() * PAGE_SIZE, this.filteredDespesas().length),
  );
  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  ngOnInit() {
    this.load();
  }

  protected formatBrl(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  protected openModal() {
    this.editingDespesa.set(null);
    this.formNome = '';
    this.formValor = null;
    this.formCategoria = 'Outros';
    this.clearErrors();
    this.showModal.set(true);
  }

  protected openEdit(despesa: Despesa) {
    this.editingDespesa.set(despesa);
    this.formNome = despesa.nome;
    this.formValor = despesa.valor;
    this.formCategoria = this.normalizeCategory(despesa.categoria);
    this.clearErrors();
    this.showModal.set(true);
  }

  protected registrar() {
    const valor = this.formValor;
    if (!this.validateForm()) return;

    this.saving.set(true);
    const today = new Date().toISOString().split('T')[0];
    const editing = this.editingDespesa();
    const request = editing
      ? this.svc.atualizar(editing.id, this.formNome.trim(), valor!, editing.data ?? today, this.formCategoria)
      : this.svc.incluir(this.formNome.trim(), valor!, today, this.formCategoria);

    request.subscribe({
      next: () => {
        this.showModal.set(false);
        this.saving.set(false);
        this.page.set(1);
        this.load();
        this.toast.success(editing ? 'Despesa atualizada com sucesso.' : 'Despesa registrada com sucesso.');
      },
      error: (err) => {
        this.toast.fromApiError(err, 'Não foi possível salvar a despesa.');
        this.saving.set(false);
      },
    });
  }

  protected excluir(id: number) {
    const despesa = this.despesas().find((d) => d.id === id) ?? null;
    this.confirmingDelete.set(despesa);
  }

  protected confirmDelete() {
    const despesa = this.confirmingDelete();
    if (!despesa) return;

    this.svc.excluir(despesa.id).subscribe({
      next: () => {
        this.confirmingDelete.set(null);
        this.load();
        this.toast.success('Despesa excluída.', {
          label: 'DESFAZER',
          handler: () => {
            this.svc.incluir(despesa.nome, despesa.valor, despesa.data, despesa.categoria).subscribe(() => {
              this.load();
              this.toast.success('Despesa restaurada.');
            });
          },
        });
      },
      error: (err) => this.toast.fromApiError(err, 'Não foi possível excluir a despesa.'),
    });
  }

  protected previousPage(): void {
    this.page.update((value) => Math.max(1, value - 1));
  }

  protected nextPage(): void {
    this.page.update((value) => Math.min(this.totalPages(), value + 1));
  }

  protected goToPage(page: number): void {
    this.page.set(page);
  }

  protected getIcon(cat: string): string {
    return ICON_BY_CATEGORY.get(this.normalizeCategory(cat)) ?? 'more';
  }

  protected setCategoria(id: string) {
    this.formCategoria = id;
  }

  private load() {
    this.loading.set(true);
    const now = new Date();
    forkJoin({
      despesas: this.svc.listAll(),
      dashboard: this.dashboardSvc.resumo(),
    }).subscribe(({ despesas, dashboard }) => {
      this.despesas.set(despesas);
      this.normalizePage();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      this.disponivelTotal.set(dashboard.meses.find((mes) => mes.mes === key)?.saldo ?? dashboard.saldoTotal);
      this.loading.set(false);
    });
  }

  private normalizePage(): void {
    if (this.page() > this.totalPages()) {
      this.page.set(this.totalPages());
    }
  }

  private normalizeCategory(value: string): string {
    const key = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z]/g, '')
      .toLowerCase();

    const aliases: Record<string, string> = {
      alimentacao: 'Alimentacao',
      transporte: 'Transporte',
      saude: 'Saude',
      lazer: 'Lazer',
      educacao: 'Educacao',
      casa: 'Casa',
      compras: 'Compras',
      financas: 'Financas',
      viagem: 'Viagem',
      tecnologia: 'Tecnologia',
      energia: 'Energia',
      cafe: 'Cafe',
      musica: 'Musica',
      roupas: 'Roupas',
      manutencao: 'Manutencao',
      streaming: 'Streaming',
      presente: 'Presente',
      outros: 'Outros',
    };

    return aliases[key] ?? 'Outros';
  }

  protected formatCategoryLabel(cat: string): string {
    return CATEGORIAS.find((c) => c.id === this.normalizeCategory(cat))?.label ?? cat;
  }

  protected isFormInvalid(): boolean {
    return !this.formNome.trim() || !this.formValor || this.formValor <= 0;
  }

  private validateForm(): boolean {
    this.clearErrors();
    if (!this.formNome.trim()) {
      this.nomeError = 'Informe o nome da despesa.';
    }
    if (!this.formValor || this.formValor <= 0) {
      this.valorError = 'Informe um valor maior que zero.';
    }
    return !this.nomeError && !this.valorError;
  }

  private clearErrors() {
    this.nomeError = '';
    this.valorError = '';
  }
}
