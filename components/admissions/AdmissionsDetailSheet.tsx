"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  metadata,
  children,
}: {
  title: string;
  description: string;
  returnFocusHref: string;
  metadata?: { title: string; description: string; canonical: string };
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!metadata) return;
    // Next can retain the primary route's head during a parallel-slot navigation.
    const previousTitle = document.title;
    document.title = metadata.title;
    const changes = [
      {
        tag: "link",
        key: "rel",
        name: "canonical",
        attribute: "href",
        value: metadata.canonical,
      },
      {
        tag: "meta",
        key: "name",
        name: "description",
        attribute: "content",
        value: metadata.description,
      },
      {
        tag: "meta",
        key: "property",
        name: "og:url",
        attribute: "content",
        value: metadata.canonical,
      },
      {
        tag: "meta",
        key: "property",
        name: "og:title",
        attribute: "content",
        value: metadata.title,
      },
      {
        tag: "meta",
        key: "property",
        name: "og:description",
        attribute: "content",
        value: metadata.description,
      },
    ].map(({ tag, key, name, attribute, value }) => {
      let node = document.head.querySelector<HTMLElement>(
        tag + "[" + key + '="' + name + '"]',
      );
      const created = !node;
      if (!node) {
        node = document.createElement(tag);
        node.setAttribute(key, name);
        document.head.appendChild(node);
      }
      const previous = node.getAttribute(attribute);
      node.setAttribute(attribute, value);
      return { node, attribute, value, previous, created };
    });
    return () => {
      if (document.title === metadata.title) document.title = previousTitle;
      for (const { node, attribute, value, previous, created } of changes) {
        // A newer route may already have replaced its metadata.
        if (!node.isConnected || node.getAttribute(attribute) !== value)
          continue;
        if (created) node.remove();
        else if (previous === null) node.removeAttribute(attribute);
        else node.setAttribute(attribute, previous);
      }
    };
  }, [metadata]);

  function closeAndRestoreFocus() {
    router.back();
    let attempts = 0;
    const restore = () => {
      const remembered = window.deetnutsAdmissionsTrigger;
      const trigger = remembered?.isConnected
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
        className="mht-college-sheet w-full p-0 sm:max-w-xl"
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">{description}</SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  );
}
