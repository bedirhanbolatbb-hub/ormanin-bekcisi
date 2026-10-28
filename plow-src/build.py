import os,glob,shutil,re,sys
root=os.path.dirname(os.path.abspath(__file__))
src=os.path.join(root,'src'); dist=os.path.join(root,'dist')
os.makedirs(os.path.join(dist,'vendor'),exist_ok=True)
html=open(os.path.join(src,'index.html'),encoding='utf-8').read()
fonts=open(os.path.join(root,'vendor','fonts.css'),encoding='utf-8').read()
js=''
for f in sorted(glob.glob(os.path.join(src,'*.js'))):
    js+='\n// ==== '+os.path.basename(f)+' ====\n'+open(f,encoding='utf-8').read()
# player log library (ByteBrew web SDK, MIT) goes first, so errors are caught from the very start
bb=os.path.join(root,'vendor','bytebrew.js')
if os.path.exists(bb): js='\n// ==== bytebrew.js ====\n'+open(bb,encoding='utf-8').read()+'\n'+js
ver=open(os.path.join(root,'VERSION')).read().strip() if os.path.exists(os.path.join(root,'VERSION')) else 'dev'
js=js.replace('__VER__',ver)
html=html.replace('/*FONTS*/',fonts).replace('/*GAME*/',js)
open(os.path.join(dist,'index.html'),'w',encoding='utf-8').write(html)
for v in ['three.min.js','artlib.js']:
    shutil.copy(os.path.join(root,'vendor',v),os.path.join(dist,'vendor',v))
print('built',len(html)//1024,'KB html, js',len(js)//1024,'KB')
