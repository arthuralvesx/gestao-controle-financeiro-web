import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../../core/api-url';

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
  private readonly base = `${API_BASE_URL}/api/despesa`;

  listAll() { return this.http.get<Despesa[]>(this.base); }
  incluir(nome: string, valor: number, data: string, categoria: string) {
    return this.http.post<Despesa>(this.base, { nome, valor, data, categoria });
  }
  atualizar(id: number, nome: string, valor: number, data: string, categoria: string) {
    return this.http.put<Despesa>(`${this.base}/${id}`, { nome, valor, data, categoria });
  }
  excluir(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }
}
