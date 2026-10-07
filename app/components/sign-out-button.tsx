"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue to clear client state anyway.
    }
    router.replace("/");
    router.refresh();
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={busy}
      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
