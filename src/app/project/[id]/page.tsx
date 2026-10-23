
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Node, Edge } from "@xyflow/react";
import { FlowEditor } from "@/components/workspace/flow-editor";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { CopilotPanel } from "@/components/workspace/copilot-panel";
import { db } from "@/lib/db";
import type { Project } from "@/lib/types";

type FlowData = {
  nodes: Node[];
  edges: Edge[];
};

function ProjectSidebarFallback() {
  return (
    <aside className="h-full w-64 shrink-0 border-r bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="px-4 py-4 text-sm font-semibold">
        MindFlow AI
      </div>
      <div className="px-4 py-3 text-xs text-zinc-500">
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
      <div className="flex-1 p-6 text-sm text-zinc-500">
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

async function ProjectContent({ id }: { id: string }) {
  const project = await db.project.findUnique({
    where: { id },
  });

  if (!project) {
    notFound();
  }

  const flowArtifact = await db.artifact.findFirst({
    where: { projectId: id, type: "user_flow" },
  });

  let initial: FlowData | undefined;

  if (flowArtifact) {
    try {
      const parsed: unknown = JSON.parse(flowArtifact.content);

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "nodes" in parsed &&
        "edges" in parsed &&
        Array.isArray(parsed.nodes) &&
        Array.isArray(parsed.edges)
      ) {
        initial = {
          nodes: parsed.nodes as Node[],
          edges: parsed.edges as Edge[],
        };
      }
    } catch {
      initial = undefined;
    }
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="border-b px-6 py-3">
        <h1 className="text-lg font-semibold tracking-tight">
          {project.name}
        </h1>
        {project.description && (
          <p className="text-sm text-zinc-500">
            {project.description}
          </p>
        )}
      </div>

      <div className="flex-1">
        <FlowEditor projectId={project.id} initial={initial} />
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
    <>
      <Suspense fallback={<ProjectSidebarFallback />}>
        <ProjectSidebar />
      </Suspense>

      <Suspense fallback={<ProjectContentFallback />}>
        <ProjectContent id={id} />
      </Suspense>
    </>
  );
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex h-full flex-1">
      <Suspense
        fallback={
          <div className="flex min-w-0 flex-1 items-center justify-center text-sm text-zinc-500">
            Loading workspace...
          </div>
        }
      >
        <ProjectWorkspace params={params} />
      </Suspense>

      <CopilotPanel />
    </div>
  );
}
