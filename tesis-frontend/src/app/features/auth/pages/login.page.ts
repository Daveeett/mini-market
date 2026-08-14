import { Component, signal, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { AuthService } from '../services/auth.service';
import { LoginData } from '../interfaces/requests/login-data.interface';
import { ToastService } from '@shared/services/toast.service';
import { ApiResponse } from '@shared/models/api.models';

@Component({
    selector: 'app-login-page',
    imports: [ReactiveFormsModule, NgIconComponent],
    templateUrl: './login.page.html',
    styleUrl: './login.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  readonly loading = signal(false);
  readonly error = signal('');

  // TODO: Remove demo credentials before production
  readonly form = this.fb.group({
    email: ['admin@minimarket.local', [Validators.required, Validators.email]],
    password: ['Admin123*', [Validators.required]],
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toast: ToastService,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

     this.authService.login(this.form.getRawValue() as { email: string; password: string })
       .pipe(takeUntilDestroyed(this.destroyRef))
       .subscribe({
         next: (res: ApiResponse<LoginData>) => {
           this.loading.set(false);
           const role = res.data.user.role;
           this.toast.success(`Bienvenido/a${role === 'CAJERO' ? ' Cajero' : ''}!`);
           void this.router.navigateByUrl('/dashboard');
         },
         error: (err: Error) => {
           this.loading.set(false);
           this.error.set(err.message);
         },
       });
  }
}
