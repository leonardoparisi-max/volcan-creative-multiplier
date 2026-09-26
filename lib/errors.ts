// ---------------------------------------------------------------------------
// Translates the raw errors this pipeline actually throws (ffmpeg stderr,
// Node ENOENT, our own messages) into short sentences an editor with no
// technical background can act on. Falls through to the raw text when no
// pattern matches — never hides an error, just relabels the ones we know.
// ---------------------------------------------------------------------------

interface Pattern {
  test: RegExp;
  say: (m: RegExpMatchArray) => string;
}

const PATTERNS: Pattern[] = [
  {
    test: /Fonte (?:do texto|da tarja) não encontrada: (.+?)\.\s*Instale/i,
    say: (m) =>
      `Fonte ${m[1]} não instalada — copie o arquivo .ttf da fonte para ~/Library/Fonts e recarregue a página.`,
  },
  {
    test: /Text font not found: (.+?)\./i,
    say: (m) =>
      `Fonte ${m[1]} não instalada — copie o arquivo .ttf da fonte para ~/Library/Fonts e recarregue a página.`,
  },
  {
    test: /No such filter:? ?'?drawtext'?/i,
    say: () =>
      `O ffmpeg instalado não tem o filtro de texto (drawtext) — reinstale com "brew install homebrew-ffmpeg/ffmpeg/ffmpeg".`,
  },
  {
    test: /No such filter:? ?'?subtitles'?/i,
    say: () =>
      `O ffmpeg instalado não tem o filtro de legenda (subtitles) — reinstale com "brew install homebrew-ffmpeg/ffmpeg/ffmpeg".`,
  },
  {
    test: /moov atom not found/i,
    say: () =>
      `Esse arquivo de vídeo está corrompido ou incompleto (provavelmente uma cópia que parou no meio) — copie o clipe de novo.`,
  },
  {
    test: /Invalid data found when processing input/i,
    say: () =>
      `Esse arquivo não é um vídeo válido, ou o formato não é suportado — confira se é mesmo um clipe de vídeo.`,
  },
  {
    test: /No space left on device/i,
    say: () =>
      `Sem espaço livre no disco — libere espaço (ou limpe cache/saídas na Configuração) e tente de novo.`,
  },
  {
    test: /whisper.*(ENOENT|not found|no such file)/i,
    say: () => `O programa de transcrição (whisper-cli) não está instalado — rode "brew install whisper-cpp".`,
  },
  {
    test: /ffmpeg.*(ENOENT|not found|no such file)/i,
    say: () => `O ffmpeg não está instalado, ou o caminho em Configuração → Gerais está errado.`,
  },
  {
    test: /master\(s\) ausente\(s\)|missing master/i,
    say: () =>
      `Um dos clipes dessa combinação não foi preparado (a ingestão falhou antes) — veja o item com erro na lista de Componentes, corrija e renderize de novo.`,
  },
  {
    test: /áudio e vídeo de tamanhos diferentes|mismatched audio and video/i,
    say: () =>
      `O áudio e o vídeo desse clipe saíram com durações diferentes — tente renderizar de novo; se persistir, o arquivo original pode estar com problema.`,
  },
];

/** Human sentence for a raw error string. Returns the original text on no match. */
export function humanize(err: string | undefined | null): string {
  const raw = (err || "").trim();
  if (!raw) return "";
  for (const p of PATTERNS) {
    const m = raw.match(p.test);
    if (m) return p.say(m);
  }
  return raw;
}
