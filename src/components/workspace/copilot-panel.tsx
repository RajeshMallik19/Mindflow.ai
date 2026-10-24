
"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StreamEvent =
  | { type: "meta"; conversationId: string }
  | { type: "chunk"; text: string }
  | { type: "done" }
  | { type: "error"; error: string };

const WELCOME_MESSAGE: CopilotMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "I'm the MindFlow assistant. Ask me anything — I'll use your project history and knowledge base to help.",
};

export function CopilotPanel({ projectId }: { projectId?: string }) {
  const [messages, setMessages] = useState<CopilotMessage[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(!projectId);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    fetch(`/api/orchestrator?projectId=${encodeURIComponent(projectId)}`)
      .then((res) => res.json())
      .then((data: { conversationId: string | null; messages: Array<{ id: string; role: string; content: string }> }) => {
        if (cancelled) return;

        if (data.conversationId && data.messages.length > 0) {
          setConversationId(data.conversationId);
          setMessages(
            data.messages.map((m) => ({
              id: m.id,
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
            })),
          );
        }
      })
      .catch(() => {
        // History failed to load — fall back to the welcome message, non-fatal.
      })
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

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
        body: JSON.stringify({ task: text, projectId, conversationId }),
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
    <aside className="flex h-full w-80 shrink-0 flex-col border-l bg-muted/50">
      <div className="px-4 py-4">
        <span className="text-sm font-semibold tracking-tight">
          AI Copilot
        </span>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="flex flex-col gap-3">
          {!historyLoaded && (
            <p className="px-1 text-sm text-muted-foreground">Loading history…</p>
          )}

          {messages.map((message) => (
            <div key={message.id} className="flex flex-col gap-1">
              <div
                className={
                  message.role === "assistant"
                    ? "rounded-md bg-muted px-3 py-2 text-sm [&_*]:my-1 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_strong]:font-semibold"
                    : "whitespace-pre-wrap rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                }
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}

                {pending &&
                  message.role === "assistant" &&
                  message.id === messages[messages.length - 1]?.id &&
                  !message.content && (
                    <span className="text-muted-foreground">Thinking...</span>
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
