import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage) },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/main-shell/main-shell').then((m) => m.MainShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'painel' },
      {
        path: 'painel',
        loadComponent: () => import('./pages/painel/painel').then((m) => m.PainelPage)
      },
      {
        path: 'receita',
        loadComponent: () => import('./pages/receita/receita').then((m) => m.ReceitaPage)
      },
      {
        path: 'despesas',
        loadComponent: () => import('./pages/despesas/despesas').then((m) => m.DespesasPage)
      },
      {
        path: 'metas',
        loadComponent: () => import('./pages/metas/metas').then((m) => m.MetasPage)
      },
      {
        path: 'ia',
        loadComponent: () => import('./pages/ia/ia').then((m) => m.IaPage)
      }
    ]
  }
];
