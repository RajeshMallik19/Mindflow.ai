"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { upsertArtifact } from "@/lib/artifacts";
import type { StoredResearchBrief } from "@/lib/pipeline";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) return;

  await db.project.create({ data: { name, description } });
  revalidatePath("/");
}

export async function createProjectAndRedirect(name: string, description: string) {
  const project = await db.project.create({ data: { name, description } });
  revalidatePath("/");
  redirect(`/project/${project.id}`);
}

export async function createProjectFromResearch(
  name: string,
  topic: string,
  research: StoredResearchBrief,
) {
  const project = await db.project.create({
    data: { name, description: topic },
  });

  await upsertArtifact({
    projectId: project.id,
    type: "research_brief",
    title: "Research",
    content: JSON.stringify(research),
  });

  revalidatePath("/");
  redirect(`/project/${project.id}`);
}
