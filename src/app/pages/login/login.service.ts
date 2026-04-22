import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';

export type LoginRequest = {
  email: string;
  senha: string;
};

@Injectable()
export class LoginService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://localhost:8080';

  login(payload: LoginRequest) {
    return this.http
      .post<boolean>(`${this.baseUrl}/api/usuario/login`, payload)
      .pipe(map((v) => !!v));
  }
}
