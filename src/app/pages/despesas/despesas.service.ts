import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface Despesa {
  id: number;
  nome: string;
  valor: number;
  data: string;
  categoria: string;
}

@Injectable({ providedIn: 'root' })
export class DespesaService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://gestao-controle-financeiro-api-production.up.railway.app/api/despesa';

  listAll() { return this.http.get<Despesa[]>(this.base); }
  incluir(nome: string, valor: number, data: string, categoria: string) {
    return this.http.post<Despesa>(this.base, { nome, valor, data, categoria });
  }
  excluir(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }
}
