import re,datetime,sys
s=open('game.js').read(); t=open('index.html').read()
ver=sys.argv[1] if len(sys.argv)>1 else 'dev'
stamp=datetime.date.today().strftime('%-d %b %Y').replace('Sep','Eyl').replace('Oct','Eki').replace('Nov','Kas').replace('Dec','Ara')
t=t.replace('<div class="sub">','<div class="sub">Sürüm '+ver+' · '+stamp+' · ')
page=t.replace('// GAME_SCRIPT',s)
full='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="theme-color" content="#e8dcc0">'+page.replace('<canvas','</head><body><canvas',1)+'</body></html>'
import os; os.makedirs('dist',exist_ok=True); open('dist/index.html','w').write(full)
open('ormanin-bekcisi.html','w').write(page)
print(len(full))
