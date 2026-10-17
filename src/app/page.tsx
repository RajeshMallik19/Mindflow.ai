import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { CopilotPanel } from "@/components/workspace/copilot-panel";
import { NewProjectDialog } from "@/components/workspace/new-project-dialog";
import { db } from "@/lib/db";

const QUICK_ACTIONS = [
  {
    title: "New Research",
    description: "Give the Research Agent a topic to investigate.",
  },
  {
    title: "New Product Thinking project",
    description: "Turn an idea into personas, user stories, and an IA.",
  },
  {
    title: "New Design project",
    description: "Generate wireframes from an existing IA and personas.",
  },
];

export default async function Home() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex h-full flex-1">
      <AppSidebar
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Your personal, local-first AI workspace.
            </p>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
              Quick actions
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {QUICK_ACTIONS.map((action) => (
                <Card key={action.title}>
                  <CardHeader>
                    <CardTitle className="text-sm">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
              Recent projects
            </h2>
            {projects.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">No projects yet</CardTitle>
                  <CardDescription>
                    Create one below to get started.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {projects.map((project) => (
                  <Link key={project.id} href={`/project/${project.id}`}>
                    <Card className="transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900">
                      <CardHeader>
                        <CardTitle className="text-sm">{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <NewProjectDialog />
        </div>
      </main>

      <CopilotPanel />
    </div>
  );
}
