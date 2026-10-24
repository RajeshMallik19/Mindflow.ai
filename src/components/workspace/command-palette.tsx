"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Search as SearchIcon, Sparkles } from "lucide-react";
import { createProjectAndRedirect } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Project } from "@/lib/types";

type PaletteItem = {
  id: string;
  label: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
};

// Mounted once in AppSidebar, which every page renders — gives Cmd+K global
// reach without wiring it into each page individually.
export function CommandPalette({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentProjectId = useMemo(() => {
    const match = pathname.match(/^\/project\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const items: PaletteItem[] = useMemo(() => {
    const base: PaletteItem[] = [
      { id: "home", label: "Go to Home", action: () => go("/") },
      { id: "research", label: "Go to Research", action: () => go("/research") },
      {
        id: "knowledge-brain",
        label: "Go to Knowledge Brain",
        action: () => go("/knowledge-brain"),
      },
      {
        id: "new-project",
        label: "New project",
        icon: Plus,
        action: () => {
          setOpen(false);
          setQuery("");
          void createProjectAndRedirect("Untitled project", "");
        },
      },
      ...projects.map((p) => ({
        id: `project-${p.id}`,
        label: p.name,
        hint: "Project",
        action: () => go(`/project/${p.id}`),
      })),
    ];

    if (currentProjectId) {
      base.splice(1, 0, {
        id: "run-next",
        label: "Run next specialist for this project",
        icon: Sparkles,
        action: () => go(`/project/${currentProjectId}?run=next`),
      });
    }

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, currentProjectId]);

  const filtered = query.trim()
    ? items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogContent className="max-w-md gap-0 p-0" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page or project..."
            className="border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">No matches.</p>
          )}
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  {Icon && <Icon className="size-3.5 text-muted-foreground" />}
                  {item.label}
                </span>
                {item.hint && (
                  <span className="text-xs text-muted-foreground">{item.hint}</span>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
