import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ReceitaService } from '../receita/receita.service';
import { Despesa, DespesaService } from './despesas.service';

const CATEGORIAS = [
  { id: 'Alimentacao', label: 'Alimentacao', icon: 'utensils' },
  { id: 'Transporte', label: 'Transporte', icon: 'car' },
  { id: 'Saude', label: 'Saude', icon: 'heart' },
  { id: 'Lazer', label: 'Lazer', icon: 'smile' },
  { id: 'Educacao', label: 'Educacao', icon: 'book' },
  { id: 'Casa', label: 'Casa', icon: 'home' },
  { id: 'Compras', label: 'Compras', icon: 'cart' },
  { id: 'Financas', label: 'Financas', icon: 'card' },
  { id: 'Viagem', label: 'Viagem', icon: 'plane' },
  { id: 'Tecnologia', label: 'Tecnologia', icon: 'monitor' },
  { id: 'Energia', label: 'Energia', icon: 'bolt' },
  { id: 'Cafe', label: 'Cafe', icon: 'coffee' },
  { id: 'Musica', label: 'Musica', icon: 'music' },
  { id: 'Roupas', label: 'Roupas', icon: 'shirt' },
  { id: 'Manutencao', label: 'Manutencao', icon: 'tool' },
  { id: 'Streaming', label: 'Streaming', icon: 'tv' },
  { id: 'Presente', label: 'Presente', icon: 'gift' },
  { id: 'Outros', label: 'Outros', icon: 'more' },
];

const ICON_BY_CATEGORY = new Map(CATEGORIAS.map((cat) => [cat.id, cat.icon]));
const PAGE_SIZE = 7;

@Component({
  selector: 'app-despesas-page',
  imports: [CommonModule],
  templateUrl: './despesas.html',
  styleUrl: './despesas.scss',
})
export class DespesasPage implements OnInit {
  private readonly svc = inject(DespesaService);
  private readonly receitaSvc = inject(ReceitaService);

  protected readonly categorias = CATEGORIAS;
  protected readonly despesas = signal<Despesa[]>([]);
  protected readonly receitaTotal = signal(0);
  protected readonly showModal = signal(false);
  protected readonly saving = signal(false);
  protected readonly page = signal(1);
  protected formNome = '';
  protected formValor = '';
  protected formCategoria = 'Outros';

  protected readonly totalGasto = computed(() =>
    this.despesas().reduce((s, d) => s + d.valor, 0),
  );
  protected readonly sobra = computed(() => this.receitaTotal() - this.totalGasto());
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.despesas().length / PAGE_SIZE)),
  );
  protected readonly paginatedDespesas = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.despesas().slice(start, start + PAGE_SIZE);
  });
  protected readonly pageStart = computed(() =>
    this.despesas().length === 0 ? 0 : (this.page() - 1) * PAGE_SIZE + 1,
  );
  protected readonly pageEnd = computed(() =>
    Math.min(this.page() * PAGE_SIZE, this.despesas().length),
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

  protected openModal() {
    this.formNome = '';
    this.formValor = '';
    this.formCategoria = 'Outros';
    this.showModal.set(true);
  }

  protected registrar() {
    const valor = this.parseMoney(this.formValor);
    if (!this.formNome.trim() || !valor || valor <= 0) return;

    this.saving.set(true);
    const today = new Date().toISOString().split('T')[0];
    this.svc.incluir(this.formNome.trim(), valor, today, this.formCategoria).subscribe({
      next: () => {
        this.showModal.set(false);
        this.saving.set(false);
        this.page.set(1);
        this.load();
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

  protected excluir(id: number) {
    this.svc.excluir(id).subscribe(() => this.load());
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
    const now = new Date();
    forkJoin({
      despesas: this.svc.listAll(),
      receitas: this.receitaSvc.listAll(),
    }).subscribe(({ despesas, receitas }) => {
      this.despesas.set(despesas);
      this.normalizePage();
      const rec = receitas.find((r) => {
        const d = new Date(r.data + 'T00:00:00');
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      this.receitaTotal.set(rec?.valor ?? 0);
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
}
