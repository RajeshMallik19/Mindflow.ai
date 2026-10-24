"use client";

import { useTransition } from "react";
import { createProjectAndRedirect } from "@/app/actions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickActionCard({
  title,
  description,
  defaultName,
  defaultDescription,
  icon,
  chipClassName,
}: {
  title: string;
  description: string;
  defaultName: string;
  defaultDescription: string;
  icon: React.ReactNode;
  chipClassName: string;
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
      className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <CardHeader>
        <span className={`mb-1 flex size-8 items-center justify-center rounded-md ${chipClassName}`}>
          {icon}
        </span>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{pending ? "Creating…" : description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
