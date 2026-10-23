
import Link from "next/link";
import { Suspense } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { CopilotPanel } from "@/components/workspace/copilot-panel";
import { NewProjectDialog } from "@/components/workspace/new-project-dialog";
import { QuickActionCard } from "@/components/workspace/quick-action-card";
import { db } from "@/lib/db";
import type { Project } from "@/lib/types";

const QUICK_ACTIONS = [
  {
    title: "New Research",
    description: "Give the Research Agent a topic to investigate.",
    defaultName: "Untitled research",
    defaultDescription: "",
  },
  {
    title: "New Product Thinking project",
    description: "Turn an idea into personas, user stories, and an IA.",
    defaultName: "Untitled product",
    defaultDescription: "",
  },
  {
    title: "New Design project",
    description: "Generate wireframes from an existing IA and personas.",
    defaultName: "Untitled design",
    defaultDescription: "",
  },
];

function SidebarFallback() {
  return (
    <aside className="h-full w-64 shrink-0 animate-pulse border-r bg-muted/50">
      <div className="px-4 py-4 text-sm font-semibold">MindFlow AI</div>
      <div className="px-4 py-3 text-xs text-muted-foreground">
        Loading projects...
      </div>
    </aside>
  );
}

function RecentProjectsFallback() {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Recent projects
      </h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Loading projects...</CardTitle>
          <CardDescription>
            Your projects will appear here shortly.
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
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

async function RecentProjects() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
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
              <Card className="transition-colors hover:bg-accent">
                <CardHeader>
                  <CardTitle className="text-sm">
                    {project.name}
                  </CardTitle>
                  <CardDescription>
                    {project.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex h-full flex-1">
      <Suspense fallback={<SidebarFallback />}>
        <ProjectSidebar />
      </Suspense>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your personal, local-first AI workspace.
            </p>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Quick actions
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {QUICK_ACTIONS.map((action) => (
                <QuickActionCard key={action.title} {...action} />
              ))}
            </div>
          </section>

          <Suspense fallback={<RecentProjectsFallback />}>
            <RecentProjects />
          </Suspense>

          <NewProjectDialog />
        </div>
      </main>

      <CopilotPanel />
    </div>
  );
}
