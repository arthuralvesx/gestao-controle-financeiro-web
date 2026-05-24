import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  if (sessionStorage.getItem('userEmail')) {
    return true;
  }

  return inject(Router).createUrlTree(['/login']);
};
