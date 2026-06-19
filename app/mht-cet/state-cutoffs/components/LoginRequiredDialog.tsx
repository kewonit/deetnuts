"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginRequiredDialogProps {
  open: boolean;
  redirectTo: string;
  onOpenChange: (open: boolean) => void;
}

export function LoginRequiredDialog({
  open,
  redirectTo,
  onOpenChange,
}: LoginRequiredDialogProps) {
  const safeRedirect = redirectTo || "/mht-cet/state-cutoffs";
  const encodedRedirect = encodeURIComponent(safeRedirect);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-amber-100">
            <LockKeyhole className="h-6 w-6 text-amber-700" />
          </div>
          <DialogTitle>Please login to continue using.</DialogTitle>
          <DialogDescription className="text-gray-700">
            We keep a small free preview open for everyone, then ask for login
            so the cutoff tool stays useful and protected from spam.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="neutral" asChild>
            <Link href={`/signup?redirect=${encodedRedirect}`}>
              Create account
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/login?redirect=${encodedRedirect}`}>Login</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
