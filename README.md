# Ormanın Bekçisi

Tarayıcıda çalışan arcade-idle oyun (Kingshot tarzı): ağaç kes, odunla kule/sur kur, kırmızı orduyu kılıçla durdur, miğferleri tezgâhta sat, altınla büyü.

- `index.html` + `game.js`: kaynak (artifact sayfa gövdesi + oyun kodu)
- `build-web.py <sürüm>`: `dist/index.html` üretir (yayınlanan tam sayfa)
- Yayın: `dist/` klasörü Vercel'de yayınlanır; her `main` push'u aynı linki günceller.
