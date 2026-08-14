import { Component, signal, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../services/customer.service';
import { Customer } from '../interfaces/requests/customer.interface';
import { SemaphoreBadgeComponent } from '@shared/components/semaphore-badge/semaphore-badge.component';
import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-customers-page',
    imports: [ReactiveFormsModule, SemaphoreBadgeComponent, NgIconComponent],
    templateUrl: './customers.page.html',
    styleUrl: './customers.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage {
  readonly customers = signal<Customer[]>([]);

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)]],
    docType: ['CI', [Validators.required]],
    docNumber: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    email: ['', [Validators.email]],
    description: [''],
    maxCredit: [10, [Validators.required, Validators.min(0)]],
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly fb: FormBuilder,
    private readonly customerService: CustomerService,
  ) {
    this.loadCustomers();
  }

  createCustomer(): void {
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      fullName: raw.fullName ?? '',
      docType: raw.docType ?? 'CI',
      docNumber: raw.docNumber ?? '',
      phone: raw.phone ?? '',
      email: raw.email ?? '',
      description: raw.description ?? '',
      maxCredit: raw.maxCredit ?? 10,
    };

     this.customerService.createCustomer(payload)
       .pipe(takeUntilDestroyed(this.destroyRef))
       .subscribe({
         next: () => {
           this.form.reset({
             fullName: '',
             docType: 'CI',
             docNumber: '',
             phone: '',
             email: '',
             description: '',
             maxCredit: 10,
           });
           this.loadCustomers();
         },
       });
  }

  private loadCustomers(): void {
     this.customerService.getCustomers()
       .pipe(takeUntilDestroyed(this.destroyRef))
       .subscribe({
         next: (response) => this.customers.set(response.data),
         error: () => this.customers.set([]),
       });
  }
}
