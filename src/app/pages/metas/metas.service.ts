import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../../core/api-url';

export interface Meta {
  id: number;
  valorMeta: number;
  valor: number;
  metaCategoria: string;
}

export interface MovimentacaoMeta {
  id: number;
  metaId: number;
  tipo: 'ENTRADA' | 'SAIDA';
  valor: number;
  data: string;
  descricao: string;
}

@Injectable({ providedIn: 'root' })
export class MetasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/api/metas`;

  listAll() { return this.http.get<Meta[]>(this.base); }
  incluir(valorMeta: number, valor: number, metaCategoria: string) {
    return this.http.post<Meta>(this.base, { valorMeta, valor, metaCategoria });
  }
  atualizar(id: number, valorMeta: number, valor: number, metaCategoria: string) {
    return this.http.put<Meta>(`${this.base}/${id}`, { valorMeta, valor, metaCategoria });
  }
  guardar(id: number, valor: number, descricao = 'Dinheiro guardado') {
    return this.http.post<Meta>(`${this.base}/${id}/entradas`, { valor, descricao });
  }
  retirar(id: number, valor: number, descricao = 'Dinheiro retirado') {
    return this.http.post<Meta>(`${this.base}/${id}/saidas`, { valor, descricao });
  }
  movimentacoes(id: number) {
    return this.http.get<MovimentacaoMeta[]>(`${this.base}/${id}/movimentacoes`);
  }
  excluir(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }
}
