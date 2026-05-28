import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface Meta {
  id: number;
  valorMeta: number;
  valor: number;
  metaCategoria: string;
}

@Injectable({ providedIn: 'root' })
export class MetasService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://gestao-controle-financeiro-api-production.up.railway.app/api/metas';

  listAll() { return this.http.get<Meta[]>(this.base); }
  incluir(valorMeta: number, valor: number, metaCategoria: string) {
    return this.http.post<Meta>(this.base, { valorMeta, valor, metaCategoria });
  }
  atualizar(id: number, valorMeta: number, valor: number, metaCategoria: string) {
    return this.http.put<Meta>(`${this.base}/${id}`, { valorMeta, valor, metaCategoria });
  }
  excluir(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }
}
