#!/bin/bash
# oyun kaynaklarını sırayla birleştirir (p5 = krallık/bölgeler, p4 = döngü ve arayüz en sonda)
cd "$(dirname "$0")" && cat src/p0.js src/p1.js src/pa.js src/p2.js src/p3.js src/p5.js src/p6.js src/p7.js src/p8.js src/p9.js src/pb.js src/pc.js src/p4.js > game.js && python3 build-web.py "$1"
