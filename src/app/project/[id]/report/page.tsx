import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportPrintButton } from "@/components/workspace/report-print-button";
import { DeviceFrame } from "@/components/workspace/wireframe-canvas";
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
  type WireframeScreen,
} from "@/lib/pipeline";
import { WIREFRAME_ELEMENT_CLASS, WIREFRAME_ELEMENT_ICON } from "@/lib/wireframe-style";

const STAGE_IDS = STAGES.map((s) => s.id);

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

function ScreenMockup({ screen }: { screen: WireframeScreen }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {screen.name}
      </p>
      <div className="inline-block max-w-full overflow-x-auto p-1">
        <DeviceFrame device={screen.device}>
          <div
            style={{ width: screen.device === "mobile" ? 320 : 640 }}
            className="flex flex-col gap-2 bg-background p-3"
          >
            {screen.sections.map((section) => (
              <div
                key={section.id}
                className={`flex gap-2 ${section.direction === "row" ? "flex-row" : "flex-col"}`}
              >
                {section.elements.map((el) => {
                  const Icon = WIREFRAME_ELEMENT_ICON[el.type];
                  return (
                    <div
                      key={el.id}
                      className={`flex items-center gap-1.5 px-2 ${
                        el.type === "image" ? "flex-col justify-center gap-1" : ""
                      } ${WIREFRAME_ELEMENT_CLASS[el.type]}`}
                    >
                      <Icon
                        className={el.type === "image" ? "size-5 opacity-60" : "size-3.5 shrink-0 opacity-70"}
                      />
                      <span className="truncate">{el.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </DeviceFrame>
      </div>
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

  const web = data.screens.filter((s) => s.device === "desktop");
  const mobile = data.screens.filter((s) => s.device === "mobile");
  const grouped = web.length > 0 && mobile.length > 0;
  const themeStyle = data.theme
    ? ({ "--primary": data.theme.primaryHex } as React.CSSProperties)
    : undefined;

  if (!grouped) {
    return (
      <div className="flex flex-col gap-3">
        {data.theme && (
          <span className="text-xs text-muted-foreground">
            Visual theme: <span className="font-medium text-foreground">{data.theme.vibe}</span>
          </span>
        )}
        <div className="flex flex-col gap-6" style={themeStyle}>
          {data.screens.map((screen, i) => (
            <ScreenMockup key={i} screen={screen} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.theme && (
        <span className="text-xs text-muted-foreground">
          Visual theme: <span className="font-medium text-foreground">{data.theme.vibe}</span>
        </span>
      )}
      <div className="flex flex-col gap-8" style={themeStyle}>
        {web.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Web</h3>
            <div className="flex flex-col gap-6">
              {web.map((screen, i) => (
                <ScreenMockup key={i} screen={screen} />
              ))}
            </div>
          </div>
        )}
        {mobile.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Mobile</h3>
            <div className="flex flex-col gap-6">
              {mobile.map((screen, i) => (
                <ScreenMockup key={i} screen={screen} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function ReportContent({ params }: { params: Promise<{ id: string }> }) {
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
          <section id="wireframes">
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

export default function ProjectReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading report...
        </div>
      }
    >
      <ReportContent params={params} />
    </Suspense>
  );
}
