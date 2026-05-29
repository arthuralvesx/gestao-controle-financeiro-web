import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../../core/api-url';

export interface CategoriaResumo {
  categoria: string;
  total: number;
  percentual: number;
}

export interface MesResumo {
  mes: string;
  receitas: number;
  despesas: number;
  guardadoMetas: number;
  saldo: number;
  categorias: CategoriaResumo[];
}

export interface DashboardResumo {
  totalReceitas: number;
  totalDespesas: number;
  totalGuardadoMetas: number;
  saldoTotal: number;
  mesMaisGasto: MesResumo | null;
  meses: MesResumo[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/api/dashboard`;

  resumo() {
    return this.http.get<DashboardResumo>(this.base);
  }
}
