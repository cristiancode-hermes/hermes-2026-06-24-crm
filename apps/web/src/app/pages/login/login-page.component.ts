import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoginMode = signal(true);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  registerForm = this.fb.group({
    orgName: ['', Validators.required],
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  toggleMode(): void {
    this.isLoginMode.update((v) => !v);
    this.error.set(null);
  }

  onSubmit(): void {
    this.error.set(null);
    this.loading.set(true);

    if (this.isLoginMode()) {
      const { email, password } = this.loginForm.value;
      if (!email || !password) {
        this.error.set('Por favor completa todos los campos');
        this.loading.set(false);
        return;
      }
      this.authService.login(email, password).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Error al iniciar sesión');
        },
      });
    } else {
      const { orgName, userName, email, password } = this.registerForm.value;
      if (!orgName || !userName || !email || !password) {
        this.error.set('Por favor completa todos los campos');
        this.loading.set(false);
        return;
      }
      this.authService.register(orgName, userName, email, password).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Error al crear la organización');
        },
      });
    }
  }
}
