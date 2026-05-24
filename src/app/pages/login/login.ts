import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';

import { LoginService } from './login.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule],
  providers: [LoginService],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly isRegisterMode = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected submit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.isSubmitting()) {
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set('Informe um email valido e uma senha com pelo menos 6 caracteres.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.form.getRawValue();

    if (this.isRegisterMode()) {
      this.loginService
        .cadastrar(payload)
        .pipe(
          timeout({ first: 15000 }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe({
          next: () => {
            this.successMessage.set('Conta criada. Agora voce ja pode entrar.');
            this.isRegisterMode.set(false);
          },
          error: (err) => {
            this.errorMessage.set(err?.status === 409 ? 'Este email ja esta cadastrado.' : 'Nao foi possivel criar a conta.');
          }
        });
      return;
    }

    this.loginService
      .login(payload)
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (res) => {
          if (!res.autenticado) {
            this.errorMessage.set(res.mensagem || 'Email ou senha invalidos.');
            return;
          }
          sessionStorage.setItem('userEmail', res.email ?? payload.email);
          if (res.usuarioId) {
            sessionStorage.setItem('userId', String(res.usuarioId));
          }
          void this.router.navigateByUrl('/painel');
        },
        error: () => {
          this.errorMessage.set('Nao foi possivel validar o login. Verifique se a API esta ativa.');
        }
      });
  }

  protected toggleMode(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isRegisterMode.update((value) => !value);
  }
}
