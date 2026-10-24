"use client";

import { useState, useTransition } from "react";
import { createProjectFromResearch } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResearchView } from "@/components/workspace/stage-views";
import { VoiceInputButton } from "@/components/workspace/voice-input-button";
import { toFriendlyMessage } from "@/lib/friendly-error";
import type { ResearchBrief, StoredResearchBrief } from "@/lib/pipeline";

export function ResearchWorkspace() {
  const [topic, setTopic] = useState("");
  const [research, setResearch] = useState<StoredResearchBrief | null>(null);
  const [mode, setMode] = useState<"simple" | "gossip">("simple");
  const [running, setRunning] = useState(false);
  const [convertingGossip, setConvertingGossip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [creating, startCreating] = useTransition();

  async function runResearch() {
    const t = topic.trim();
    if (!t || running) return;

    setRunning(true);
    setError(null);
    setResearch(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(typeof body?.error === "string" ? body.error : "Research failed");
      }

      const simple = body.data as ResearchBrief;
      setResearch({ simple });
      setMode("simple");
      setProjectName(t.length > 60 ? `${t.slice(0, 57)}...` : t);
    } catch (err) {
      setError(toFriendlyMessage(err instanceof Error ? err.message : "Something went wrong"));
    } finally {
      setRunning(false);
    }
  }

  async function convertGossip() {
    if (!research || convertingGossip) return;

    setConvertingGossip(true);
    setError(null);

    try {
      const res = await fetch("/api/research/gossip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: research.simple }),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof body?.error === "string" ? body.error : "Gossip conversion failed",
        );
      }

      setResearch((prev) => (prev ? { ...prev, gossip: body.data } : prev));
      setMode("gossip");
    } catch (err) {
      setError(toFriendlyMessage(err instanceof Error ? err.message : "Something went wrong"));
    } finally {
      setConvertingGossip(false);
    }
  }

  function turnIntoProject() {
    if (!research || !projectName.trim()) return;
    startCreating(() => {
      void createProjectFromResearch(projectName.trim(), topic.trim(), research);
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Research</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Investigate a topic first — decide whether to turn it into a project after.
        </p>
      </div>

      <div className="flex gap-2">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What do you want to research? (e.g. 'why habit-tracking apps lose users')"
          rows={2}
          className="flex-1"
        />
        <VoiceInputButton onResult={(text) => setTopic((prev) => (prev ? `${prev} ${text}` : text))} />
        <Button onClick={runResearch} disabled={running || !topic.trim()}>
          {running ? "Researching…" : "Run Research"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {research && (
        <>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={mode === "simple" ? "default" : "outline"}
              onClick={() => setMode("simple")}
            >
              Simple
            </Button>
            {research.gossip ? (
              <Button
                size="sm"
                variant={mode === "gossip" ? "default" : "outline"}
                onClick={() => setMode("gossip")}
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

          <ResearchView data={research[mode] ?? research.simple} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Turn this into a project?</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
              />
              <Button onClick={turnIntoProject} disabled={creating || !projectName.trim()}>
                {creating ? "Creating…" : "Create project"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
