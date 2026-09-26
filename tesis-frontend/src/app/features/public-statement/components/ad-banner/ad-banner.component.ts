import { Component, Input, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';

export interface LocalSponsorAd {
  id: string;
  businessName: string;
  category: string;
  headline: string;
  description: string;
  offerTag: string;
  phoneWhatsApp: string;
  imageUrl: string;
  active: boolean;
}

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './ad-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdBannerComponent {
  @Input() type: 'header' | 'native' | 'footer' | 'popup' = 'header';
  
  readonly hidden = signal<boolean>(false);
  readonly showModal = signal<boolean>(true);

  // Preset Local Business Sponsors (Monetized local ads)
  readonly localSponsors: LocalSponsorAd[] = [
    {
      id: '1',
      businessName: 'Panadería & Pastelería El Trigo',
      category: 'Panadería Vecinal',
      headline: '¡Pan Caliente desde las 6:00 AM!',
      description: 'Muestra tu Estado de Cuenta de Mini Market Urbano y recibe 10% OFF en roscas y pasteles de cumpleaños.',
      offerTag: '10% OFF Vecinos',
      phoneWhatsApp: '593999123456',
      imageUrl: '/assets/images/offer_combo_grocery.jpg',
      active: true,
    },
    {
      id: '2',
      businessName: 'Farmacia & Salud Vecinal Vida Sana',
      category: 'Salud y Farmacia',
      headline: 'Entrega a Domicilio Gratis en el Barrio',
      description: 'Medicamentos, vitaminas y cuidado personal. Atención personalizada los 7 días de la semana.',
      offerTag: 'Envíos $0.00',
      phoneWhatsApp: '593998765432',
      imageUrl: '/assets/images/offer_cleaning_kit.jpg',
      active: true,
    }
  ];

  get activeSponsor(): LocalSponsorAd {
    return this.localSponsors[0];
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  hideAd(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.hidden.set(true);
  }

  openWhatsApp(phone: string, business: string): void {
    const text = encodeURIComponent(`¡Hola ${business}! Los vi en el Estado de Cuenta de Mini Market Urbano y quisiera información.`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }
}
