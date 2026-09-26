import fs from "node:fs";
import { run, binExists } from "./ffmpeg/exec";
import { resolveFont } from "./fonts";
import { inputDir } from "./paths";
import { resolveFromRoot } from "./paths";
import type { Config, DoctorCheck, DoctorReport } from "./types";

/** Verify every external dependency the pipeline relies on. */
export async function runDoctor(cfg: Config): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];

  // ffmpeg
  const hasFfmpeg = await binExists(cfg.bin.ffmpeg);
  checks.push({
    name: "FFmpeg",
    ok: hasFfmpeg,
    detail: hasFfmpeg ? cfg.bin.ffmpeg : "não encontrado",
    hint: hasFfmpeg ? undefined : "brew install ffmpeg",
  });

  // ffprobe
  const hasFfprobe = await binExists(cfg.bin.ffprobe);
  checks.push({
    name: "ffprobe",
    ok: hasFfprobe,
    detail: hasFfprobe ? cfg.bin.ffprobe : "não encontrado",
    hint: hasFfprobe ? undefined : "brew install ffmpeg",
  });

  // text filters — the homebrew-core ffmpeg bottle ships WITHOUT libass/
  // freetype, so drawtext (overlay) and subtitles (legenda) are missing.
  // Verify explicitly, because their absence only bites mid-render.
  if (hasFfmpeg) {
    let filters = "";
    try {
      const { stdout } = await run(cfg.bin.ffmpeg, ["-hide_banner", "-filters"], {
        allowFail: true,
      });
      filters = stdout;
    } catch {
      filters = "";
    }
    const hasDrawtext = /\bdrawtext\b/.test(filters);
    const hasSubs = /\bsubtitles\b/.test(filters);
    checks.push({
      name: "Filtro drawtext (overlay)",
      ok: hasDrawtext,
      detail: hasDrawtext ? "disponível" : "ausente (ffmpeg sem libfreetype)",
      hint: hasDrawtext
        ? undefined
        : "brew uninstall ffmpeg && brew install homebrew-ffmpeg/ffmpeg/ffmpeg",
    });
    checks.push({
      name: "Filtro subtitles (legenda)",
      ok: hasSubs,
      detail: hasSubs ? "disponível" : "ausente (ffmpeg sem libass)",
      hint: hasSubs
        ? undefined
        : "brew uninstall ffmpeg && brew install homebrew-ffmpeg/ffmpeg/ffmpeg",
    });
  }

  // videotoolbox encoder (only relevant if selected)
  if (hasFfmpeg && cfg.video.encoder === "h264_videotoolbox") {
    let vt = false;
    try {
      const { stdout } = await run(cfg.bin.ffmpeg, ["-hide_banner", "-encoders"], {
        allowFail: true,
      });
      vt = /h264_videotoolbox/.test(stdout);
    } catch {
      vt = false;
    }
    checks.push({
      name: "Encoder h264_videotoolbox",
      ok: vt,
      detail: vt ? "disponível" : "indisponível",
      hint: vt ? undefined : "troque encoder para 'libx264' no config",
    });
  }

  // whisper binary
  const hasWhisper = await binExists(cfg.bin.whisper);
  checks.push({
    name: "whisper.cpp (whisper-cli)",
    ok: hasWhisper,
    detail: hasWhisper ? cfg.bin.whisper : "não encontrado",
    hint: hasWhisper ? undefined : "brew install whisper-cpp",
  });

  // whisper model
  const modelPath = resolveFromRoot(cfg.whisper.model_path);
  const hasModel = fs.existsSync(modelPath);
  checks.push({
    name: "Modelo whisper",
    ok: hasModel,
    detail: hasModel ? cfg.whisper.model_path : `ausente: ${cfg.whisper.model_path}`,
    hint: hasModel
      ? undefined
      : "baixe ggml-large-v3-turbo.bin para ./models (huggingface.co/ggerganov/whisper.cpp)",
  });

  // fonts
  const legFont = await resolveFont(cfg.legenda.fonte);
  checks.push({
    name: `Fonte legenda (${cfg.legenda.fonte})`,
    ok: !!legFont.file,
    detail: legFont.file ?? "não resolvida",
    hint: legFont.file ? undefined : "instale a fonte em ~/Library/Fonts",
  });
  const ovFont = await resolveFont(cfg.overlay_hook.fonte);
  checks.push({
    name: `Fonte overlay (${cfg.overlay_hook.fonte})`,
    ok: !!ovFont.file,
    detail: ovFont.file ?? "não resolvida",
    hint: ovFont.file ? undefined : "instale a fonte em ~/Library/Fonts",
  });

  // input dir
  const inDir = inputDir(cfg);
  const hasInput = fs.existsSync(inDir);
  checks.push({
    name: "Pasta de input",
    ok: hasInput,
    detail: hasInput ? inDir : `ausente: ${inDir}`,
    hint: hasInput ? undefined : "ajuste input_dir no config",
  });

  return { ok: checks.every((c) => c.ok), checks };
}
