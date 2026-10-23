"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SUBAGENTS } from "@/lib/subagents";
import type { Project } from "@/lib/types";

export function AppSidebar({ projects }: { projects: Project[] }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-muted/50">
      <div className="px-4 py-4">
        <span className="text-sm font-semibold tracking-tight">MindFlow AI</span>
      </div>
      <Separator />

      <nav className="px-2 py-3">
        <Link
          href="/"
          className="block rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent"
        >
          Home
        </Link>
      </nav>
      <Separator />

      <div className="px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Projects
        </span>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-1 pb-3">
          {projects.length === 0 && (
            <p className="px-2 text-sm text-muted-foreground">No projects yet.</p>
          )}
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent"
            >
              {project.name}
            </Link>
          ))}
        </div>
      </ScrollArea>
      <Separator />

      <div className="px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Subagents
        </span>
        <div className="mt-2 flex flex-col gap-1.5">
          {SUBAGENTS.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{agent.name}</span>
              <Badge variant="secondary" className="text-[10px]">
                {agent.title}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
