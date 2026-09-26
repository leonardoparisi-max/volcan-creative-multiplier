#!/bin/zsh
# Duplo-clique nisto abre o Creative Multiplier. Não precisa saber nada de
# terminal — este script confere/instala o que falta e sobe a ferramenta.
cd "$(dirname "$0")"

say()  { echo ""; echo "▶ $1"; }
ok()   { echo "  ✓ $1"; }
warn() { echo "  ⚠ $1"; }

echo "======================================"
echo "  Creative Multiplier"
echo "======================================"

# 1. Homebrew -----------------------------------------------------------
say "Verificando o Homebrew..."
if ! command -v brew >/dev/null 2>&1; then
  warn "Homebrew não encontrado — é o instalador que os outros passos usam."
  echo "  Abra o Terminal (Spotlight → \"Terminal\") e cole isto para instalar:"
  echo ""
  echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
  echo ""
  echo "  Depois de instalar, clique de novo neste arquivo."
  echo ""
  echo "Pressione Enter para fechar esta janela."
  read -r _
  exit 1
fi
ok "Homebrew encontrado."
BREW_PREFIX=$(brew --prefix)

# 2. Node >= 20 -----------------------------------------------------------
say "Verificando o Node..."
if ! command -v node >/dev/null 2>&1; then
  warn "Node não encontrado. Instalando (npm install pode demorar um pouco)…"
  brew install node
fi
NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 20 ]; then
  warn "Node $(node -v 2>/dev/null || echo ausente) é antigo (precisa de 20+). Atualizando…"
  brew upgrade node 2>/dev/null || brew install node
fi
ok "Node $(node -v) ok."

# 3. ffmpeg com drawtext + subtitles -------------------------------------
say "Verificando o ffmpeg (com filtro de texto e de legenda)..."
FFMPEG_BIN="$BREW_PREFIX/bin/ffmpeg"
NEEDS_FFMPEG=1
if [ -x "$FFMPEG_BIN" ]; then
  FILTERS=$("$FFMPEG_BIN" -hide_banner -filters 2>/dev/null)
  if echo "$FILTERS" | grep -q "drawtext" && echo "$FILTERS" | grep -q "subtitles"; then
    NEEDS_FFMPEG=0
  fi
fi
if [ "$NEEDS_FFMPEG" = "1" ]; then
  warn "ffmpeg com os filtros certos não encontrado (o do Homebrew padrão não serve)."
  echo "  Instalando a versão certa — isso demora alguns minutos na primeira vez…"
  brew tap homebrew-ffmpeg/ffmpeg
  brew install homebrew-ffmpeg/ffmpeg/ffmpeg
fi
ok "ffmpeg ok."

# 4. whisper-cli ----------------------------------------------------------
say "Verificando o whisper-cli (transcrição das legendas)..."
if ! command -v whisper-cli >/dev/null 2>&1 && [ ! -x "$BREW_PREFIX/bin/whisper-cli" ]; then
  warn "whisper-cli não encontrado. Instalando…"
  brew install whisper-cpp
fi
ok "whisper-cli ok."

# 4b. gravar os caminhos reais no config.json ------------------------------
# config.json vem com caminhos de Apple Silicon (/opt/homebrew). Em Mac
# Intel o Homebrew instala em /usr/local — sem isso a ferramenta não acha
# os binários. Regrava com o que foi de fato encontrado no PATH.
say "Ajustando os caminhos das ferramentas no config.json..."
REAL_FFMPEG=$(command -v ffmpeg || echo "$BREW_PREFIX/bin/ffmpeg")
REAL_FFPROBE=$(command -v ffprobe || echo "$BREW_PREFIX/bin/ffprobe")
REAL_WHISPER=$(command -v whisper-cli || echo "$BREW_PREFIX/bin/whisper-cli")
node -e '
  const fs = require("fs");
  const cfg = JSON.parse(fs.readFileSync("config.json", "utf8"));
  cfg.bin.ffmpeg = process.argv[1];
  cfg.bin.ffprobe = process.argv[2];
  cfg.bin.whisper = process.argv[3];
  fs.writeFileSync("config.json", JSON.stringify(cfg, null, 2) + "\n");
' "$REAL_FFMPEG" "$REAL_FFPROBE" "$REAL_WHISPER"
ok "config.json ok."

# 5. modelo de transcrição (~1.5 GB) --------------------------------------
say "Verificando o modelo de transcrição..."
MODEL="models/ggml-large-v3-turbo.bin"
mkdir -p models
if [ ! -f "$MODEL" ]; then
  warn "Modelo não encontrado (~1,5 GB, só baixa uma vez)."
  curl -L --progress-bar -o "$MODEL" \
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin"
fi
ok "Modelo ok."

# 6. fonte Montserrat ExtraBold -------------------------------------------
say "Verificando a fonte Montserrat ExtraBold..."
FONT_DIR="$HOME/Library/Fonts"
mkdir -p "$FONT_DIR"
if [ ! -f "$FONT_DIR/Montserrat-ExtraBold.ttf" ] && [ ! -f "$FONT_DIR/MontserratExtraBold.ttf" ]; then
  warn "Fonte não instalada. Baixando…"
  curl -fL -o "$FONT_DIR/Montserrat-ExtraBold.ttf" \
    "https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-ExtraBold.ttf" \
    || warn "Não consegui baixar a fonte automaticamente — instale manualmente (veja README-EDITOR.md)."
fi
ok "Fonte ok."

# 7. dependências do projeto (node_modules) --------------------------------
say "Verificando as dependências do projeto..."
if [ ! -d node_modules ]; then
  warn "Primeira vez usando esta pasta — instalando (alguns minutos)…"
  npm install
fi
ok "Dependências ok."

# 8. subir o servidor e abrir no navegador ---------------------------------
say "Iniciando o Creative Multiplier..."
npm run dev > /tmp/creative-multiplier-dev.log 2>&1 &
SERVER_PID=$!

for i in $(seq 1 30); do
  if curl -s http://localhost:4310 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

open http://localhost:4310
ok "Aberto no navegador."

echo ""
echo "======================================"
echo "Se alguma dependência não pôde ser instalada automaticamente, a"
echo "ferramenta mostra um aviso \"Dependências\" na tela explicando o que falta."
echo ""
echo "Pode fechar esta janela quando terminar de usar."
echo "(fechar esta janela desliga o Creative Multiplier)"
echo "======================================"
wait $SERVER_PID
