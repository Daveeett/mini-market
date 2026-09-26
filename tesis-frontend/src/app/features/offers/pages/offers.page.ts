import { Component, OnInit, signal, DestroyRef, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent } from '@ng-icons/core';
import { OfferService } from '../services/offer.service';
import { Offer, CreateOfferRequest } from '../interfaces/offer.interface';
import { ToastService } from '@shared/services/toast.service';

export interface SponsorAd {
  id: string;
  businessName: string;
  category: string;
  monthlyFee: number;
  headline: string;
  description: string;
  offerTag: string;
  phoneWhatsApp: string;
  displayFormat: 'POPUP' | 'BANNER' | 'BOTH';
  imageUrl: string;
  active: boolean;
}

@Component({
  selector: 'app-offers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  templateUrl: './offers.page.html',
  styleUrl: './offers.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffersPage implements OnInit {
  readonly activeTab = signal<'STORE_OFFERS' | 'SPONSOR_ADS'>('STORE_OFFERS');
  readonly offers = signal<Offer[]>([]);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);

  // --- Form State: Store Offers ---
  title = '';
  description = '';
  badgeTag = '¡SUPER OFERTA!';
  originalPrice = '';
  offerPrice = '';
  imageUrl = '/assets/images/offer_combo_grocery.jpg';
  active = true;
  editingId: string | null = null;

  // --- Form State: Sponsor Local Ads (Publicidad Auspiciada) ---
  sponsorBusinessName = '';
  sponsorCategory = 'Panadería';
  sponsorMonthlyFee: number | null = 20;
  sponsorHeadline = '';
  sponsorDescription = '';
  sponsorOfferTag = '10% OFF Vecinos';
  sponsorPhoneWhatsApp = '';
  sponsorDisplayFormat: 'POPUP' | 'BANNER' | 'BOTH' = 'BOTH';
  sponsorImageUrl = '/assets/images/offer_combo_grocery.jpg';
  sponsorActive = true;
  editingSponsorId: string | null = null;

  readonly sponsorAds = signal<SponsorAd[]>([
    {
      id: 'sp-1',
      businessName: 'Panadería & Pastelería El Trigo',
      category: 'Panadería Vecinal',
      monthlyFee: 20.00,
      headline: '¡Pan Caliente desde las 6:00 AM!',
      description: 'Muestra tu Estado de Cuenta de Mini Market Urbano y recibe 10% OFF en roscas y pasteles.',
      offerTag: '10% OFF Vecinos',
      phoneWhatsApp: '593999123456',
      displayFormat: 'BOTH',
      imageUrl: '/assets/images/offer_combo_grocery.jpg',
      active: true,
    },
    {
      id: 'sp-2',
      businessName: 'Farmacia & Salud Vida Sana',
      category: 'Salud y Farmacia',
      monthlyFee: 25.00,
      headline: 'Entrega a Domicilio Gratis en el Barrio',
      description: 'Medicamentos y cuidado personal con atención 7 días a la semana.',
      offerTag: 'Envíos $0.00',
      phoneWhatsApp: '593998765432',
      displayFormat: 'BANNER',
      imageUrl: '/assets/images/offer_cleaning_kit.jpg',
      active: true,
    }
  ]);

  readonly totalMonthlyAdRevenue = computed(() => {
    return this.sponsorAds()
      .filter(s => s.active)
      .reduce((sum, s) => sum + Number(s.monthlyFee || 0), 0);
  });

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

  setTab(tab: 'STORE_OFFERS' | 'SPONSOR_ADS'): void {
    this.activeTab.set(tab);
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

  // --- Store Offer Actions ---
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
            this.toast.success('Oferta de la tienda actualizada exitosamente.');
            this.resetOfferForm();
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
            this.toast.success('Oferta de la tienda creada exitosamente.');
            this.resetOfferForm();
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
    if (!confirm('¿Estás seguro de eliminar esta oferta de la tienda?')) return;

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

  resetOfferForm(): void {
    this.editingId = null;
    this.title = '';
    this.description = '';
    this.badgeTag = '¡SUPER OFERTA!';
    this.originalPrice = '';
    this.offerPrice = '';
    this.imageUrl = '/assets/images/offer_combo_grocery.jpg';
    this.active = true;
  }

  // --- Sponsor Ads Actions ---
  saveSponsorAd(): void {
    if (!this.sponsorBusinessName.trim() || !this.sponsorDescription.trim()) {
      this.toast.error('Completa el nombre del negocio auspiciador y la descripción.');
      return;
    }

    const newAd: SponsorAd = {
      id: this.editingSponsorId || `sp-${Date.now()}`,
      businessName: this.sponsorBusinessName.trim(),
      category: this.sponsorCategory,
      monthlyFee: Number(this.sponsorMonthlyFee || 0),
      headline: this.sponsorHeadline.trim() || '¡Anuncio Vecinal Patrocinado!',
      description: this.sponsorDescription.trim(),
      offerTag: this.sponsorOfferTag.trim() || 'Auspiciador',
      phoneWhatsApp: this.sponsorPhoneWhatsApp.trim() || '593999000000',
      displayFormat: this.sponsorDisplayFormat,
      imageUrl: this.sponsorImageUrl || '/assets/images/offer_combo_grocery.jpg',
      active: this.sponsorActive,
    };

    if (this.editingSponsorId) {
      this.sponsorAds.update(ads => ads.map(a => a.id === this.editingSponsorId ? newAd : a));
      this.toast.success(`Anuncio de ${newAd.businessName} actualizado.`);
    } else {
      this.sponsorAds.update(ads => [newAd, ...ads]);
      this.toast.success(`¡Nuevo anuncio publicado! Cuota cobrada: $${newAd.monthlyFee}/mes`);
    }

    this.resetSponsorForm();
  }

  editSponsorAd(ad: SponsorAd): void {
    this.editingSponsorId = ad.id;
    this.sponsorBusinessName = ad.businessName;
    this.sponsorCategory = ad.category;
    this.sponsorMonthlyFee = ad.monthlyFee;
    this.sponsorHeadline = ad.headline;
    this.sponsorDescription = ad.description;
    this.sponsorOfferTag = ad.offerTag;
    this.sponsorPhoneWhatsApp = ad.phoneWhatsApp;
    this.sponsorDisplayFormat = ad.displayFormat;
    this.sponsorImageUrl = ad.imageUrl;
    this.sponsorActive = ad.active;
  }

  toggleSponsorActive(ad: SponsorAd): void {
    this.sponsorAds.update(ads => ads.map(a => a.id === ad.id ? { ...a, active: !a.active } : a));
    this.toast.success(`Anuncio de ${ad.businessName} ${!ad.active ? 'activado' : 'pausado'}.`);
  }

  deleteSponsorAd(id: string): void {
    if (!confirm('¿Estás seguro de eliminar este anuncio auspiciado?')) return;
    this.sponsorAds.update(ads => ads.filter(a => a.id !== id));
    this.toast.success('Anuncio eliminado.');
  }

  resetSponsorForm(): void {
    this.editingSponsorId = null;
    this.sponsorBusinessName = '';
    this.sponsorCategory = 'Panadería';
    this.sponsorMonthlyFee = 20;
    this.sponsorHeadline = '';
    this.sponsorDescription = '';
    this.sponsorOfferTag = '10% OFF Vecinos';
    this.sponsorPhoneWhatsApp = '';
    this.sponsorDisplayFormat = 'BOTH';
    this.sponsorImageUrl = '/assets/images/offer_combo_grocery.jpg';
    this.sponsorActive = true;
  }
}
