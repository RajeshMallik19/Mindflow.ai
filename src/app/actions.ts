"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { upsertArtifact } from "@/lib/artifacts";
import { PLATFORM_OPTIONS, type StoredResearchBrief } from "@/lib/pipeline";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const platform = PLATFORM_OPTIONS.find((p) => p === formData.get("platform")) ?? "both";

  if (!name) return;

  await db.project.create({ data: { name, description, platform } });
  revalidatePath("/");
}

export async function createProjectAndRedirect(name: string, description: string) {
  const project = await db.project.create({ data: { name, description } });
  revalidatePath("/");
  redirect(`/project/${project.id}`);
}

export async function renameProject(
  projectId: string,
  name: string,
  description: string,
  platform?: string,
) {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  const resolvedPlatform = PLATFORM_OPTIONS.find((p) => p === platform);

  await db.project.update({
    where: { id: projectId },
    data: {
      name: trimmedName,
      description: description.trim(),
      ...(resolvedPlatform ? { platform: resolvedPlatform } : {}),
    },
  });
  revalidatePath("/");
  revalidatePath(`/project/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await db.project.delete({ where: { id: projectId } });
  revalidatePath("/");
  redirect("/");
}

export async function duplicateProject(projectId: string) {
  const source = await db.project.findUnique({
    where: { id: projectId },
    include: { artifacts: true },
  });
  if (!source) return;

  const copy = await db.project.create({
    data: {
      name: `${source.name} (copy)`,
      description: source.description,
      platform: source.platform,
    },
  });

  if (source.artifacts.length > 0) {
    await db.artifact.createMany({
      data: source.artifacts.map((a) => ({
        projectId: copy.id,
        type: a.type,
        title: a.title,
        content: a.content,
      })),
    });
  }

  revalidatePath("/");
  redirect(`/project/${copy.id}`);
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
