import { notFound } from "next/navigation";
import { FlowEditor } from "@/components/workspace/flow-editor";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { CopilotPanel } from "@/components/workspace/copilot-panel";
import { db } from "@/lib/db";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await db.project.findUnique({ where: { id } });
  if (!project) notFound();

  const allProjects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const flowArtifact = await db.artifact.findFirst({
    where: { projectId: id, type: "user_flow" },
  });
  const initial = flowArtifact ? JSON.parse(flowArtifact.content) : undefined;

  return (
    <div className="flex h-full flex-1">
      <AppSidebar
        projects={allProjects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="border-b px-6 py-3">
          <h1 className="text-lg font-semibold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-zinc-500">{project.description}</p>
          )}
        </div>
        <div className="flex-1">
          <FlowEditor projectId={project.id} initial={initial} />
        </div>
      </main>

      <CopilotPanel />
    </div>
  );
}
