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

export async function renameProject(projectId: string, name: string, description: string) {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  await db.project.update({
    where: { id: projectId },
    data: { name: trimmedName, description: description.trim() },
  });
  revalidatePath("/");
  revalidatePath(`/project/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await db.project.delete({ where: { id: projectId } });
  revalidatePath("/");
  redirect("/");
}

export async function createProjectFromTemplate(template: string) {
  const name = template.length > 60 ? `${template.slice(0, 57)}...` : template;

  const project = await db.project.create({
    data: { name, description: template },
  });

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
