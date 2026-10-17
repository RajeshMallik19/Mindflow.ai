import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai-provider";
import { db } from "@/lib/db";
import { routeTask } from "@/lib/orchestrator";
import { buildSubagentPrompt } from "@/lib/subagent-prompts";

const RequestSchema = z.object({
  task: z.string().min(1),
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { task, projectId, conversationId } = parsed.data;

  const subagent = routeTask(task);
  const prompt = buildSubagentPrompt(subagent, task);

  let output: string;
  try {
    output = await getProvider().generate(prompt);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI provider failed" },
      { status: 502 },
    );
  }

  const conversation = conversationId
    ? await db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })
    : await db.conversation.create({
        data: { projectId, title: task.slice(0, 60) },
      });

  await db.message.create({
    data: { conversationId: conversation.id, role: "user", content: task },
  });
  await db.message.create({
    data: {
      conversationId: conversation.id,
      role: "subagent",
      subagentId: subagent.id,
      content: output,
    },
  });

  return NextResponse.json({
    conversationId: conversation.id,
    subagent: { id: subagent.id, name: subagent.name, title: subagent.title },
    output,
  });
}
