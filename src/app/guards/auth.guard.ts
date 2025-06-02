import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { paths } from '../util';
import { ToastService } from '../services/toast.service';

// ✅ Guard para usuarios autenticados
export const canActivateAuth = async (
  service = inject(AuthService)
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const toaster = inject(ToastService);

  service.retrieveTokenFromStore();

  if (service.isLoggedIn) return true;

  toaster.info('Login to access other pages');
  return router.parseUrl(paths.login);
};

// ✅ Guard para administradores
export const canActivateAuthAdmin = async (
  service = inject(AuthService)
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const toaster = inject(ToastService);

  service.retrieveTokenFromStore();

  if (service.isAdmin) return true;

  toaster.warning('You do not have permission to access this page');
  return router.parseUrl(paths.home);
};

// ✅ Guard para evitar acceder a login si ya estás logueado
export const canActivateAuthPage = (
  service = inject(AuthService)
): true | UrlTree => {
  const router = inject(Router);
  const toaster = inject(ToastService);

  if (!service.isLoggedIn) return true;

  toaster.info('You are already logged in! Logout if you want to enter with another account.');
  return router.parseUrl(paths.home);
};
