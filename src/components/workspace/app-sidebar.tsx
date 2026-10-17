"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SUBAGENTS } from "@/lib/subagents";
import type { Project } from "@/lib/types";

const NAV_ITEMS = [
  { label: "Home", href: "#" },
  { label: "Research Lab", href: "#" },
  { label: "Product Thinking Studio", href: "#" },
  { label: "Design Studio", href: "#" },
  { label: "Knowledge Brain", href: "#" },
];

export function AppSidebar({ projects }: { projects: Project[] }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="px-4 py-4">
        <span className="text-sm font-semibold tracking-tight">MindFlow AI</span>
      </div>
      <Separator />

      <nav className="px-2 py-3">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="block rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <Separator />

      <div className="px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Projects
        </span>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-1 pb-3">
          {projects.length === 0 && (
            <p className="px-2 text-sm text-zinc-500">No projects yet.</p>
          )}
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="rounded-md px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
            >
              {project.name}
            </Link>
          ))}
        </div>
      </ScrollArea>
      <Separator />

      <div className="px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Subagents
        </span>
        <div className="mt-2 flex flex-col gap-1.5">
          {SUBAGENTS.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {agent.name}
              </span>
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
