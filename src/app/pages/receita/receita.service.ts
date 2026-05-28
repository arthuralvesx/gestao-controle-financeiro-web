import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface Receita {
  id: number;
  data: string;
  valor: number;
}

@Injectable({ providedIn: 'root' })
export class ReceitaService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://gestao-controle-financeiro-api-production.up.railway.app/api/receita';

  listAll() { return this.http.get<Receita[]>(this.base); }
  incluir(data: string, valor: number) { return this.http.post<Receita>(this.base, { data, valor }); }
  atualizar(id: number, data: string, valor: number) { return this.http.put<Receita>(`${this.base}/${id}`, { data, valor }); }
  excluir(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }
}
