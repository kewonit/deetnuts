"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { MHT_LAYER } from "@/components/admissions/mht-font";

interface LoginRequiredDialogProps {
  open: boolean;
  redirectTo: string;
  onOpenChange: (open: boolean) => void;
}

export function LoginRequiredDialog({ open, redirectTo, onOpenChange }: LoginRequiredDialogProps) {
  const encodedRedirect = encodeURIComponent(redirectTo || "/mht-cet/state-cutoffs");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={`${MHT_LAYER} mht-dialog-overlay`} />
        <Dialog.Content className={`${MHT_LAYER} mht-dialog`} aria-describedby={undefined}>
          <Dialog.Title className="mht-dialog-title">Log in to keep searching</Dialog.Title>
          <div className="mht-dialog-actions">
            <Link className="mht-btn mht-btn-ghost" href={`/signup?redirect=${encodedRedirect}`}>
              Create account
            </Link>
            <Link className="mht-btn mht-btn-primary" href={`/login?redirect=${encodedRedirect}`}>
              Log in
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
