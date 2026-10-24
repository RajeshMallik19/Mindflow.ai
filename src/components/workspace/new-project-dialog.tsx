"use client";

import { useState } from "react";
import { createProject } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORM_OPTIONS, type Platform } from "@/lib/pipeline";

const PLATFORM_LABEL: Record<Platform, string> = {
  web: "Web",
  mobile: "Mobile",
  both: "Both",
};

export function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("both");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="w-fit" />}>
        Create project
      </DialogTrigger>
      <DialogContent>
        <form
          action={async (formData) => {
            await createProject(formData);
            setOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Input name="name" placeholder="Project name" required autoFocus />
            <Textarea
              name="description"
              placeholder="What's this project about?"
              rows={3}
            />
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Platform
              </label>
              <input type="hidden" name="platform" value={platform} />
              <div className="mt-1.5 flex items-center gap-2">
                {PLATFORM_OPTIONS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={platform === p ? "default" : "outline"}
                    onClick={() => setPlatform(p)}
                  >
                    {PLATFORM_LABEL[p]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
