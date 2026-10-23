
"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
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

type StreamEvent =
  | {
      type: "meta";
      conversationId: string;
      subagent: { id: string; name: string; title: string };
    }
  | { type: "chunk"; text: string }
  | { type: "done" }
  | { type: "error"; error: string };

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

    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: text },
      { id: assistantId, role: "assistant", content: "" },
    ]);

    setDraft("");
    setPending(true);

    let assistantContent = "";

    function updateAssistant(content: string) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId ? { ...message, content } : message,
        ),
      );
    }

    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify({ task: text, conversationId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : `Request failed (${res.status})`,
        );
      }

      if (!res.body) {
        throw new Error("The server returned no response stream.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      function handleEvent(event: StreamEvent) {
        if (event.type === "meta") {
          setConversationId(event.conversationId);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, subagentName: event.subagent.name }
                : message,
            ),
          );
        } else if (event.type === "chunk") {
          assistantContent += event.text;

          // Apply each received chunk immediately.
          flushSync(() => {
            updateAssistant(assistantContent);
          });
        } else if (event.type === "error") {
          throw new Error(event.error);
        }
      }

      try {
        while (true) {
          const { value, done } = await reader.read();

          if (value) {
            buffer += decoder.decode(value, { stream: !done });
          } else if (done) {
            buffer += decoder.decode();
          }

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            handleEvent(JSON.parse(line) as StreamEvent);
          }

          if (done) break;
        }

        if (buffer.trim()) {
          handleEvent(JSON.parse(buffer) as StreamEvent);
        }
      } finally {
        reader.releaseLock();
      }

      if (!assistantContent) {
        updateAssistant("(The model returned an empty response.)");
      }
    } catch (err) {
      const errorMessage = `Something went wrong: ${
        err instanceof Error ? err.message : String(err)
      }`;

      updateAssistant(
        assistantContent
          ? `${assistantContent}\n\n${errorMessage}`
          : errorMessage,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="px-4 py-4">
        <span className="text-sm font-semibold tracking-tight">
          AI Copilot
        </span>
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

                {pending &&
                  message.role === "assistant" &&
                  message.id === messages[messages.length - 1]?.id &&
                  !message.content && (
                    <span className="text-zinc-500">Thinking...</span>
                  )}
              </div>
            </div>
          ))}
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
              void send();
            }
          }}
          rows={3}
        />

        <Button size="sm" onClick={() => void send()} disabled={pending}>
          {pending ? "Receiving..." : "Send"}
        </Button>
      </div>
    </aside>
  );
}
