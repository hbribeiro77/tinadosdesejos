import { redirect } from "next/navigation";
import { WishAppAccessGateEntrarFormClient } from "@/components/board/wish-app-access-gate-entrar-form-client";
import { wishAppAccessGateIsEnabledFromServerEnvV1 } from "@/lib/wish-app-access-gate-is-enabled-from-server-env-v1";

/** Env do portão só existe em runtime (VPS); não pré-renderizar. */
export const dynamic = "force-dynamic";

export default function WishAppAccessGateEntrarPage() {
  if (!wishAppAccessGateIsEnabledFromServerEnvV1()) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-lg border border-amber-300/70 bg-amber-50 p-6 shadow-sm dark:border-amber-700/50 dark:bg-amber-950/40">
        <h1 className="mb-1 text-xl font-bold tracking-tight text-amber-950 dark:text-amber-50">
          Tina dos desejos
        </h1>
        <p className="mb-6 text-sm text-amber-900/90 dark:text-amber-100/90">
          Informe o secret de acesso para continuar.
        </p>
        <WishAppAccessGateEntrarFormClient />
      </div>
    </div>
  );
}