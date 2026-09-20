"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@ejam/ui/components/ui/sheet";

export default function AdmissionsDetailSheet({
  title,
  description,
  returnFocusHref,
  children,
}: {
  title: string;
  description: string;
  returnFocusHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function closeAndRestoreFocus() {
    router.back();
    let attempts = 0;
    const restore = () => {
      const remembered = window.deetnutsAdmissionsTrigger;
      const trigger =
        remembered?.isConnected
          ? remembered
          : [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].find(
              (link) => link.getAttribute("href") === returnFocusHref,
            );
      if (trigger) {
        trigger.focus({ preventScroll: true });
        window.deetnutsAdmissionsTrigger = undefined;
        return;
      }
      attempts += 1;
      if (attempts < 20) window.setTimeout(restore, 50);
    };
    window.setTimeout(restore, 50);
  }

  return (
    <Sheet
      defaultOpen
      onOpenChange={(open) => {
        if (!open) closeAndRestoreFocus();
      }}
    >
      <SheetContent
        side="right"
        className="w-full bg-background p-0 text-foreground sm:max-w-xl"
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">{description}</SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  );
}
