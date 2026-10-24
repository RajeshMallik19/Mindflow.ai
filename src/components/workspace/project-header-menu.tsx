"use client";

import { useState, useTransition } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { deleteProject, duplicateProject, renameProject } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORM_OPTIONS, type Platform } from "@/lib/pipeline";

const PLATFORM_LABEL: Record<Platform, string> = {
  web: "Web",
  mobile: "Mobile",
  both: "Both",
};

export function ProjectHeaderMenu({
  projectId,
  name,
  description,
  platform,
}: {
  projectId: string;
  name: string;
  description: string;
  platform: Platform;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftDescription, setDraftDescription] = useState(description);
  const [draftPlatform, setDraftPlatform] = useState<Platform>(platform);
  const [pending, startTransition] = useTransition();
  const [duplicating, startDuplicating] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon-sm"
        variant="ghost"
        title="Duplicate project"
        disabled={duplicating}
        onClick={() => startDuplicating(() => duplicateProject(projectId))}
      >
        <Copy className="size-3.5" />
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={() => setRenameOpen(true)}>
        <Pencil className="size-3.5" />
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="size-3.5" />
      </Button>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await renameProject(projectId, draftName, draftDescription, draftPlatform);
                setRenameOpen(false);
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Project name"
                autoFocus
              />
              <Textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="Description"
                rows={3}
              />
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Platform
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  {PLATFORM_OPTIONS.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      size="sm"
                      variant={draftPlatform === p ? "default" : "outline"}
                      onClick={() => setDraftPlatform(p)}
                    >
                      {PLATFORM_LABEL[p]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{name}&quot;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently deletes the project and everything in it — all artifacts,
            diagrams, and research. This can&apos;t be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => startTransition(() => deleteProject(projectId))}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
