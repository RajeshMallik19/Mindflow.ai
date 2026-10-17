"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) return;

  await db.project.create({ data: { name, description } });
  revalidatePath("/");
}
