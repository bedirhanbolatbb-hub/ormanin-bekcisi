import re,datetime,sys
s=open('game.js').read(); t=open('index.html').read()
ver=sys.argv[1] if len(sys.argv)>1 else 'dev'
stamp=datetime.date.today().strftime('%-d %b %Y').replace('Sep','Eyl').replace('Oct','Eki').replace('Nov','Kas').replace('Dec','Ara')
t=t.replace('<div class="sub">','<div class="sub">Sürüm '+ver+' · '+stamp+' · ')
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
