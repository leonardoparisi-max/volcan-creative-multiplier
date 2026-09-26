"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type { Config } from "@/lib/types";
import { api, TRANSITIONS, EDGE_EFFECTS } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// deep set on a cloned object via dot path
function setPath(obj: any, path: string, value: any): any {
  const clone = structuredClone(obj);
  const keys = path.split(".");
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
  cur[keys[keys.length - 1]] = value;
  return clone;
}
function getPath(obj: any, path: string): any {
  return path.split(".").reduce((a, k) => a?.[k], obj);
}

export function ConfigSection({
  config,
  setConfig,
}: {
  config: Config;
  setConfig: (c: Config) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const upd = (path: string, value: any) => {
    setConfig(setPath(config, path, value));
    setDirty(true);
  };

  async function save() {
    setSaving(true);
    try {
      const saved = await api.saveConfig(config);
      setConfig(saved);
      setDirty(false);
      toast.success("config.json salvo");
    } catch (e: any) {
      toast.error(`Falha: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  const num = (path: string, label: string, step = "1") => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="number"
        step={step}
        value={getPath(config, path) ?? 0}
        onChange={(e) => upd(path, parseFloat(e.target.value))}
      />
    </div>
  );
  const txt = (path: string, label: string, placeholder = "") => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        value={getPath(config, path) ?? ""}
        placeholder={placeholder}
        onChange={(e) => upd(path, e.target.value)}
      />
    </div>
  );
  const color = (path: string, label: string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={(getPath(config, path) ?? "#000000").slice(0, 7)}
          onChange={(e) => upd(path, e.target.value.toUpperCase())}
          className="h-9 w-10 rounded border border-input bg-background"
        />
        <Input
          value={getPath(config, path) ?? ""}
          onChange={(e) => upd(path, e.target.value)}
          className="mono"
        />
      </div>
    </div>
  );
  const toggle = (path: string, label: string) => (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <Label>{label}</Label>
      <Switch
        checked={!!getPath(config, path)}
        onCheckedChange={(v) => upd(path, v)}
      />
    </div>
  );

  const transDesc =
    TRANSITIONS.find((t) => t.value === config.transicao.tipo)?.desc ?? "";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>Grava direto no config.json</CardDescription>
        </div>
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          <Save className="h-3.5 w-3.5" />
          {dirty ? "Salvar" : "Salvo"}
        </Button>
      </CardHeader>
      <CardContent>
       <Tabs defaultValue="leva">
        <TabsList className="mb-4">
          <TabsTrigger value="leva">Estilo da leva</TabsTrigger>
          <TabsTrigger value="gerais">Avançado</TabsTrigger>
        </TabsList>

        {/* ---- só o que importa por leva ---- */}
        <TabsContent value="leva" className="space-y-8">
          <p className="text-xs text-muted-foreground">
            Os poucos ajustes que você muda por campanha. O resto (vídeo, áudio,
            binários, whisper) fica em Avançado.
          </p>
          <Group title="Transição">
            <div className="space-y-1 sm:col-span-2">
              <Label>tipo (entre segmentos)</Label>
              <Select
                value={config.transicao.tipo}
                onValueChange={(v) => upd("transicao.tipo", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSITIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label} — {t.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{transDesc}</p>
            </div>
            {num("transicao.duracao", "duração (s)", "0.05")}
          </Group>

          <Group title="Legenda">
            <div className="space-y-1">
              <Label>tamanho</Label>
              <Segmented
                value={String(config.legenda.tamanho)}
                onChange={(v) => upd("legenda.tamanho", parseInt(v, 10))}
                options={[
                  { value: "80", label: "P" },
                  { value: "96", label: "M" },
                  { value: "112", label: "G" },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Slider
                label="posição vertical"
                value={config.legenda.posicao_vertical}
                min={0.4}
                max={0.7}
                step={0.01}
                onChange={(v) => upd("legenda.posicao_vertical", v)}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </div>
            {color("legenda.cor_destaque", "cor de destaque")}
          </Group>

          <Group title="Tarja (faixa)">
            {color("tarja.cor_inicio", "cor início")}
            {color("tarja.cor_fim", "cor fim")}
          </Group>

          <Group title="Punch-in (zoom automático)">
            {toggle("edicao.punch_in.ativo", "ligado por padrão")}
            <div className="space-y-1">
              <Label>a cada</Label>
              <Select
                value={config.edicao.punch_in.a_cada}
                onValueChange={(v) => upd("edicao.punch_in.a_cada", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frase">troca de frase</SelectItem>
                  <SelectItem value="segundos">intervalo fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {num("edicao.punch_in.segundos", "intervalo (s)", "1")}
            {num("edicao.punch_in.zoom", "zoom (1.08 = 8%)", "0.01")}
            <p className="text-xs text-muted-foreground sm:col-span-2">
              corte seco de zoom no vídeo do componente, sem afetar a legenda. Pode
              ser ligado/desligado por componente em cada card.
            </p>
          </Group>

          <Group title="Idioma da fala">
            <div className="space-y-1 sm:col-span-2">
              <Label>whisper.language</Label>
              <Select
                value={config.whisper.language}
                onValueChange={(v) => {
                  if (v !== config.whisper.language) {
                    toast.message("As transcrições serão refeitas para clipes que já foram ingeridos nesse idioma novo.");
                  }
                  upd("whisper.language", v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="en">Inglês</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Group>
        </TabsContent>

        {/* ---- tudo (predefinição global) ---- */}
        <TabsContent value="gerais" className="space-y-8">
        <Group title="Pastas & binários">
          {txt("input_dir", "input_dir", "./input ou caminho do Drive")}
          {txt("output_dir", "output_dir")}
          {txt("bin.ffmpeg", "ffmpeg")}
          {txt("bin.ffprobe", "ffprobe")}
          {txt("bin.whisper", "whisper-cli")}
          {txt("whisper.model_path", "modelo whisper")}
          {txt("whisper.language", "idioma (pt / auto)")}
          {num("whisper.threads", "threads whisper")}
        </Group>

        <Group title="Vídeo">
          {num("video.width", "largura")}
          {num("video.height", "altura")}
          {num("video.fps", "fps")}
          <div className="space-y-1">
            <Label>encoder</Label>
            <Select
              value={config.video.encoder}
              onValueChange={(v) => upd("video.encoder", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h264_videotoolbox">
                  h264_videotoolbox (Apple)
                </SelectItem>
                <SelectItem value="libx264">libx264 veryfast</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {txt("video.bitrate_final", "bitrate final", "10M")}
          {num("video.crf_master", "crf master")}
        </Group>

        <Group title="Áudio">
          {num("audio.loudnorm_target_i", "LUFS alvo (I)")}
          {num("audio.loudnorm_target_tp", "true peak (TP)", "0.1")}
          {num("audio.loudnorm_target_lra", "LRA")}
          {num("audio.denoise_strength", "denoise (0-1)", "0.01")}
          {toggle("audio.denoise", "denoise ligado")}
        </Group>

        <Group title="Trim de silêncio">
          {toggle("trim.auto_trim_silence", "auto trim")}
          {num("trim.silence_threshold_db", "limiar (dB)")}
          {num("trim.silence_min_duration", "duração mín (s)", "0.05")}
          {num("trim.padding_start", "padding início (s)", "0.01")}
          {num("trim.padding_end", "padding fim (s)", "0.01")}
        </Group>

        <Group title="Transição">
          <div className="space-y-1 sm:col-span-2">
            <Label>tipo (entre segmentos)</Label>
            <Select
              value={config.transicao.tipo}
              onValueChange={(v) => upd("transicao.tipo", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSITIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label} — {t.desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{transDesc}</p>
          </div>
          {num("transicao.duracao", "duração (s)", "0.05")}
          <div className="space-y-1">
            <Label>abertura (início do vídeo)</Label>
            <Select
              value={config.transicao.abertura}
              onValueChange={(v) => upd("transicao.abertura", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDGE_EFFECTS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {num("transicao.abertura_duracao", "abertura dur (s)", "0.05")}
          <div className="space-y-1">
            <Label>fechamento (fim do vídeo)</Label>
            <Select
              value={config.transicao.fechamento}
              onValueChange={(v) => upd("transicao.fechamento", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDGE_EFFECTS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {num("transicao.fechamento_duracao", "fechamento dur (s)", "0.05")}
        </Group>

        <Group title="Legenda (karaokê por palavra)">
          {txt("legenda.fonte", "fonte")}
          {num("legenda.tamanho", "tamanho")}
          {color("legenda.cor", "cor")}
          {color("legenda.cor_destaque", "cor destaque")}
          {color("legenda.contorno_cor", "contorno")}
          {num("legenda.contorno_largura", "contorno largura")}
          {num("legenda.sombra", "sombra")}
          {num("legenda.posicao_vertical", "posição vertical (0-1)", "0.01")}
          {num("legenda.max_palavras_linha", "máx palavras/linha")}
        </Group>

        <Group title="Overlay do hook">
          {txt("overlay_hook.fonte", "fonte")}
          {num("overlay_hook.tamanho", "tamanho")}
          {color("overlay_hook.cor", "cor")}
          {color("overlay_hook.contorno_cor", "contorno")}
          {num("overlay_hook.contorno_largura", "contorno largura")}
          {num("overlay_hook.posicao_vertical", "posição vertical (0-1)", "0.01")}
          <div className="space-y-1">
            <Label>alinhamento</Label>
            <Select
              value={config.overlay_hook.alinhamento}
              onValueChange={(v) => upd("overlay_hook.alinhamento", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">left</SelectItem>
                <SelectItem value="center">center</SelectItem>
                <SelectItem value="right">right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {toggle("overlay_hook.fundo_caixa", "fundo caixa")}
          {color("overlay_hook.fundo_cor", "fundo cor")}
        </Group>

        <Group title="Tarja (faixa laranja)">
          {color("tarja.cor_inicio", "cor início (esq.)")}
          {color("tarja.cor_fim", "cor fim (dir.)")}
          {txt("tarja.fonte", "fonte")}
          {num("tarja.tamanho", "tamanho")}
          {color("tarja.cor_texto", "cor do texto")}
          {num("tarja.padding_vertical", "padding vertical")}
          {num("tarja.espaco_linha", "espaço entre linhas")}
          {num("tarja.largura", "largura (0-1)", "0.05")}
          {num("tarja.sombra_offset", "sombra (offset)")}
          {num("tarja.contorno_largura", "contorno (largura)")}
          {num("tarja.posicao_vertical", "posição padrão (0-1)", "0.01")}
        </Group>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
          <div
            className="h-10 flex-1 rounded-md"
            style={{
              backgroundImage: `linear-gradient(90deg, ${config.tarja.cor_inicio}, ${config.tarja.cor_fim})`,
            }}
          />
          <span className="text-xs text-muted-foreground">
            prévia do gradiente da tarja
          </span>
        </div>

        <Group title="Layout (padrões de split)">
          {num("layout.divisao_padrao", "divisão padrão (0-1)", "0.05")}
          {num("layout.foco_video_padrao", "foco vídeo padrão", "0.05")}
          {num("layout.foco_imagem_padrao", "foco imagem padrão", "0.05")}
        </Group>

        <Group title="Render & nome do arquivo">
          {num("render.concorrencia", "concorrência")}
          {toggle("render.sobrescrever_existentes", "sobrescrever existentes")}
          {txt("render.prefixo", "prefixo (ex: promoJan)")}
          <div className="space-y-1 sm:col-span-2">
            {txt("render.padrao_nome", "padrão do nome")}
            <p className="text-xs text-muted-foreground">
              tokens: {"{hook}"} {"{body}"} {"{cta}"} {"{n}"} {"{prefixo}"} · vira
              nome do arquivo salvo
            </p>
          </div>
        </Group>
        </TabsContent>
       </Tabs>
      </CardContent>
    </Card>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </div>
  );
}
