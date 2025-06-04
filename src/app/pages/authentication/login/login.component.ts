import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services';
import { StringUtil } from 'src/app/util';
import { LoginFormComponent } from '../components';
import { LoginFormGroup, getLoginForm } from '../components/login-form';
import { AuthPageLayoutComponent } from 'src/app/shared/components/layouts/auth-page-layout/auth-page-layout.component';
import { TitleComponent } from 'src/app/shared/components/title/title.component';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [AuthPageLayoutComponent, TitleComponent, LoginFormComponent],
})
export class LoginComponent implements OnInit {
  private service = inject(AuthService);
  private toaster = inject(ToastService);
  private router = inject(Router); // ✅ Agregado Router

  form!: LoginFormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.form = LoginFormGroup.from(getLoginForm());
  }

  async login(form: LoginFormGroup): Promise<void> {
    const login = StringUtil.isEmail(form.controls.userNameOrEmail.value)
      ? LoginFormGroup.toEntityWithEmail(form.controls)
      : LoginFormGroup.toEntityWithUserName(form.controls);

    try {
      const response = await this.service.login(login);

      if (response?.token) {
        localStorage.setItem('token', response.token);
        this.toaster.success('Login successful!');
        await this.router.navigate(['/home']); // ✅ Redirige correctamente usando Angular Router
      } else {
        this.toaster.error('Login failed: Token not received');
      }
    } catch (error) {
      this.toaster.error('Invalid username or password');
    }
  }
}
