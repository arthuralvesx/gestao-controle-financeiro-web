import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface CategoriaResumo {
  categoria: string;
  total: number;
  percentual: number;
}

export interface MesResumo {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
  categorias: CategoriaResumo[];
}

export interface DashboardResumo {
  totalReceitas: number;
  totalDespesas: number;
  saldoTotal: number;
  mesMaisGasto: MesResumo | null;
  meses: MesResumo[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://gestao-controle-financeiro-api-production.up.railway.app/api/dashboard';

  resumo() {
    return this.http.get<DashboardResumo>(this.base);
  }
}
