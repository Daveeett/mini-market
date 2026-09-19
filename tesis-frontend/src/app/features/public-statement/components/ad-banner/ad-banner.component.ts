import { Component, Input, ChangeDetectionStrategy, signal, AfterViewInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './ad-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdBannerComponent implements AfterViewInit, OnDestroy {
  @Input() type: 'header' | 'native' | 'footer' = 'header';
  
  // Reemplaza estos valores con tus IDs reales de Google AdSense
  // Ejemplo: adClient = 'ca-pub-1234567890123456'
  readonly adClient = 'ca-pub-XXXXXXXXXX'; // TODO: TU ID DE PUBLICADOR
  readonly adSlotHeader = 'XXXXXXXXXX';    // TODO: TU ID DE ANUNCIO HEADER
  readonly adSlotNative = 'XXXXXXXXXX';    // TODO: TU ID DE ANUNCIO NATIVE
  readonly adSlotFooter = 'XXXXXXXXXX';    // TODO: TU ID DE ANUNCIO FOOTER

  readonly hidden = signal<boolean>(false);
  
  // Usamos PLATFORM_ID para asegurarnos de que el script solo se ejecute en el navegador (no en SSR)
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAdSenseScript();
      this.pushAd();
    }
  }

  ngOnDestroy(): void {
    // Limpieza si es necesario
  }

  private loadAdSenseScript(): void {
    const scriptId = 'google-adsense-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adClient}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }

  private pushAd(): void {
    try {
      // @ts-ignore
      (window['adsbygoogle'] = window['adsbygoogle'] || []).push({});
    } catch (e) {
      console.error('[AdSense] Error al cargar el anuncio', e);
    }
  }

  hideAd(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.hidden.set(true);
  }
}
