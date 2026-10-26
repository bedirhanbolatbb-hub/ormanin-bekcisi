import json, sys, math
from PIL import Image, ImageDraw
d = json.load(open(sys.argv[1])); out = sys.argv[2]
cells, C, R = d['cells'], d['C'], d['R']; n = len(cells); px = 6
im = Image.new('RGB', (n * px, n * px)); g = ImageDraw.Draw(im)
col = {0: (90, 150, 90), 1: (150, 150, 160), 2: (200, 60, 60), 3: (110, 120, 200), 9: (0, 0, 0)}
for j, row in enumerate(cells):
    for i, t in enumerate(row):
        g.rectangle([i * px, j * px, i * px + px - 1, j * px + px - 1], fill=col.get(t, (255, 0, 255)))
def P(wx, wz): return ((wx - d['x'] + R) / C * px + px / 2, (wz - d['z'] + R) / C * px + px / 2)
for p in d['path']:
    x, y = P(p[0], p[1]); g.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(255, 255, 0) if not p[4] else (255, 140, 0))
for nm, c in [('start', (0, 255, 255)), ('end', (255, 255, 255))]:
    for (wx, wz) in d[nm]:
        x, y = P(wx, wz); g.ellipse([x - 3, y - 3, x + 3, y + 3], outline=c, width=2)
x, y = P(d['x'], d['z']); a = d['d2']; g.line([x, y, x + math.sin(a) * 60, y + math.cos(a) * 60], fill=(255, 0, 255), width=3)
im.save(out)
