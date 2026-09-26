#!/bin/zsh
# Gera clipes sintéticos em samples/ para o teste ponta a ponta (voz via `say` pt-BR).
# Cobre: 9:16 25fps + silêncio inicial, 16:9, sem áudio, 4K 60fps 10-bit mono 44.1k,
# CTA com áudio mais curto que o vídeo, imagem para split.
set -e
cd "$(dirname "$0")/.."
F=${FFMPEG:-/opt/homebrew/bin/ffmpeg}
mkdir -p samples/hooks samples/bodies samples/ctas samples/imagens
cd samples
V=$(say -v '?' | grep -i "pt_BR" | head -1 | awk '{print $1}'); V=${V:-Luciana}
say -v "$V" -o h01.aiff "Você está perdendo dinheiro todo dia sem perceber"
say -v "$V" -o b01.aiff "O método modular resolve isso em três passos simples e rápidos"
say -v "$V" -o b02.aiff "Cada variação é testada automaticamente pelo sistema"
say -v "$V" -o c01.aiff "Clique no link e agende agora"
$F -hide_banner -loglevel error -y -f lavfi -i "testsrc2=size=1080x1920:rate=25" -f lavfi -i "anullsrc=r=48000:cl=stereo" -i h01.aiff -filter_complex "[1:a]atrim=0:0.6[s];[s][2:a]concat=n=2:v=0:a=1[a]" -map 0:v -map "[a]" -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac hooks/H01_perdendo.mp4
$F -hide_banner -loglevel error -y -f lavfi -i "smptebars=size=1920x1080:rate=30" -f lavfi -i "sine=f=440:r=44100" -t 3 -c:v libx264 -pix_fmt yuv420p -c:a aac -ac 1 hooks/H02_landscape.mp4
$F -hide_banner -loglevel error -y -f lavfi -i "color=c=red:size=1080x1920:rate=30" -t 2.5 -c:v libx264 -pix_fmt yuv420p hooks/H03_semaudio.mp4
$F -hide_banner -loglevel error -y -f lavfi -i "testsrc=size=1080x1920:rate=30" -i b01.aiff -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac -ar 48000 bodies/B01_metodo.mp4
$F -hide_banner -loglevel error -y -f lavfi -i "testsrc2=size=2160x3840:rate=60" -i b02.aiff -shortest -c:v libx264 -pix_fmt yuv420p10le -c:a aac -ar 44100 -ac 1 bodies/B02_4k60_10bit.mp4
# CTA: vídeo de 6.36 s com áudio de ~3.8 s (áudio mais curto que o vídeo)
$F -hide_banner -loglevel error -y -f lavfi -i "color=c=0x223344:size=1080x1920:rate=25" -i c01.aiff -f lavfi -i "anullsrc=r=48000:cl=stereo" -filter_complex "[2:a]atrim=0:1.5[s];[1:a][s]concat=n=2:v=0:a=1[a]" -map 0:v -map "[a]" -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac ctas/C01_clique.mp4
$F -hide_banner -loglevel error -y -f lavfi -i "gradients=size=1080x1080:c0=blue:c1=yellow:d=1" -frames:v 1 imagens/produto.png
rm -f *.aiff
echo "samples prontos:"; ls hooks bodies ctas imagens
