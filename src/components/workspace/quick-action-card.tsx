"use client";

import { useTransition } from "react";
import { createProjectAndRedirect } from "@/app/actions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickActionCard({
  title,
  description,
  defaultName,
  defaultDescription,
}: {
  title: string;
  description: string;
  defaultName: string;
  defaultDescription: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Card
      role="button"
      aria-disabled={pending}
      onClick={() => {
        if (pending) return;
        startTransition(() => {
          void createProjectAndRedirect(defaultName, defaultDescription);
        });
      }}
      className="cursor-pointer transition-colors hover:bg-accent"
    >
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{pending ? "Creating…" : description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
