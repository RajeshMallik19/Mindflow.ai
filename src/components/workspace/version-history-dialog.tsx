"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type VersionRow = { id: string; content: string; createdAt: string };

function preview(content: string): string {
  try {
    const text = JSON.stringify(JSON.parse(content));
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  } catch {
    return content.slice(0, 160);
  }
}

export function VersionHistoryDialog({
  projectId,
  type,
  onRestored,
}: {
  projectId: string;
  type: string;
  onRestored: (data: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<VersionRow[] | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/artifacts/history?projectId=${encodeURIComponent(projectId)}&type=${encodeURIComponent(type)}`,
      );
      const body = await res.json();
      setVersions(body.versions ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function restore(versionId: string) {
    setRestoringId(versionId);
    try {
      const res = await fetch("/api/artifacts/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type, versionId }),
      });
      const body = await res.json();
      if (res.ok) {
        onRestored(body.data);
        setOpen(false);
        setVersions(null);
      }
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setOpen(true);
          if (versions === null) void load();
        }}
      >
        <History className="size-3.5" /> History
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Version history</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="flex flex-col gap-2 pr-2">
              {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!loading && versions?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No past versions yet — regenerating or restoring creates one.
                </p>
              )}
              {versions?.map((v) => (
                <div key={v.id} className="rounded-md border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restore(v.id)}
                      disabled={restoringId !== null}
                    >
                      {restoringId === v.id ? "Restoring…" : "Restore"}
                    </Button>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {preview(v.content)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
