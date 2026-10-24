"use client";

import { useState } from "react";
import {
  CheckCircle2,
  LayoutTemplate,
  ListChecks,
  Map as MapIcon,
  Search,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlowEditor } from "@/components/workspace/flow-editor";
import {
  PersonasView,
  ResearchView,
  UserStoriesView,
  WireframesView,
} from "@/components/workspace/stage-views";
import { layoutIaSitemap } from "@/lib/ia-layout";
import type { FlowData } from "@/lib/flow-artifact";
import { STAGES, type StageId, type StoredResearchBrief } from "@/lib/pipeline";

const STAGE_ICONS: Record<StageId, React.ComponentType<{ className?: string }>> = {
  research_brief: Search,
  personas: Users,
  user_stories: ListChecks,
  ia_sitemap: MapIcon,
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
  const [activeTab, setActiveTab] = useState<StageId>(STAGES[0].id);
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

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as StageId)}
      className="flex h-full flex-col"
    >
      <TabsList className="mx-4 mt-3 w-fit">
        {STAGES.map((stage) => {
          const Icon = STAGE_ICONS[stage.id];
          const done = artifacts[stage.id] !== undefined;
          return (
            <TabsTrigger key={stage.id} value={stage.id}>
              <Icon className="size-3.5" />
              {stage.title}
              {done && <CheckCircle2 className="size-3.5 text-primary" />}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {STAGES.map((stage) => {
          const data = artifacts[stage.id];
          const missing = stage.prerequisites.filter((p) => artifacts[p] === undefined);
          const isRunning = runningStage === stage.id;

          return (
            <TabsContent key={stage.id} value={stage.id} className="mt-0">
              {errors[stage.id] && (
                <p className="mb-3 text-sm text-destructive">{errors[stage.id]}</p>
              )}

              {!data ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{stage.title} hasn&apos;t run yet</CardTitle>
                    <CardDescription>
                      {missing.length > 0
                        ? `Run ${missing
                            .map((m) => STAGES.find((s) => s.id === m)?.title)
                            .join(" and ")} first.`
                        : `Generate this project's ${stage.title.toLowerCase()}.`}
                    </CardDescription>
                  </CardHeader>
                  <div className="px-4 pb-4">
                    <Button
                      onClick={() => runStage(stage.id)}
                      disabled={missing.length > 0 || isRunning}
                    >
                      {isRunning ? "Running…" : `Run ${stage.title}`}
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    {stage.id === "research_brief" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={researchMode === "simple" ? "default" : "outline"}
                          onClick={() => setResearchMode("simple")}
                        >
                          Simple
                        </Button>
                        {(data as StoredResearchBrief).gossip ? (
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
                      onClick={() => runStage(stage.id)}
                      disabled={isRunning}
                    >
                      {isRunning ? "Regenerating…" : "Regenerate"}
                    </Button>
                  </div>

                  {stage.id === "research_brief" && (
                    <ResearchView
                      data={
                        ((data as StoredResearchBrief)[researchMode] ??
                          (data as StoredResearchBrief).simple) as never
                      }
                    />
                  )}
                  {stage.id === "personas" && <PersonasView data={data as never} />}
                  {stage.id === "user_stories" && <UserStoriesView data={data as never} />}
                  {stage.id === "wireframes" && <WireframesView data={data as never} />}
                  {stage.id === "ia_sitemap" && (
                    <div className="h-[500px] rounded-lg border">
                      <FlowEditor
                        projectId={projectId}
                        artifactType="ia_diagram"
                        artifactTitle="IA diagram"
                        initial={initialIaDiagram ?? layoutIaSitemap(data as never)}
                      />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
}
