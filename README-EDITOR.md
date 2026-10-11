# Creative Multiplier — guia rápido para editores

Ferramenta que junta seus clipes (hook + body + CTA) em vários anúncios
prontos, automaticamente. Você não precisa saber nada de programação — dê
duplo-clique em **`Abrir Creative Multiplier.command`** e ela abre sozinha no
navegador.

## Requisitos

- **Só funciona em Mac** (usa recursos do macOS pra codificar vídeo). Ainda
  não existe versão para Windows.
- Na **primeira vez**, o duplo-clique baixa sozinho tudo que falta (Homebrew,
  ffmpeg, o modelo de transcrição de ~1,5 GB) — isso pode levar alguns
  minutos dependendo da sua internet. Da segunda vez em diante abre na hora.
- Precisa de internet só nessa primeira instalação; depois disso a ferramenta
  roda 100% offline no seu computador — nenhum vídeo seu sai da sua máquina.

## Antes de abrir: baixe a ferramenta

Na página do [projeto](https://github.com/leonardoparisi-max/volcan-creative-multiplier),
clique em **Code → Download ZIP**. Descompacte o ZIP e abra a pasta criada.
Dentro dela, dê duplo-clique em **`Abrir Creative Multiplier.command`**.
Na primeira vez, o macOS pode pedir confirmação para abrir o arquivo baixado.
Depois siga as instruções na tela; a instalação das dependências pode levar alguns minutos.

## 1. Onde colocar os clipes

Dentro da pasta `input/` existem três subpastas:

```
input/
  hooks/    → os primeiros segundos do anúncio (o gancho)
  bodies/   → o meio, onde explica a oferta/método
  ctas/     → o final, chamando pra ação
```

Arraste seus vídeos para a pasta certa (ou use o botão **Adicionar**/arraste
direto pra dentro da coluna na tela de Componentes).

### Como nomear os arquivos

Todo arquivo precisa começar com uma letra + número + underscore:

- Hooks: `H01_...`, `H02_...`, `H03_...`
- Bodies: `B01_...`, `B02_...`
- CTAs: `C01_...`

Exemplo: `H01_dor_do_cliente.mp4`. Se você não colocar o prefixo, a ferramenta
renomeia sozinha ao importar pela tela (mas arquivos jogados direto na pasta
pelo Finder, sem prefixo, aparecem com um aviso vermelho pedindo pra
renomear).

Dois arquivos com o **mesmo** prefixo (dois `H01_`, por exemplo) também dão
erro — cada peça precisa de um número único dentro do seu tipo.

## 2. O fluxo, passo a passo

1. **Componentes** — confira se todos os clipes estão lá, ative a legenda
   automática ou escreva um texto fixo pra cada um, e marque como
   ativo/inativo o que quiser incluir ou não no lote.
2. **Conexões** — clique num hook e ligue/desligue quais bodies e CTAs ele
   pode formar (por padrão, tudo está ligado — você só corta o que **não**
   quer).
3. **Preview** — escolha uma combinação e renderize só ela, pra conferir se a
   legenda, o texto e a transição ficaram bons antes de gerar tudo.
4. **Renderizar** — dê um nome pra "leva" (ex.: `lancamento-fevereiro`) e
   clique em Renderizar. A ferramenta gera todas as combinações permitidas.
   Se você rodar de novo na mesma leva sem mudar nada, ela pula o que já
   está pronto — só refaz o que você alterou.
5. **Saída** — cada leva aparece numa lista, com miniatura e duração de cada
   vídeo. Dali dá pra abrir a pasta no Finder, abrir a planilha (manifest)
   com todos os dados, ou apagar a leva inteira.

## 3. Legenda automática

Por padrão, todo clipe tenta gerar legenda automática (aquelas palavras que
acendem uma de cada vez). Às vezes a transcrição erra uma palavra — pra
corrigir, abra o clipe (clique no card), vá até a seção **Legenda** e edite o
texto de cada palavra ali mesmo. Clique em **salvar**. Enquanto não revisar,
aparece um aviso cinza "legenda sem revisão" no card — some assim que você
salva.

Se a transcrição saiu muito errada, use **re-transcrever** pra refazer do
zero (isso descarta qualquer edição salva).

## 4. Quando aparecer um erro

A ferramenta tenta explicar o erro em português simples, tipo:

- **"Fonte X não instalada"** → falta instalar a fonte Montserrat
  ExtraBold. Baixe em <https://fonts.google.com/specimen/Montserrat>
  (aba "Static", peça o peso "ExtraBold") e copie o `.ttf` pra
  `~/Biblioteca/Fontes` (ou `~/Library/Fonts` em inglês). Recarregue a
  página depois.
- **"Esse arquivo de vídeo está corrompido ou incompleto"** → o clipe
  provavelmente parou de copiar no meio. Copie de novo do celular/câmera.
- **"Esse arquivo não é um vídeo válido"** → confira se realmente é um
  clipe de vídeo (não uma foto renomeada, por exemplo).
- **"Sem espaço livre no disco"** → libere espaço, ou vá em Configuração e
  limpe o cache/as saídas antigas.
- **"whisper-cli não está instalado"** ou **"ffmpeg não está instalado"** →
  feche a ferramenta e dê duplo-clique de novo no
  `Abrir Creative Multiplier.command` — ele reinstala sozinho.

Se o erro não for nenhum desses, ele aparece cru mesmo (em inglês, texto
técnico do programa por trás) — nesse caso, chame quem configurou a
ferramenta pra você.

No topo da tela sempre tem uma bolinha "deps": verde = tudo certo, laranja =
alguma coisa falta (clique em "detalhes" pra ver o quê).

## 5. Ferramentas do card de cada clipe

Abrindo um clipe (clicando no card), dá pra:

- **Renomear** — troca só a parte descritiva do nome (o prefixo `H01_`
  fica).
- **Duplicar** — cria uma cópia do arquivo, pra você ter duas versões
  independentes.
- **Apagar** — não apaga de verdade: move pra `input/_lixeira/`, então dá
  pra recuperar manualmente se precisar.

---

Dúvida técnica? O [README.md](README.md) tem os detalhes de como a
ferramenta funciona por dentro.
