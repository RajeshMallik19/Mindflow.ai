"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  Compass,
  LayoutTemplate,
  ListChecks,
  Map as MapIcon,
  Search,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlowEditor } from "@/components/workspace/flow-editor";
import {
  AiInteractionDesignView,
  PersonasView,
  ProblemFramingView,
  ResearchView,
  UserStoriesView,
  UxStrategyView,
} from "@/components/workspace/stage-views";
import { VersionHistoryDialog } from "@/components/workspace/version-history-dialog";
import { WireframeCanvas } from "@/components/workspace/wireframe-canvas";
import { toFriendlyMessage } from "@/lib/friendly-error";
import { layoutIaSitemap } from "@/lib/ia-layout";
import { layoutUserFlow } from "@/lib/user-flow-layout";
import type { FlowData } from "@/lib/flow-artifact";
import {
  getTopologicalOrder,
  PLATFORM_OPTIONS,
  STAGES,
  type Platform,
  type StageId,
  type StoredResearchBrief,
} from "@/lib/pipeline";

const PLATFORM_LABEL: Record<Platform, string> = {
  web: "Web",
  mobile: "Mobile",
  both: "Both",
};

const TONE_OPTIONS: Partial<Record<StageId, { value: string; label: string }[]>> = {
  problem_framing: [
    { value: "neutral", label: "Neutral" },
    { value: "brutal-critique", label: "Brutally Honest Critique" },
  ],
  user_stories: [
    { value: "neutral", label: "Neutral" },
    { value: "sarcastic-standup", label: "Sarcastic Dev Standup" },
  ],
};

const STAGE_ICONS: Record<StageId, React.ComponentType<{ className?: string }>> = {
  research_brief: Search,
  problem_framing: Target,
  personas: Users,
  user_stories: ListChecks,
  ia_sitemap: MapIcon,
  user_flow: Workflow,
  ux_strategy: Compass,
  ai_interaction_design: Bot,
  wireframes: LayoutTemplate,
};

// A distinct accent per specialist so the grid reads as a colorful team
// roster rather than a wall of identical gray icons.
const STAGE_ACCENT: Record<StageId, { icon: string; chip: string }> = {
  research_brief: { icon: "text-sky-600 dark:text-sky-400", chip: "bg-sky-500/10" },
  problem_framing: { icon: "text-rose-600 dark:text-rose-400", chip: "bg-rose-500/10" },
  personas: { icon: "text-violet-600 dark:text-violet-400", chip: "bg-violet-500/10" },
  user_stories: { icon: "text-amber-600 dark:text-amber-400", chip: "bg-amber-500/10" },
  ia_sitemap: { icon: "text-emerald-600 dark:text-emerald-400", chip: "bg-emerald-500/10" },
  user_flow: { icon: "text-cyan-600 dark:text-cyan-400", chip: "bg-cyan-500/10" },
  ux_strategy: { icon: "text-fuchsia-600 dark:text-fuchsia-400", chip: "bg-fuchsia-500/10" },
  ai_interaction_design: { icon: "text-indigo-600 dark:text-indigo-400", chip: "bg-indigo-500/10" },
  wireframes: { icon: "text-orange-600 dark:text-orange-400", chip: "bg-orange-500/10" },
};

export function PipelineView({
  projectId,
  initialArtifacts,
  initialIaDiagram,
  initialUserFlowDiagram,
  projectPlatform,
}: {
  projectId: string;
  initialArtifacts: Partial<Record<StageId, unknown>>;
  initialIaDiagram?: FlowData;
  initialUserFlowDiagram?: FlowData;
  projectPlatform: Platform;
}) {
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [activeStage, setActiveStage] = useState<StageId | null>(null);
  const [runningStage, setRunningStage] = useState<StageId | null>(null);
  const [errors, setErrors] = useState<Partial<Record<StageId, string>>>({});
  const [researchMode, setResearchMode] = useState<"simple" | "gossip">("simple");
  const [convertingGossip, setConvertingGossip] = useState(false);
  const [toneByStage, setToneByStage] = useState<Partial<Record<StageId, string>>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [wireframePlatform, setWireframePlatform] = useState<Platform>(projectPlatform);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Lets the command palette's "Run next specialist" jump here via
  // ?run=next instead of needing to share live pipeline state globally.
  useEffect(() => {
    if (searchParams.get("run") !== "next") return;
    router.replace(pathname);

    const nextId = getTopologicalOrder().find((id) => artifacts[id] === undefined);
    if (nextId) {
      setActiveStage(nextId);
      void runStage(nextId);
    }
    // Intentionally runs once per mount, for the param present at load time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runStage(stageId: StageId): Promise<boolean> {
    setRunningStage(stageId);
    setErrors((prev) => ({ ...prev, [stageId]: undefined }));

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          stageId,
          tone: toneByStage[stageId],
          platform: stageId === "wireframes" ? wireframePlatform : undefined,
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof body?.error === "string" ? body.error : "Stage generation failed",
        );
      }

      setArtifacts((prev) => ({ ...prev, [stageId]: body.data }));
      if (stageId === "research_brief") setResearchMode("simple");
      return true;
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [stageId]: toFriendlyMessage(err instanceof Error ? err.message : "Something went wrong"),
      }));
      return false;
    } finally {
      setRunningStage(null);
    }
  }

  async function runAll() {
    setRunningAll(true);
    try {
      for (const stageId of getTopologicalOrder()) {
        if (artifacts[stageId] !== undefined) continue;
        setActiveStage(stageId);
        const ok = await runStage(stageId);
        if (!ok) break;
      }
    } finally {
      setRunningAll(false);
    }
  }

  async function convertGossip() {
    setConvertingGossip(true);
    setErrors((prev) => ({ ...prev, research_brief: undefined }));

    try {
      const res = await fetch("/api/pipeline/gossip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof body?.error === "string" ? body.error : "Gossip conversion failed",
        );
      }

      setArtifacts((prev) => ({ ...prev, research_brief: body.data }));
      setResearchMode("gossip");
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        research_brief: toFriendlyMessage(err instanceof Error ? err.message : "Something went wrong"),
      }));
    } finally {
      setConvertingGossip(false);
    }
  }

  const activeDef = activeStage ? STAGES.find((s) => s.id === activeStage) : undefined;
  const activeData = activeStage ? artifacts[activeStage] : undefined;
  const activeMissing = activeDef?.prerequisites.filter((p) => artifacts[p] === undefined) ?? [];
  const isRunning = activeStage !== null && runningStage === activeStage;

  const doneCount = STAGES.filter((s) => artifacts[s.id] !== undefined).length;
  const nextStageId = getTopologicalOrder().find((id) => artifacts[id] === undefined);
  const nextStage = nextStageId ? STAGES.find((s) => s.id === nextStageId) : undefined;

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {doneCount === STAGES.length
            ? "All specialists have run for this project."
            : doneCount === 0
              ? "Pick a specialist to run, or run them all in a sensible order."
              : `${doneCount} of ${STAGES.length} specialists done. Suggested next: ${nextStage?.title}.`}
        </p>
        {doneCount < STAGES.length && (
          <Button size="sm" onClick={runAll} disabled={runningAll || runningStage !== null}>
            {runningAll ? "Running all…" : "Run All"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((stage) => {
          const Icon = STAGE_ICONS[stage.id];
          const accent = STAGE_ACCENT[stage.id];
          const done = artifacts[stage.id] !== undefined;
          const missing = stage.prerequisites.filter((p) => artifacts[p] === undefined);
          const isActive = activeStage === stage.id;

          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(isActive ? null : stage.id)}
              className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isActive ? "border-primary bg-accent" : "border-border"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className={`flex size-8 items-center justify-center rounded-md ${accent.chip}`}>
                  <Icon className={`size-4 ${accent.icon}`} />
                </span>
                {done && <CheckCircle2 className="size-4 text-primary" />}
              </div>
              <span className="text-sm font-medium">{stage.title}</span>
              {missing.length > 0 && !done && (
                <span className="text-xs text-muted-foreground">
                  needs {missing.map((m) => STAGES.find((s) => s.id === m)?.title).join(", ")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeDef && (
        <div className="mt-4 flex flex-col gap-3">
          {errors[activeDef.id] && (
            <p className="text-sm text-destructive">{errors[activeDef.id]}</p>
          )}

          {activeData === undefined ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {activeDef.title} hasn&apos;t run yet
                </CardTitle>
                <CardDescription>
                  {activeMissing.length > 0
                    ? `Run ${activeMissing
                        .map((m) => STAGES.find((s) => s.id === m)?.title)
                        .join(" and ")} first.`
                    : `Generate this project's ${activeDef.title.toLowerCase()}.`}
                </CardDescription>
              </CardHeader>
              <div className="flex flex-col gap-3 px-4 pb-4">
                {TONE_OPTIONS[activeDef.id] && (
                  <div className="flex items-center gap-2">
                    {TONE_OPTIONS[activeDef.id]!.map((opt) => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={
                          (toneByStage[activeDef.id] ?? "neutral") === opt.value
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setToneByStage((prev) => ({ ...prev, [activeDef.id]: opt.value }))
                        }
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                )}
                {activeDef.id === "wireframes" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Platform:</span>
                    {PLATFORM_OPTIONS.map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant={wireframePlatform === p ? "default" : "outline"}
                        onClick={() => setWireframePlatform(p)}
                      >
                        {PLATFORM_LABEL[p]}
                      </Button>
                    ))}
                  </div>
                )}
                <Button
                  className="w-fit"
                  onClick={() => runStage(activeDef.id)}
                  disabled={activeMissing.length > 0 || isRunning}
                >
                  {isRunning ? "Running…" : `Run ${activeDef.title}`}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                {activeDef.id === "research_brief" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={researchMode === "simple" ? "default" : "outline"}
                      onClick={() => setResearchMode("simple")}
                    >
                      Simple
                    </Button>
                    {(activeData as StoredResearchBrief).gossip ? (
                      <Button
                        size="sm"
                        variant={researchMode === "gossip" ? "default" : "outline"}
                        onClick={() => setResearchMode("gossip")}
                      >
                        Gossip
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={convertGossip}
                        disabled={convertingGossip}
                      >
                        {convertingGossip ? "Converting…" : "Convert to Gossip mode"}
                      </Button>
                    )}
                  </div>
                ) : activeDef.id === "wireframes" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Platform:</span>
                    {PLATFORM_OPTIONS.map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant={wireframePlatform === p ? "default" : "outline"}
                        onClick={() => setWireframePlatform(p)}
                      >
                        {PLATFORM_LABEL[p]}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <VersionHistoryDialog
                    projectId={projectId}
                    type={activeDef.id}
                    onRestored={(data) =>
                      setArtifacts((prev) => ({ ...prev, [activeDef.id]: data }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runStage(activeDef.id)}
                    disabled={isRunning}
                  >
                    {isRunning ? "Regenerating…" : "Regenerate"}
                  </Button>
                </div>
              </div>

              {activeDef.id === "research_brief" && (
                <ResearchView
                  data={
                    ((activeData as StoredResearchBrief)[researchMode] ??
                      (activeData as StoredResearchBrief).simple) as never
                  }
                />
              )}
              {activeDef.id === "problem_framing" && (
                <ProblemFramingView data={activeData as never} />
              )}
              {activeDef.id === "personas" && <PersonasView data={activeData as never} />}
              {activeDef.id === "user_stories" && (
                <UserStoriesView data={activeData as never} />
              )}
              {activeDef.id === "ux_strategy" && <UxStrategyView data={activeData as never} />}
              {activeDef.id === "ai_interaction_design" && (
                <AiInteractionDesignView data={activeData as never} />
              )}
              {activeDef.id === "wireframes" && (
                <WireframeCanvas projectId={projectId} data={activeData as never} />
              )}
              {activeDef.id === "ia_sitemap" && (
                <div className="h-[500px] rounded-lg border">
                  <FlowEditor
                    projectId={projectId}
                    artifactType="ia_diagram"
                    artifactTitle="IA diagram"
                    initial={initialIaDiagram ?? layoutIaSitemap(activeData as never)}
                  />
                </div>
              )}
              {activeDef.id === "user_flow" && (
                <div className="h-[500px] rounded-lg border">
                  <FlowEditor
                    projectId={projectId}
                    artifactType="user_flow_diagram"
                    artifactTitle="User flow diagram"
                    initial={initialUserFlowDiagram ?? layoutUserFlow(activeData as never)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
