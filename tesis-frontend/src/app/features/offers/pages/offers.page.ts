import { Component, OnInit, signal, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent } from '@ng-icons/core';
import { OfferService } from '../services/offer.service';
import { Offer, CreateOfferRequest } from '../interfaces/offer.interface';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-offers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  templateUrl: './offers.page.html',
  styleUrl: './offers.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffersPage implements OnInit {
  readonly offers = signal<Offer[]>([]);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);

  // Form signal / state
  title = '';
  description = '';
  badgeTag = '¡SUPER OFERTA!';
  originalPrice = '';
  offerPrice = '';
  imageUrl = '/assets/images/offer_combo_grocery.jpg';
  active = true;

  editingId: string | null = null;

  presetImages = [
    { label: 'Combo Abarrotes', url: '/assets/images/offer_combo_grocery.jpg' },
    { label: 'Pack Desayuno', url: '/assets/images/offer_breakfast_pack.jpg' },
  ];

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly offerService: OfferService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.loading.set(true);
    this.offerService.getAllOffers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.offers.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Error al cargar la lista de ofertas.');
          this.loading.set(false);
        },
      });
  }

  saveOffer(): void {
    if (!this.title.trim() || !this.description.trim()) {
      this.toast.error('Completa el título y la descripción de la oferta.');
      return;
    }

    const payload: CreateOfferRequest = {
      title: this.title.trim(),
      description: this.description.trim(),
      badgeTag: this.badgeTag.trim() || '¡OFERTA!',
      originalPrice: this.originalPrice ? this.originalPrice.toString() : undefined,
      offerPrice: this.offerPrice ? this.offerPrice.toString() : undefined,
      imageUrl: this.imageUrl || '/assets/images/offer_combo_grocery.jpg',
      active: this.active,
    };

    this.saving.set(true);

    if (this.editingId) {
      this.offerService.updateOffer(this.editingId, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.success('Oferta actualizada exitosamente.');
            this.resetForm();
            this.loadOffers();
            this.saving.set(false);
          },
          error: () => {
            this.toast.error('Error al actualizar la oferta.');
            this.saving.set(false);
          },
        });
    } else {
      this.offerService.createOffer(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.success('Oferta publicada exitosamente.');
            this.resetForm();
            this.loadOffers();
            this.saving.set(false);
          },
          error: () => {
            this.toast.error('Error al crear la oferta.');
            this.saving.set(false);
          },
        });
    }
  }

  editOffer(offer: Offer): void {
    this.editingId = offer.id;
    this.title = offer.title;
    this.description = offer.description;
    this.badgeTag = offer.badgeTag || '';
    this.originalPrice = offer.originalPrice || '';
    this.offerPrice = offer.offerPrice || '';
    this.imageUrl = offer.imageUrl || '/assets/images/offer_combo_grocery.jpg';
    this.active = offer.active;
  }

  toggleActive(offer: Offer): void {
    this.offerService.toggleOffer(offer.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.toast.success(`Oferta ${res.data.active ? 'activada' : 'desactivada'}.`);
          this.loadOffers();
        },
        error: () => this.toast.error('Error al cambiar estado.'),
      });
  }

  deleteOffer(id: string): void {
    if (!confirm('¿Estás seguro de eliminar esta oferta?')) return;

    this.offerService.deleteOffer(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Oferta eliminada correctamente.');
          this.loadOffers();
        },
        error: () => this.toast.error('Error al eliminar oferta.'),
      });
  }

  resetForm(): void {
    this.editingId = null;
    this.title = '';
    this.description = '';
    this.badgeTag = '¡SUPER OFERTA!';
    this.originalPrice = '';
    this.offerPrice = '';
    this.imageUrl = '/assets/images/offer_combo_grocery.jpg';
    this.active = true;
  }
}
