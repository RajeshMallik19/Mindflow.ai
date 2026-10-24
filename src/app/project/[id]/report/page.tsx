import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportPrintButton } from "@/components/workspace/report-print-button";
import {
  AiInteractionDesignView,
  PersonasView,
  ProblemFramingView,
  ResearchView,
  UserStoriesView,
  UxStrategyView,
} from "@/components/workspace/stage-views";
import { db } from "@/lib/db";
import {
  isLegacyWireframes,
  normalizeStoredResearchBrief,
  STAGES,
  type IaSitemap,
  type StageId,
  type StoredResearchBrief,
  type UserFlow,
  type Wireframes,
} from "@/lib/pipeline";

const STAGE_IDS = STAGES.map((s) => s.id);

const WIREFRAME_ELEMENT_CLASS: Record<string, string> = {
  header: "w-full h-10 bg-muted font-semibold",
  nav: "w-full h-8 bg-muted/60 text-xs",
  text: "flex-1 min-h-12 bg-white dark:bg-zinc-900 border text-xs",
  button: "w-24 h-8 bg-primary text-primary-foreground text-xs justify-center",
  image: "flex-1 h-24 bg-muted text-xs",
  input: "flex-1 h-8 border text-xs text-muted-foreground",
  card: "flex-1 min-h-20 bg-white dark:bg-zinc-900 border text-xs",
  footer: "w-full h-10 bg-muted/60 text-xs",
};

function IaTree({ sitemap }: { sitemap: IaSitemap }) {
  const byParent = new Map<string | null, IaSitemap["nodes"]>();
  for (const node of sitemap.nodes) {
    const list = byParent.get(node.parentId) ?? [];
    list.push(node);
    byParent.set(node.parentId, list);
  }

  function renderChildren(parentId: string | null) {
    const children = byParent.get(parentId) ?? [];
    if (children.length === 0) return null;
    return (
      <ul className="list-disc space-y-1 pl-5">
        {children.map((n) => (
          <li key={n.id}>
            {n.label}
            {renderChildren(n.id)}
          </li>
        ))}
      </ul>
    );
  }

  return <div className="text-sm">{renderChildren(null)}</div>;
}

function UserFlowList({ flow }: { flow: UserFlow }) {
  const byId = new Map(flow.nodes.map((n) => [n.id, n]));
  return (
    <div className="flex flex-col gap-3 text-sm">
      <ul className="list-disc space-y-1 pl-5">
        {flow.nodes.map((n) => (
          <li key={n.id}>
            <Badge variant="outline" className="mr-2 align-middle">
              {n.type}
            </Badge>
            {n.label}
          </li>
        ))}
      </ul>
      {flow.edges.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {flow.edges.map((e) => (
            <li key={e.id}>
              {byId.get(e.source)?.label ?? e.source}
              {e.label ? ` — ${e.label} → ` : " → "}
              {byId.get(e.target)?.label ?? e.target}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WireframeScreens({ data }: { data: Wireframes }) {
  if (isLegacyWireframes(data)) {
    return (
      <p className="text-sm text-muted-foreground">
        (This wireframe was generated before visual layout existed — regenerate it in the app
        to include it here.)
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {data.screens.map((screen, i) => (
        <div key={i}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {screen.name} ({screen.device})
          </p>
          <div
            style={{ width: screen.device === "mobile" ? 320 : 720, maxWidth: "100%" }}
            className="flex flex-col rounded-lg border bg-background shadow-sm"
          >
            {screen.sections.map((section) => (
              <div
                key={section.id}
                className={`flex gap-2 border-b p-2 last:border-b-0 ${
                  section.direction === "row" ? "flex-row" : "flex-col"
                }`}
              >
                {section.elements.map((el) => (
                  <div
                    key={el.id}
                    className={`flex items-center rounded-md border px-2 ${WIREFRAME_ELEMENT_CLASS[el.type] ?? ""}`}
                  >
                    <span className="truncate">{el.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ProjectReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await db.project.findUnique({ where: { id } });
  if (!project) notFound();

  const artifacts = await db.artifact.findMany({
    where: { projectId: id, type: { in: STAGE_IDS } },
  });

  const data: Partial<Record<StageId, unknown>> = {};
  for (const artifact of artifacts) {
    try {
      let parsed = JSON.parse(artifact.content);
      if (artifact.type === "research_brief") parsed = normalizeStoredResearchBrief(parsed);
      data[artifact.type as StageId] = parsed;
    } catch {
      // Skip artifacts that somehow don't contain valid JSON.
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 print:px-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/project/${id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to project
        </Link>
        <ReportPrintButton />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
      {project.description && (
        <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="mt-8 flex flex-col gap-8">
        {data.research_brief !== undefined && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Research</h2>
            <ResearchView data={(data.research_brief as StoredResearchBrief).simple} />
          </section>
        )}
        {data.problem_framing !== undefined && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Problem Framing</h2>
            <ProblemFramingView data={data.problem_framing as never} />
          </section>
        )}
        {data.personas !== undefined && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Personas</h2>
            <PersonasView data={data.personas as never} />
          </section>
        )}
        {data.user_stories !== undefined && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">User Stories</h2>
            <UserStoriesView data={data.user_stories as never} />
          </section>
        )}
        {data.ia_sitemap !== undefined && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Information Architecture</h2>
            <IaTree sitemap={data.ia_sitemap as IaSitemap} />
          </section>
        )}
        {data.user_flow !== undefined && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">User Flow</h2>
            <UserFlowList flow={data.user_flow as UserFlow} />
          </section>
        )}
        {data.ux_strategy !== undefined && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">UX Strategy</h2>
            <UxStrategyView data={data.ux_strategy as never} />
          </section>
        )}
        {data.ai_interaction_design !== undefined && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">AI Interaction Design</h2>
            <AiInteractionDesignView data={data.ai_interaction_design as never} />
          </section>
        )}
        {data.wireframes !== undefined && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Wireframes</h2>
            <WireframeScreens data={data.wireframes as Wireframes} />
          </section>
        )}
        {Object.keys(data).length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing has been generated for this project yet.
          </p>
        )}
      </div>
    </div>
  );
}
