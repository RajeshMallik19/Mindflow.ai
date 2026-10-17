"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  subagentName?: string;
};

export function CopilotPanel() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm the MindFlow copilot. Ask me anything, or give me a task and I'll route it to the right subagent.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function send() {
    const text = draft.trim();
    if (!text || pending) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);
    setDraft("");
    setPending(true);

    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: text, conversationId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Request failed");

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.output,
          subagentName: data.subagent?.name,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Something went wrong: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="px-4 py-4">
        <span className="text-sm font-semibold tracking-tight">AI Copilot</span>
      </div>
      <Separator />

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col gap-1">
              {message.subagentName && (
                <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {message.subagentName}
                </span>
              )}
              <div
                className={
                  message.role === "assistant"
                    ? "whitespace-pre-wrap rounded-md bg-zinc-200/60 px-3 py-2 text-sm dark:bg-zinc-800/60"
                    : "whitespace-pre-wrap rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                }
              >
                {message.content}
              </div>
            </div>
          ))}
          {pending && (
            <div className="px-1 text-sm text-zinc-500">Thinking…</div>
          )}
        </div>
      </ScrollArea>

      <Separator />
      <div className="flex flex-col gap-2 p-3">
        <Textarea
          placeholder="Ask the copilot..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={3}
        />
        <Button size="sm" onClick={send} disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </div>
    </aside>
  );
}
