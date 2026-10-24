"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, FolderOpen, MessageSquare, Plus, Sparkles } from "lucide-react";
import { createProjectFromTemplate } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toFriendlyMessage } from "@/lib/friendly-error";
import type { SearchHit } from "@/lib/knowledge-brain";
import type { Patterns } from "@/lib/patterns";

const KIND_ICON = {
  project: FolderOpen,
  artifact: FileText,
  message: MessageSquare,
} as const;

const KIND_LABEL = {
  project: "Project",
  artifact: "Artifact",
  message: "Conversation",
} as const;

export function KnowledgeBrainSearch() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [findingPatterns, setFindingPatterns] = useState(false);
  const [patternsError, setPatternsError] = useState<string | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);
  const [, startCreating] = useTransition();

  async function runSearch() {
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/knowledge-brain/search?q=${encodeURIComponent(q)}`);
      const body = await res.json();
      setHits(body.hits ?? []);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }

  function applyTemplate(template: string) {
    if (creatingTemplate) return;
    setCreatingTemplate(template);
    startCreating(() => {
      void createProjectFromTemplate(template);
    });
  }

  async function findPatterns() {
    setFindingPatterns(true);
    setPatternsError(null);
    try {
      const res = await fetch("/api/knowledge-brain/patterns", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(typeof body?.error === "string" ? body.error : "Pattern analysis failed");
      }
      setPatterns(body.data);
    } catch (err) {
      setPatternsError(toFriendlyMessage(err instanceof Error ? err.message : "Something went wrong"));
    } finally {
      setFindingPatterns(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge Brain</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe anything you remember — a project, a research topic, a past conversation —
          and find it again.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="e.g. 'that habit tracker thing'"
        />
      </div>

      {searching && <p className="text-sm text-muted-foreground">Searching…</p>}

      {searched && !searching && hits.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing found for that.</p>
      )}

      <div className="flex flex-col gap-2">
        {hits.map((hit) => {
          const Icon = KIND_ICON[hit.kind];
          const href = hit.projectId ? `/project/${hit.projectId}` : "#";

          return (
            <Link key={`${hit.kind}-${hit.id}`} href={href}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {KIND_LABEL[hit.kind]}
                    </span>
                  </div>
                  <CardTitle className="text-sm">{hit.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{hit.snippet}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Patterns across your projects
          </h2>
          <Button size="sm" variant="outline" onClick={findPatterns} disabled={findingPatterns}>
            <Sparkles className="size-3.5" />
            {findingPatterns ? "Analyzing…" : "Find patterns"}
          </Button>
        </div>

        {patternsError && <p className="text-sm text-destructive">{patternsError}</p>}

        {patterns && (
          <div className="flex flex-col gap-3">
            {patterns.recurringPersonas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recurring personas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {patterns.recurringPersonas.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {patterns.recurringProblems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recurring problems</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {patterns.recurringProblems.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {patterns.suggestedTemplates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Suggested templates</CardTitle>
                  <CardDescription>
                    Click one to start a new project pre-seeded with that idea.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {patterns.suggestedTemplates.map((template, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      disabled={creatingTemplate !== null}
                      className="flex items-start gap-2 rounded-md border p-2 text-left text-sm transition-colors hover:bg-accent disabled:opacity-60"
                    >
                      <Plus className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span>
                        {template}
                        {creatingTemplate === template && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            Creating…
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
