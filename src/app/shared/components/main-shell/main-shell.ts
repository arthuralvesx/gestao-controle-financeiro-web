import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-shell',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-shell.html',
  styleUrl: './main-shell.scss'
})
export class MainShell {
  private readonly router = inject(Router);

  /** Em etapas futuras: vir de autenticação / serviço de sessão */
  protected readonly userEmail = signal('teste@teste.com');

  protected logout(): void {
    void this.router.navigateByUrl('/login');
  }
}
