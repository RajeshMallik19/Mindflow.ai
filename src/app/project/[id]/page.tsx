
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { CopilotPanel } from "@/components/workspace/copilot-panel";
import { PipelineView } from "@/components/workspace/pipeline-view";
import { ProjectHeaderMenu } from "@/components/workspace/project-header-menu";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { parseFlowArtifact } from "@/lib/flow-artifact";
import { db } from "@/lib/db";
import { normalizeStoredResearchBrief, STAGES, type StageId } from "@/lib/pipeline";
import type { Project } from "@/lib/types";

function ProjectSidebarFallback() {
  return (
    <aside className="h-full w-64 shrink-0 border-r bg-muted/50">
      <div className="px-4 py-4 text-sm font-semibold">
        MindFlow AI
      </div>
      <div className="px-4 py-3 text-xs text-muted-foreground">
        Loading projects...
      </div>
    </aside>
  );
}

function ProjectContentFallback() {
  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="border-b px-6 py-3">
        <h1 className="text-lg font-semibold tracking-tight">
          Loading project...
        </h1>
      </div>
      <div className="flex-1 p-6 text-sm text-muted-foreground">
        Preparing your workspace...
      </div>
    </main>
  );
}

async function ProjectSidebar() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const sidebarProjects: Project[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    updatedAt: project.updatedAt.toISOString(),
  }));

  return <AppSidebar projects={sidebarProjects} />;
}

const STAGE_IDS = new Set<string>(STAGES.map((s) => s.id));

async function ProjectContent({ id }: { id: string }) {
  const project = await db.project.findUnique({
    where: { id },
  });

  if (!project) {
    notFound();
  }

  const artifacts = await db.artifact.findMany({
    where: { projectId: id, type: { in: [...STAGE_IDS, "ia_diagram", "user_flow_diagram"] } },
  });

  const initialArtifacts: Partial<Record<StageId, unknown>> = {};
  let initialIaDiagram;
  let initialUserFlowDiagram;

  for (const artifact of artifacts) {
    if (artifact.type === "ia_diagram") {
      initialIaDiagram = parseFlowArtifact(artifact.content);
      continue;
    }
    if (artifact.type === "user_flow_diagram") {
      initialUserFlowDiagram = parseFlowArtifact(artifact.content);
      continue;
    }
    try {
      let parsed = JSON.parse(artifact.content);
      if (artifact.type === "research_brief") {
        parsed = normalizeStoredResearchBrief(parsed);
      }
      initialArtifacts[artifact.type as StageId] = parsed;
    } catch {
      // Skip artifacts that somehow don't contain valid JSON.
    }
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-start justify-between border-b px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/project/${project.id}/report`}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <FileText className="size-3.5" /> View report
          </Link>
          <ProjectHeaderMenu
            projectId={project.id}
            name={project.name}
            description={project.description}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PipelineView
          projectId={project.id}
          initialArtifacts={initialArtifacts}
          initialIaDiagram={initialIaDiagram}
          initialUserFlowDiagram={initialUserFlowDiagram}
        />
      </div>
    </main>
  );
}

async function ProjectWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <WorkspaceShell
      sidebar={
        <Suspense fallback={<ProjectSidebarFallback />}>
          <ProjectSidebar />
        </Suspense>
      }
      copilot={<CopilotPanel projectId={id} />}
    >
      <Suspense fallback={<ProjectContentFallback />}>
        <ProjectContent id={id} />
      </Suspense>
    </WorkspaceShell>
  );
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading workspace...
        </div>
      }
    >
      <ProjectWorkspace params={params} />
    </Suspense>
  );
}
