"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, FolderOpen, MessageSquare } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SearchHit } from "@/lib/knowledge-brain";

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
    </div>
  );
}
