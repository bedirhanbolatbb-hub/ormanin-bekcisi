#!/bin/bash
# oyun kaynaklarını sırayla birleştirir (p5 = krallık/bölgeler, p4 = döngü ve arayüz en sonda)
cd "$(dirname "$0")" && cat src/p1.js src/p2.js src/p3.js src/p5.js src/p6.js src/p7.js src/p4.js > game.js && python3 build-web.py "$1"
