"use client";

import { useState } from "react";
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
  WireframesView,
} from "@/components/workspace/stage-views";
import { layoutIaSitemap } from "@/lib/ia-layout";
import type { FlowData } from "@/lib/flow-artifact";
import { STAGES, type StageId, type StoredResearchBrief } from "@/lib/pipeline";

const STAGE_ICONS: Record<StageId, React.ComponentType<{ className?: string }>> = {
  research_brief: Search,
  problem_framing: Target,
  personas: Users,
  user_stories: ListChecks,
  ia_sitemap: MapIcon,
  ux_strategy: Compass,
  ai_interaction_design: Bot,
  wireframes: LayoutTemplate,
};

export function PipelineView({
  projectId,
  initialArtifacts,
  initialIaDiagram,
}: {
  projectId: string;
  initialArtifacts: Partial<Record<StageId, unknown>>;
  initialIaDiagram?: FlowData;
}) {
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [activeStage, setActiveStage] = useState<StageId | null>(null);
  const [runningStage, setRunningStage] = useState<StageId | null>(null);
  const [errors, setErrors] = useState<Partial<Record<StageId, string>>>({});
  const [researchMode, setResearchMode] = useState<"simple" | "gossip">("simple");
  const [convertingGossip, setConvertingGossip] = useState(false);

  async function runStage(stageId: StageId) {
    setRunningStage(stageId);
    setErrors((prev) => ({ ...prev, [stageId]: undefined }));

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, stageId }),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof body?.error === "string" ? body.error : "Stage generation failed",
        );
      }

      setArtifacts((prev) => ({ ...prev, [stageId]: body.data }));
      if (stageId === "research_brief") setResearchMode("simple");
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [stageId]: err instanceof Error ? err.message : "Something went wrong",
      }));
    } finally {
      setRunningStage(null);
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
        research_brief: err instanceof Error ? err.message : "Something went wrong",
      }));
    } finally {
      setConvertingGossip(false);
    }
  }

  const activeDef = activeStage ? STAGES.find((s) => s.id === activeStage) : undefined;
  const activeData = activeStage ? artifacts[activeStage] : undefined;
  const activeMissing = activeDef?.prerequisites.filter((p) => artifacts[p] === undefined) ?? [];
  const isRunning = activeStage !== null && runningStage === activeStage;

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-4">
      <p className="mb-3 text-sm text-muted-foreground">
        Pick a specialist to run. More context from other specialists makes each one better,
        but nothing is forced into a fixed order.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((stage) => {
          const Icon = STAGE_ICONS[stage.id];
          const done = artifacts[stage.id] !== undefined;
          const missing = stage.prerequisites.filter((p) => artifacts[p] === undefined);
          const isActive = activeStage === stage.id;

          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(isActive ? null : stage.id)}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                isActive ? "border-primary bg-accent" : "border-border"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <Icon className="size-4 text-muted-foreground" />
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
              <div className="px-4 pb-4">
                <Button
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
                ) : (
                  <div />
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runStage(activeDef.id)}
                  disabled={isRunning}
                >
                  {isRunning ? "Regenerating…" : "Regenerate"}
                </Button>
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
              {activeDef.id === "wireframes" && <WireframesView data={activeData as never} />}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
