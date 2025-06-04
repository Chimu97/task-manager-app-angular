import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { paths } from '../util';
import { map, take } from 'rxjs/operators';

export const canActivateAuth = (): Promise<boolean | UrlTree> => {
  const service = inject(AuthService);
  const router = inject(Router);
  const toaster = inject(ToastService);

  return new Promise((resolve) => {
    service.setAuthData$.pipe(take(1)).subscribe((authData) => {
      console.log('[Guard] canActivateAuth:', authData);

      if (authData?.isValid) {
        resolve(true);
      } else {
        toaster.info('Login to access other pages');
        resolve(router.parseUrl(paths.login));
      }
    });
  });
};


export const canActivateAuthAdmin = (): Promise<boolean | UrlTree> => {
  const service = inject(AuthService);
  const router = inject(Router);
  const toaster = inject(ToastService);

  return new Promise((resolve) => {
    service.setAuthData$.pipe(take(1)).subscribe((authData) => {
      console.log('[Guard] canActivateAuthAdmin:', authData);

      const isAdmin =
        authData?.decodedToken?.role === 'Admin' ||
        authData?.decodedToken?.roles?.includes('Admin');

      if (authData?.isValid && isAdmin) {
        resolve(true);
      } else {
        toaster.warning('You do not have permission to access this page');
        resolve(router.parseUrl(paths.home));
      }
    });
  });
};


export const canActivateAuthPage = (): Promise<boolean | UrlTree> => {
  const service = inject(AuthService);
  const router = inject(Router);
  const toaster = inject(ToastService);

  return new Promise((resolve) => {
    service.setAuthData$.pipe(take(1)).subscribe((authData) => {
      console.log('[Guard] canActivateAuthPage:', authData);

      if (!authData?.isValid) {
        resolve(true);
      } else {
        toaster.info('You are already logged in! Logout if you want to enter with another account.');
        resolve(router.parseUrl(paths.home));
      }
    });
  });
};

