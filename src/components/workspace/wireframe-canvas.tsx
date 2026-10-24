"use client";

import { useRef, useState } from "react";
import {
  CreditCard,
  Download,
  Image as ImageIcon,
  Menu,
  MousePointerClick,
  PanelBottom,
  PanelTop,
  TextCursorInput,
  Type as TypeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  WIREFRAME_ELEMENT_TYPES,
  isLegacyWireframes,
  type WireframeElement,
  type WireframeScreen,
  type Wireframes,
} from "@/lib/pipeline";

const ELEMENT_ICON: Record<WireframeElement["type"], React.ComponentType<{ className?: string }>> = {
  header: PanelTop,
  nav: Menu,
  text: TypeIcon,
  button: MousePointerClick,
  image: ImageIcon,
  input: TextCursorInput,
  card: CreditCard,
  footer: PanelBottom,
};

const ELEMENT_CLASS: Record<WireframeElement["type"], string> = {
  header: "w-full h-14 bg-muted font-semibold",
  nav: "w-full h-10 bg-muted/60 text-xs",
  text: "flex-1 min-h-16 bg-card border text-sm",
  button: "w-28 h-10 bg-primary text-primary-foreground text-xs justify-center",
  image: "flex-1 h-32 bg-muted text-xs flex-col",
  input: "flex-1 h-10 border text-xs text-muted-foreground",
  card: "flex-1 min-h-24 bg-card border text-sm",
  footer: "w-full h-12 bg-muted/60 text-xs",
};

function escapeXml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c] as string),
  );
}

function ElementBox({
  el,
  selected,
  onSelect,
  registerRef,
}: {
  el: WireframeElement;
  selected: boolean;
  onSelect: () => void;
  registerRef: (id: string, node: HTMLDivElement | null) => void;
}) {
  const Icon = ELEMENT_ICON[el.type];
  return (
    <div
      ref={(node) => registerRef(el.id, node)}
      onClick={onSelect}
      className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2 ${ELEMENT_CLASS[el.type]} ${
        selected ? "ring-2 ring-primary" : ""
      }`}
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{el.label}</span>
    </div>
  );
}

function ScreenCanvas({
  screen,
  selectedId,
  onSelect,
  registerRef,
  containerRef,
}: {
  screen: WireframeScreen;
  selectedId: string | null;
  onSelect: (id: string) => void;
  registerRef: (id: string, node: HTMLDivElement | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const width = screen.device === "mobile" ? 360 : 820;

  return (
    <div className="overflow-x-auto">
      <div
        ref={containerRef}
        style={{ width }}
        className="flex flex-col rounded-lg border bg-background shadow-sm"
      >
        {screen.sections.map((section) => (
          <div
            key={section.id}
            className={`flex gap-2 border-b p-3 last:border-b-0 ${
              section.direction === "row" ? "flex-row" : "flex-col"
            }`}
          >
            {section.elements.map((el) => (
              <ElementBox
                key={el.id}
                el={el}
                selected={selectedId === el.id}
                onSelect={() => onSelect(el.id)}
                registerRef={registerRef}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WireframeCanvas({
  projectId,
  data,
}: {
  projectId: string;
  data: Wireframes;
}) {
  const legacy = isLegacyWireframes(data);
  const [screens, setScreens] = useState<WireframeScreen[]>(legacy ? [] : data.screens);
  const [activeScreenIdx, setActiveScreenIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  function registerRef(id: string, node: HTMLDivElement | null) {
    if (node) elementRefs.current.set(id, node);
    else elementRefs.current.delete(id);
  }

  if (legacy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">This wireframe needs regenerating</CardTitle>
          <CardDescription>
            It was generated before visual wireframes existed (text-only spec). Click
            Regenerate above to get an actual visual layout.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const activeScreen = screens[activeScreenIdx];
  const selectedElement = selectedId
    ? activeScreen?.sections.flatMap((s) => s.elements).find((e) => e.id === selectedId)
    : undefined;

  function updateSelectedElement(patch: Partial<WireframeElement>) {
    if (!selectedId) return;
    setScreens((prev) =>
      prev.map((screen, idx) =>
        idx !== activeScreenIdx
          ? screen
          : {
              ...screen,
              sections: screen.sections.map((section) => ({
                ...section,
                elements: section.elements.map((el) =>
                  el.id === selectedId ? { ...el, ...patch } : el,
                ),
              })),
            },
      ),
    );
  }

  async function saveChanges() {
    setSaving(true);
    try {
      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          type: "wireframes",
          title: "Wireframes",
          content: JSON.stringify({ screens }),
        }),
      });
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setSaving(false);
    }
  }

  function buildSvg(): string {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect || !activeScreen) return "";

    let body = `<rect width="${containerRect.width}" height="${containerRect.height}" fill="white"/>`;
    for (const section of activeScreen.sections) {
      for (const el of section.elements) {
        const node = elementRefs.current.get(el.id);
        if (!node) continue;
        const r = node.getBoundingClientRect();
        const x = r.left - containerRect.left;
        const y = r.top - containerRect.top;
        body += `<rect x="${x}" y="${y}" width="${r.width}" height="${r.height}" rx="6" fill="#f4f4f5" stroke="#d4d4d8"/>`;
        body += `<text x="${x + 10}" y="${y + 20}" font-size="12" fill="#52525b" font-family="sans-serif">${escapeXml(el.label)}</text>`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${containerRect.width}" height="${containerRect.height}" viewBox="0 0 ${containerRect.width} ${containerRect.height}">${body}</svg>`;
  }

  function downloadSvg() {
    const svg = buildSvg();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeScreen?.name ?? "wireframe"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copySvg() {
    void navigator.clipboard.writeText(buildSvg());
  }

  function downloadPng() {
    const svg = buildSvg();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const img = new Image();
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeScreen?.name ?? "wireframe"}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = svgUrl;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {screens.map((s, i) => (
          <Button
            key={s.name + i}
            size="sm"
            variant={i === activeScreenIdx ? "default" : "outline"}
            onClick={() => {
              setActiveScreenIdx(i);
              setSelectedId(null);
            }}
          >
            {s.name}
          </Button>
        ))}
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={copySvg}>
          Copy as SVG
        </Button>
        <Button size="sm" variant="outline" onClick={downloadSvg}>
          <Download className="size-3.5" /> SVG
        </Button>
        <Button size="sm" variant="outline" onClick={downloadPng}>
          <Download className="size-3.5" /> PNG
        </Button>
        <Button size="sm" onClick={saveChanges} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
      {savedAt && <span className="text-xs text-muted-foreground">Saved at {savedAt}</span>}

      <div className="flex flex-wrap items-start gap-4">
        {activeScreen && (
          <ScreenCanvas
            screen={activeScreen}
            selectedId={selectedId}
            onSelect={setSelectedId}
            registerRef={registerRef}
            containerRef={containerRef}
          />
        )}

        {selectedElement && (
          <Card className="w-64 shrink-0">
            <CardHeader>
              <CardTitle className="text-sm">Edit element</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-3 px-4 pb-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Type
                </label>
                <select
                  value={selectedElement.type}
                  onChange={(e) =>
                    updateSelectedElement({ type: e.target.value as WireframeElement["type"] })
                  }
                  className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  {WIREFRAME_ELEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Label
                </label>
                <Input
                  className="mt-1"
                  value={selectedElement.label}
                  onChange={(e) => updateSelectedElement({ label: e.target.value })}
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
