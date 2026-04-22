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
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]]
  });

  protected submit(): void {
    this.errorMessage.set(null);
    if (this.isSubmitting()) {
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set('Preencha email e senha corretamente.');
      return;
    }

    this.isSubmitting.set(true);
    const { email, senha } = this.form.getRawValue();

    this.loginService
      .login({ email, senha })
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (ok) => {
          if (!ok) {
            this.errorMessage.set('Email ou senha inválidos.');
            return;
          }
          void this.router.navigateByUrl('/painel');
        },
        error: () => {
          this.errorMessage.set(
            'Não foi possível validar o login (rede/CORS/timeout). Verifique a API e tente novamente.'
          );
        }
      });
  }
}
