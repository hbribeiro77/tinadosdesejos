"use client";

import { useState, type FormEvent } from "react";
import { clientFetchWishAppAccessGateV1Post } from "@/lib/client-fetch-wish-app-access-gate-v1-api";

export function WishAppAccessGateEntrarFormClient() {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await clientFetchWishAppAccessGateV1Post(secret);
      if (!result.ok) {
        setError(result.message || "Secret inválido.");
        return;
      }
      window.location.href = "/";
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm text-zinc-800 dark:text-zinc-100">
        <span className="font-medium">Secret de acesso</span>
        <input
          type="password"
          name="secret"
          autoComplete="current-password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          disabled={pending}
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none ring-amber-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !secret.trim()}
        className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-700 dark:hover:bg-amber-600"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
