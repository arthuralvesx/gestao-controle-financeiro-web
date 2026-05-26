import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriaResumo, DashboardResumo, DashboardService, MesResumo } from './dashboard.service';

const ICON_BY_CATEGORY: Record<string, string> = {
  alimentacao: 'utensils',
  transporte: 'car',
  saude: 'heart',
  lazer: 'smile',
  educacao: 'book',
  casa: 'home',
  compras: 'cart',
  financas: 'card',
  viagem: 'plane',
  tecnologia: 'monitor',
  energia: 'bolt',
  cafe: 'coffee',
  musica: 'music',
  roupas: 'shirt',
  manutencao: 'tool',
  streaming: 'tv',
  presente: 'gift',
  outros: 'more',
};

const CHART_COLORS = ['#10b981', '#60a5fa', '#f59e0b', '#f87171', '#a78bfa', '#22d3ee'];

@Component({
  selector: 'app-painel-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './painel.html',
  styleUrl: './painel.scss',
})
export class PainelPage implements OnInit {
  private readonly dashboardSvc = inject(DashboardService);

  protected readonly userEmail = signal('');
  protected readonly userName = computed(() => this.firstName(this.userEmail()));
  protected readonly dashboard = signal<DashboardResumo | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly viewDate = signal(this.startOfMonth(new Date()));

  protected readonly selectedMonthKey = computed(() => this.toMonthKey(this.viewDate()));
  protected readonly selectedMonth = computed(() => this.findMonth(this.selectedMonthKey()));
  protected readonly receitas = computed(() => this.selectedMonth()?.receitas ?? 0);
  protected readonly despesas = computed(() => this.selectedMonth()?.despesas ?? 0);
  protected readonly guardadoMetas = computed(() => this.selectedMonth()?.guardadoMetas ?? this.dashboard()?.totalGuardadoMetas ?? 0);
  protected readonly disponivel = computed(() => this.selectedMonth()?.saldo ?? this.dashboard()?.saldoTotal ?? 0);
  protected readonly monthTitle = computed(() => this.formatMonthTitle(this.viewDate()));
  protected readonly isCurrentMonth = computed(() => this.isSameMonth(this.viewDate(), new Date()));
  protected readonly despesasPorCat = computed(() => this.selectedMonth()?.categorias ?? []);
  protected readonly mesMaisGasto = computed(() => this.dashboard()?.mesMaisGasto ?? null);
  protected readonly principalCategoria = computed(() => this.mesMaisGasto()?.categorias[0] ?? null);
  protected readonly hasHistoricalData = computed(() => (this.dashboard()?.meses.length ?? 0) > 0);
  protected readonly barChartMonths = computed(() => {
    const meses = [...(this.dashboard()?.meses ?? [])].sort((a, b) => a.mes.localeCompare(b.mes));
    return meses.slice(Math.max(0, meses.length - 6));
  });
  protected readonly maxMonthlyExpense = computed(() =>
    Math.max(1, ...this.barChartMonths().map((mes) => mes.despesas)),
  );
  protected readonly donutGradient = computed(() => this.buildDonutGradient(this.despesasPorCat()));
  protected readonly despesaPercentReceita = computed(() => {
    const r = this.receitas();
    if (r <= 0) return 0;
    return Math.min(100, Math.round((this.despesas() / r) * 1000) / 10);
  });
  protected readonly guardadoPercentReceita = computed(() => {
    const r = this.receitas();
    if (r <= 0) return 0;
    return Math.min(100, Math.round((this.guardadoMetas() / r) * 1000) / 10);
  });

  ngOnInit() {
    this.userEmail.set(sessionStorage.getItem('userEmail') ?? '');
    this.loadData();
  }

  protected formatBrl(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected getCatIcon(cat: string): string {
    const normalized = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const key = normalized.replace(/[^a-zA-Z]/g, '').toLowerCase();
    return ICON_BY_CATEGORY[key] ?? 'more';
  }

  protected formatCategoryLabel(cat: string): string {
    const normalized = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const key = normalized.replace(/[^a-zA-Z]/g, '').toLowerCase();
    const labels: Record<string, string> = {
      alimentacao: 'Alimentação',
      transporte: 'Transporte',
      saude: 'Saúde',
      lazer: 'Lazer',
      educacao: 'Educação',
      casa: 'Casa',
      compras: 'Compras',
      financas: 'Finanças',
      viagem: 'Viagem',
      tecnologia: 'Tecnologia',
      energia: 'Energia',
      cafe: 'Café',
      musica: 'Música',
      roupas: 'Roupas',
      manutencao: 'Manutenção',
      streaming: 'Streaming',
      presente: 'Presente',
      outros: 'Outros',
    };

    return labels[key] ?? cat;
  }

  protected previousMonth(): void {
    this.viewDate.update((d) => this.addMonths(d, -1));
  }

  protected nextMonth(): void {
    this.viewDate.update((d) => this.addMonths(d, 1));
  }

  protected reload(): void {
    this.loadData();
  }

  protected formatMonthKey(key: string | null | undefined): string {
    if (!key) return 'Sem dados';
    const [year, month] = key.split('-').map(Number);
    return this.formatMonthTitle(new Date(year, month - 1, 1));
  }

  protected trackCategoria(index: number, item: CategoriaResumo): string {
    return `${item.categoria}-${index}`;
  }

  protected barHeight(mes: MesResumo): number {
    return Math.max(6, Math.round((mes.despesas / this.maxMonthlyExpense()) * 100));
  }

  protected categoryColor(index: number): string {
    return CHART_COLORS[index % CHART_COLORS.length];
  }

  private loadData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardSvc.resumo().subscribe({
      next: (resumo) => {
        this.dashboard.set(resumo);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar o painel. Verifique se a API está ativa.');
        this.isLoading.set(false);
      },
    });
  }

  private findMonth(key: string): MesResumo | null {
    return this.dashboard()?.meses.find((mes) => mes.mes === key) ?? null;
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

  private toMonthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private firstName(email: string): string {
    const name = email.split('@')[0]?.trim();
    return name || 'usuário';
  }

  private buildDonutGradient(categorias: CategoriaResumo[]): string {
    if (categorias.length === 0) {
      return 'conic-gradient(rgba(255,255,255,0.08) 0 100%)';
    }

    let start = 0;
    const parts = categorias.map((categoria, index) => {
      const end = start + categoria.percentual;
      const segment = `${this.categoryColor(index)} ${start}% ${end}%`;
      start = end;
      return segment;
    });

    return `conic-gradient(${parts.join(', ')})`;
  }
}
