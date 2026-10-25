import json,base64,sys,os
p=sys.argv[1]
s=open(p).read()
try:
    d=json.loads(s)
    if isinstance(d,str): d=json.loads(d)
except Exception:
    i=s.find('{'); d=json.loads(s[i:])
    if isinstance(d,str): d=json.loads(d)
for k,v in d.items():
    if len(v)<20: print('bad',k,v); continue
    b=base64.b64decode(v)
    assert b[:4]==b'glTF', k
    open(f'/home/claude/plow/raw/{k}.glb','wb').write(b)
    print(k,len(b))
