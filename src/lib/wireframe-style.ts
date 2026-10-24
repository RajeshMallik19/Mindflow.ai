import {
  CreditCard,
  Image as ImageIcon,
  Menu,
  MousePointerClick,
  PanelBottom,
  PanelTop,
  TextCursorInput,
  Type as TypeIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import type { WireframeElement } from "./pipeline";

// Shared between the editable canvas (wireframe-canvas.tsx) and the
// read-only shareable report page, so the two never drift into looking like
// different products. "High-fidelity" here means a styled mock-up (real
// color, shadow, typography) rendered from the same semantic layout data —
// not a drag/resize canvas, which was deliberately ruled out for this app.
export const WIREFRAME_ELEMENT_ICON: Record<
  WireframeElement["type"],
  ComponentType<{ className?: string }>
> = {
  header: PanelTop,
  nav: Menu,
  text: TypeIcon,
  button: MousePointerClick,
  image: ImageIcon,
  input: TextCursorInput,
  card: CreditCard,
  footer: PanelBottom,
};

export const WIREFRAME_ELEMENT_CLASS: Record<WireframeElement["type"], string> = {
  header:
    "w-full h-14 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold shadow-sm px-3",
  nav: "w-full h-10 rounded-full bg-muted/70 text-xs font-medium text-muted-foreground px-4",
  text: "flex-1 min-h-16 rounded-lg bg-card ring-1 ring-foreground/10 shadow-sm p-3 text-sm",
  button:
    "w-auto min-w-28 h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium shadow-md justify-center px-4",
  image:
    "flex-1 h-32 rounded-xl bg-gradient-to-br from-sky-200 to-violet-200 dark:from-sky-900/60 dark:to-violet-900/60 flex-col justify-center text-xs",
  input:
    "flex-1 h-10 rounded-lg border-2 border-border bg-background px-3 text-xs text-muted-foreground",
  card: "flex-1 min-h-24 rounded-xl bg-card shadow-md ring-1 ring-foreground/10 p-3 text-sm",
  footer: "w-full h-12 rounded-lg bg-foreground/90 text-background text-xs px-3",
};
