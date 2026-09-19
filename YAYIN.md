# Yayın akışı (her güncellemede)

Herkese açık link: https://bedirhanbolatbb-hub.github.io/ormanin-bekcisi/
(GitHub Pages, `main` dalındaki `docs/index.html`; push'tan 1-2 dakika sonra güncellenir)

Claude'un yaptığı adımlar:
1. Bulutta `python3 build-web.py <sürüm>` → `docs/index.html` (tam sayfa, sürüm damgalı)
2. `index.html`, `game.js`, `docs/index.html` dosyalarını Mac'teki `~/Projects/ormanin-bekcisi` klasörüne yaz
3. Mac'te: `git add -A && git commit -m "..." && git push gh main`
   - Kimlik: `.git/arac/kimlik` (karpanel'deki ile aynı, HTTPS, `gh` remote)
   - Git'in kilit dosyalarını silebilmesi için oturumda Projects klasörüne silme izni gerekir

Claude artifact linki de aynı sürümle güncellenir (BB'nin kendi hızlı testi için).
