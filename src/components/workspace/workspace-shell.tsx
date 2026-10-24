"use client";

import type { ReactNode } from "react";
import { Menu, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Desktop keeps the fixed 3-column layout (sidebar | content | copilot).
// Below md, sidebar and copilot collapse into Sheet-triggered slide-outs
// behind a small top bar, since fixed w-64/w-80 columns don't fit a phone.
export function WorkspaceShell({
  sidebar,
  copilot,
  children,
}: {
  sidebar: ReactNode;
  copilot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-2 py-1.5 md:hidden">
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            {sidebar}
          </SheetContent>
        </Sheet>

        <span className="text-sm font-semibold tracking-tight">MindFlow AI</span>

        {copilot ? (
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MessageSquare className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              {copilot}
            </SheetContent>
          </Sheet>
        ) : (
          <div className="size-7" />
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">{sidebar}</div>
        {children}
        {copilot && <div className="hidden md:block">{copilot}</div>}
      </div>
    </div>
  );
}
