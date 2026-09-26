# Creative Multiplier

Ferramenta local que combina **hooks × bodies × ctas** e cospe os vídeos finais
**prontos para subir** na Meta / TikTok / YouTube — sem nenhuma edição manual
depois. Todo tratamento (trim de silêncio, denoise, loudness, legenda karaokê,
overlay de texto, transições, abertura/fechamento) é automático e definido em
`config.json`.

> **Editor de vídeo, sem terminal?** Use o
> [README-EDITOR.md](README-EDITOR.md) e dê duplo-clique em
> `Abrir Creative Multiplier.command`. Este README aqui é a referência técnica.

## Rodar

```bash
npm install
npm run dev
```

Abre em <http://localhost:4310>.

> Roda **localmente**. Não é feito para deploy.

## Dependências (macOS Apple Silicon)

O app checa tudo na inicialização (banner "Dependências"). Para instalar:

```bash
# IMPORTANTE: o ffmpeg do homebrew-core vem SEM libass/libfreetype, então
# drawtext (overlay) e subtitles (legenda) não existem nele. Use o tap:
brew tap homebrew-ffmpeg/ffmpeg
brew install homebrew-ffmpeg/ffmpeg/ffmpeg   # inclui libass + freetype + videotoolbox
brew install whisper-cpp

# modelo de transcrição (~1.5GB) em ./models
curl -L -o models/ggml-large-v3-turbo.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

O banner de dependências valida explicitamente os filtros `drawtext` e
`subtitles` — se você tiver o ffmpeg errado instalado, ele avisa antes de
qualquer render.

A fonte **Montserrat** (ExtraBold) precisa estar em `~/Library/Fonts`.

## Pastas

```
input/
  hooks/     H01_descricao.mp4, H02_...
  bodies/    B01_...
  ctas/      C01_...
output/<batch_id>/   combinações + manifest.csv
.cache/              masters normalizados (por hash), legendas, thumbs
models/              modelo whisper
config.json          configuração global
components.csv       metadados por componente (gerado ao escanear)
```

`input_dir` e `output_dir` podem apontar para qualquer caminho no `config.json`
— inclusive uma pasta sincronizada do Google Drive Desktop.

## Fluxo

1. **Componentes** — coloque os clipes nas pastas, clique *Reescanear*. Ative
   legenda, escreva overlay, marque incompatibilidades e ative/desative
   componentes. Legenda e overlay são **mutuamente exclusivos** no mesmo
   componente (se há overlay, a legenda é ignorada — a UI avisa).
2. **Configuração** — todos os campos do `config.json`, incluindo o dropdown de
   transição.
3. **Preview** — renderiza **uma** combinação escolhida à mão para validar
   estilo antes de disparar tudo.
4. **Render** — mostra a contagem de combinações + estimativa de tempo/disco,
   dispara o batch com concorrência configurável, barra de progresso real, log
   de erros, e botão para abrir a pasta no Finder.

## Como funciona (pipeline)

- **Etapa 1 — Ingestão** (cacheada por hash do arquivo + estilo): cada
  componente vira um *master normalizado* em `.cache/normalized/`. Ordem: trim
  de silêncio nas pontas → denoise (`afftdn`) → loudness em **dois passos**
  (`loudnorm`) → escala/crop 1080×1920 30fps → **queima legenda OU overlay no
  componente** (nunca no vídeo final).
- **Etapa 2 — Combinações**: produto cartesiano, filtrando inativos e pares
  incompatíveis (bidirecional).
- **Etapa 3 — Render**: concatena os 3 masters com `xfade` (áudio via
  `acrossfade`), aplica abertura/fechamento, encoda com o encoder/bitrate do
  config. Um render que falha não derruba o batch.
- **Etapa 4 — Manifest**: `manifest.csv` liga cada arquivo à sua combinação e
  ao texto do hook (overlay ou primeiras 12 palavras da transcrição).

### Detalhes que evitam retrabalho

- Cache por **hash do arquivo + config de estilo**: troque o arquivo (mesmo
  nome) ou mude o estilo da legenda e só o afetado reprocessa.
- `xfade` só trata vídeo — o áudio recebe `acrossfade` na mesma duração.
- Duração final = Σdurações − (nº transições × duração), refletida no manifest.
- Fontes resolvidas para o caminho absoluto do `.ttf` (drawtext exige caminho).
- Se `sobrescrever_existentes=false`, combinações já renderizadas são puladas —
  dá pra retomar um batch interrompido.
