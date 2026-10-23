
import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai-provider";
import { db } from "@/lib/db";
import { routeTask } from "@/lib/orchestrator";
import { buildSubagentPrompt } from "@/lib/subagent-prompts";
import { SUBAGENTS } from "@/lib/subagents";

const RequestSchema = z.object({
  task: z.string().min(1),
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query param is required" },
      { status: 400 },
    );
  }

  const conversation = await db.conversation.findFirst({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    return NextResponse.json({ conversationId: null, messages: [] });
  }

  const messages = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    conversationId: conversation.id,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      subagentName: SUBAGENTS.find((s) => s.id === m.subagentId)?.name,
    })),
  });
}

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { task, projectId, conversationId } = parsed.data;
  const subagent = routeTask(task);
  const prompt = buildSubagentPrompt(subagent, task);

  let conversation;
  try {
    if (conversationId) {
      conversation = await db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    } else if (projectId) {
      const existing = await db.conversation.findFirst({
        where: { projectId },
        orderBy: { updatedAt: "desc" },
      });
      conversation = existing
        ? await db.conversation.update({
            where: { id: existing.id },
            data: { updatedAt: new Date() },
          })
        : await db.conversation.create({
            data: { projectId, title: task.slice(0, 60) },
          });
    } else {
      conversation = await db.conversation.create({
        data: { title: task.slice(0, 60) },
      });
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not create or update the conversation",
      },
      { status: 500 },
    );
  }

  try {
    await db.message.create({
      data: { conversationId: conversation.id, role: "user", content: task },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not save the message",
      },
      { status: 500 },
    );
  }

  let provider;
  try {
    provider = getProvider();
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "AI provider failed",
      },
      { status: 502 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let output = "";

      const send = (event: object) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        send({
          type: "meta",
          conversationId: conversation.id,
          subagent: {
            id: subagent.id,
            name: subagent.name,
            title: subagent.title,
          },
        });

        for await (const chunk of provider.stream(prompt)) {
          output += chunk;
          send({ type: "chunk", text: chunk });
        }

        await db.message.create({
          data: {
            conversationId: conversation.id,
            role: "subagent",
            subagentId: subagent.id,
            content: output,
          },
        });

        send({ type: "done" });
      } catch (err) {
        send({
          type: "error",
          error: err instanceof Error ? err.message : "AI provider failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
