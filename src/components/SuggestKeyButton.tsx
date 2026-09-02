"use client";

import { WORDLIST } from "@/lib/wordlist";

const WORDS_PER_KEY = 5;

function suggestPassphrase(): string {
  const random = crypto.getRandomValues(new Uint32Array(WORDS_PER_KEY));
  return Array.from(random, (n) => WORDLIST[n % WORDLIST.length]).join("-");
}

/** Fills the named input with a random readable passphrase (same style as the server's default
 * generateApiKey()) so the admin can accept it as-is or edit it before submitting. */
export function SuggestKeyButton({ inputId }: { inputId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const input = document.getElementById(inputId) as HTMLInputElement | null;
        if (!input) return;
        input.value = suggestPassphrase();
        input.focus();
      }}
      className="text-xs font-semibold text-blue-600 dark:text-blue-400"
    >
      Suggest a passphrase
    </button>
  );
}
