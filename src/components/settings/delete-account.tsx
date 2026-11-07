"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteAccount } from "@/lib/auth/actions";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await deleteAccount({ confirm }); // redirects to the home page on success
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <section className="rounded-xl border border-destructive/40 bg-card p-6">
      <h2 className="font-serif text-2xl">Delete account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently deletes your account, resumes, stored files, analyses, interviews, answers and reports.
        This cannot be undone.
      </p>
      <Button variant="destructive" className="mt-4" onClick={() => { setConfirm(""); setOpen(true); }}>
        Delete my account
      </Button>

      <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Everything you have stored here will be erased. Type DELETE to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete">Confirmation</Label>
            <Input
              id="confirm-delete" value={confirm} autoComplete="off" placeholder="DELETE"
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirm !== "DELETE" || pending}
              onClick={(e) => { e.preventDefault(); onDelete(); }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? "Deleting..." : "Delete everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}