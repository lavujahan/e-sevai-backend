"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "danger" | "secondary";
}) {
  const { pending } = useFormStatus();

  const styles: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    secondary:
      "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800",
  };

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${styles[variant]}`}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
