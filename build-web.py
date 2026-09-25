import re,datetime,sys,os
s=open('game.js').read(); t=open('index.html').read()
# FX3: Windows 10'da kutu görünen yeni emojiler (Emoji 13+) derlemeye girmesin
_bad=sorted({hex(ord(c)) for c in s+t if 0x1FA70<=ord(c)<=0x1FAFF and ord(c) not in (0x1FA70,0x1FA71,0x1FA72,0x1FA73,0x1FA78,0x1FA79,0x1FA7A,0x1FA80,0x1FA81,0x1FA82,0x1FA90,0x1FA91,0x1FA92,0x1FA93,0x1FA94,0x1FA95)})
if _bad: sys.exit('Emoji 13+ (Windows 10 desteklemez): '+', '.join(_bad))
ver=sys.argv[1] if len(sys.argv)>1 else 'dev'
stamp=datetime.date.today().strftime('%-d %b %Y').replace('Sep','Eyl').replace('Oct','Eki').replace('Nov','Kas').replace('Dec','Ara')
stamp_en=datetime.date.today().strftime('%-d %b %Y')
t=t.replace('<div class="sub">','<div class="sub"><span data-en="Version '+ver+' · '+stamp_en+'">Sürüm '+ver+' · '+stamp+'</span> · ')
t=t.replace('<!--FONTS-->',open('vendor/fonts.css').read().strip()) if os.path.exists('vendor/fonts.css') else t  # FX3: gömülü yazı tipleri
page=t.replace('// GAME_SCRIPT',s)
full='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="theme-color" content="#e8dcc0">'+page.replace('<canvas','</head><body><canvas',1)+'</body></html>'
import os; os.makedirs('docs',exist_ok=True); open('docs/index.html','w').write(full)
open('ormanin-bekcisi.html','w').write(page)
# CrazyGames paketi: SDK etiketi + yerel three.min.js, tek klasör, zip
import shutil,zipfile
os.makedirs('cg',exist_ok=True)
cgpage=full.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.149.0/three.min.js"></script>','<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script><script src="three.min.js"></script>')
open('cg/index.html','w').write(cgpage)
if os.path.exists('vendor/three.min.js'): shutil.copy('vendor/three.min.js','cg/three.min.js')
with zipfile.ZipFile('cg/ormanin-bekcisi-crazygames.zip','w',zipfile.ZIP_DEFLATED) as z:
    z.write('cg/index.html','index.html')
    if os.path.exists('cg/three.min.js'): z.write('cg/three.min.js','three.min.js')
print(len(full))
