import { db } from "./db";

export async function upsertArtifact({
  projectId,
  type,
  title,
  content,
}: {
  projectId: string;
  type: string;
  title: string;
  content: string;
}) {
  const existing = await db.artifact.findFirst({ where: { projectId, type } });

  return existing
    ? db.$transaction(async (tx) => {
        await tx.artifactVersion.create({
          data: { artifactId: existing.id, content: existing.content },
        });
        return tx.artifact.update({
          where: { id: existing.id },
          data: { content, title },
        });
      })
    : db.artifact.create({ data: { projectId, type, title, content } });
}
