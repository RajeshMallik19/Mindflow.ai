import { Suspense } from "react";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { ResearchWorkspace } from "@/components/workspace/research-workspace";
import { db } from "@/lib/db";
import type { Project } from "@/lib/types";

function SidebarFallback() {
  return (
    <aside className="h-full w-64 shrink-0 animate-pulse border-r bg-muted/50">
      <div className="px-4 py-4 text-sm font-semibold">MindFlow AI</div>
    </aside>
  );
}

async function ResearchSidebar() {
  const projects = await db.project.findMany({ orderBy: { updatedAt: "desc" } });

  const sidebarProjects: Project[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <AppSidebar projects={sidebarProjects} />;
}

export default function ResearchPage() {
  return (
    <div className="flex h-full flex-1">
      <Suspense fallback={<SidebarFallback />}>
        <ResearchSidebar />
      </Suspense>

      <main className="flex-1 overflow-y-auto">
        <ResearchWorkspace />
      </main>
    </div>
  );
}
