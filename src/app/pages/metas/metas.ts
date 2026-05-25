import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DespesaService } from '../despesas/despesas.service';
import { ReceitaService } from '../receita/receita.service';
import { Meta, MetasService } from './metas.service';

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
  imports: [CommonModule],
  templateUrl: './metas.html',
  styleUrl: './metas.scss',
})
export class MetasPage implements OnInit {
  private readonly svc = inject(MetasService);
  private readonly receitaSvc = inject(ReceitaService);
  private readonly despesaSvc = inject(DespesaService);

  protected readonly metaCategorias = META_CATEGORIAS;
  protected readonly metas = signal<Meta[]>([]);
  protected readonly receitaTotal = signal(0);
  protected readonly despesasTotal = signal(0);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly guardandoId = signal<number | null>(null);
  protected formCategoria = 'Viagem';
  protected formValorMeta = '';
  protected formValorInicial = '';
  protected guardandoValor = '';

  protected readonly disponivel = computed(() => this.receitaTotal() - this.despesasTotal());

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

  protected progresso(m: Meta): number {
    if (!m.valorMeta || m.valorMeta <= 0) return 0;
    return Math.min(100, Math.round((m.valor / m.valorMeta) * 1000) / 10);
  }

  protected openForm() {
    this.formCategoria = 'Viagem';
    this.formValorMeta = '';
    this.formValorInicial = '';
    this.showForm.set(true);
  }

  protected adicionar() {
    const valorMeta = this.parseMoney(this.formValorMeta);
    const valor = this.parseMoney(this.formValorInicial) ?? 0;
    if (!valorMeta || valorMeta <= 0) return;

    this.saving.set(true);
    this.svc.incluir(valorMeta, valor, this.formCategoria).subscribe({
      next: () => {
        this.load();
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  protected excluir(id: number) {
    this.svc.excluir(id).subscribe(() => this.load());
  }

  protected openGuardar(id: number) {
    this.guardandoId.set(id);
    this.guardandoValor = '';
  }

  protected guardar(meta: Meta) {
    const add = this.parseMoney(this.guardandoValor);
    if (!add || add <= 0) return;
    this.svc.atualizar(meta.id, meta.valorMeta, meta.valor + add, meta.metaCategoria).subscribe({
      next: () => {
        this.load();
        this.guardandoId.set(null);
      },
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
    this.svc.listAll().subscribe((m) => this.metas.set(m));
    this.receitaSvc.listAll().subscribe((rs) => {
      const now = new Date();
      const rec = rs.find((r) => {
        const d = new Date(r.data + 'T00:00:00');
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      this.receitaTotal.set(rec?.valor ?? 0);
    });
    this.despesaSvc.listAll().subscribe((ds) => {
      this.despesasTotal.set(ds.reduce((s, d) => s + d.valor, 0));
    });
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
}
