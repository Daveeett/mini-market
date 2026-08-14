import { Component, signal, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PublicStatementService } from '../services/public-statement.service';
import { PublicStatementResponse } from '../interfaces/responses/public-statement-response.interface';

@Component({
    selector: 'app-public-statement-page',
    imports: [DatePipe],
    templateUrl: './public-statement.page.html',
    styleUrl: './public-statement.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicStatementPage {
  readonly statement = signal<PublicStatementResponse | null>(null);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly publicStatementService: PublicStatementService,
  ) {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      return;
    }

    this.publicStatementService.getPublicStatement(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.statement.set(response.data),
        error: () => this.statement.set(null),
      });
  }
}
