import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-shell',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-shell.html',
  styleUrl: './main-shell.scss'
})
export class MainShell {
  private readonly router = inject(Router);

  protected readonly userEmail = signal(sessionStorage.getItem('userEmail') ?? 'usuario');
  protected readonly userName = computed(() => this.userEmail().split('@')[0]?.trim() || 'usuario');

  protected logout(): void {
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userId');
    void this.router.navigateByUrl('/login');
  }
}
