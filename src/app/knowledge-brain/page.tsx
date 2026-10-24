import { Suspense } from "react";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { KnowledgeBrainSearch } from "@/components/workspace/knowledge-brain-search";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { db } from "@/lib/db";
import type { Project } from "@/lib/types";

function SidebarFallback() {
  return (
    <aside className="h-full w-64 shrink-0 animate-pulse border-r bg-muted/50">
      <div className="px-4 py-4 text-sm font-semibold">MindFlow AI</div>
    </aside>
  );
}

async function KnowledgeBrainSidebar() {
  const projects = await db.project.findMany({ orderBy: { updatedAt: "desc" } });

  const sidebarProjects: Project[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <AppSidebar projects={sidebarProjects} />;
}

export default function KnowledgeBrainPage() {
  return (
    <WorkspaceShell
      sidebar={
        <Suspense fallback={<SidebarFallback />}>
          <KnowledgeBrainSidebar />
        </Suspense>
      }
    >
      <main className="min-w-0 flex-1 overflow-y-auto">
        <KnowledgeBrainSearch />
      </main>
    </WorkspaceShell>
  );
}
