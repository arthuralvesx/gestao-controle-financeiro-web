import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export type LoginRequest = {
  email: string;
  senha: string;
};

export type AuthResponse = {
  autenticado: boolean;
  usuarioId: number | null;
  email: string | null;
  mensagem: string;
};

@Injectable()
export class LoginService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'https://gestao-controle-financeiro-api-production.up.railway.app';

  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/api/usuario/login`, payload);
  }

  cadastrar(payload: LoginRequest) {
    return this.http.post(`${this.baseUrl}/api/usuario`, payload);
  }
}
