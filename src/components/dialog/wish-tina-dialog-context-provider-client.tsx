"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type WishTinaDialogApi = {
  alert: (message: string) => Promise<void>;
  confirm: (message: string) => Promise<boolean>;
};

const WishTinaDialogContext = createContext<WishTinaDialogApi | null>(null);

type DialogOpen =
  | { kind: "closed" }
  | { kind: "alert"; message: string }
  | { kind: "confirm"; message: string };

export function WishTinaDialogContextProviderClient(props: { children: React.ReactNode }) {
  const [open, setOpen] = useState<DialogOpen>({ kind: "closed" });
  const alertResolveRef = useRef<(() => void) | null>(null);
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback(() => {
    setOpen({ kind: "closed" });
  }, []);

  const alertFn = useCallback((message: string) => {
    return new Promise<void>((resolve) => {
      alertResolveRef.current = () => {
        resolve();
        alertResolveRef.current = null;
      };
      setOpen({ kind: "alert", message });
    });
  }, []);

  const confirmFn = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      confirmResolveRef.current = (value: boolean) => {
        resolve(value);
        confirmResolveRef.current = null;
      };
      setOpen({ kind: "confirm", message });
    });
  }, []);

  const onAlertDismiss = useCallback(() => {
    alertResolveRef.current?.();
    close();
  }, [close]);

  const onConfirmResult = useCallback(
    (value: boolean) => {
      confirmResolveRef.current?.(value);
      close();
    },
    [close],
  );

  useEffect(() => {
    if (open.kind === "closed") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (open.kind === "alert") {
          onAlertDismiss();
        } else if (open.kind === "confirm") {
          onConfirmResult(false);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open.kind, onAlertDismiss, onConfirmResult]);

  const value = useMemo(
    () => ({
      alert: alertFn,
      confirm: confirmFn,
    }),
    [alertFn, confirmFn],
  );

  const dialogVisible = open.kind !== "closed";

  return (
    <WishTinaDialogContext.Provider value={value}>
      {props.children}
      {dialogVisible ? (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-violet-950/35 p-4 backdrop-blur-[2px] dark:bg-black/55"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              if (open.kind === "alert") onAlertDismiss();
              else if (open.kind === "confirm") onConfirmResult(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wish-tina-dialog-title"
            className="w-full max-w-md rounded-2xl border border-violet-300/80 bg-gradient-to-b from-violet-50 via-violet-50/98 to-fuchsia-50/85 p-5 text-violet-950 shadow-[0_22px_60px_-20px_rgba(91,33,182,0.35)] dark:border-violet-700/55 dark:from-violet-950/95 dark:via-violet-950/92 dark:to-fuchsia-950/50 dark:text-violet-50 dark:shadow-[0_22px_60px_-20px_rgba(0,0,0,0.65)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200"
                aria-hidden
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div id="wish-tina-dialog-title" className="text-sm font-semibold text-violet-950 dark:text-violet-100">
                  Tina dos desejos
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-violet-900/90 dark:text-violet-100/90">
                  {open.kind === "alert" || open.kind === "confirm" ? open.message : ""}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-violet-200/60 pt-4 dark:border-violet-700/45">
              {open.kind === "confirm" ? (
                <>
                  <button
                    type="button"
                    className="rounded-lg border border-violet-300/90 bg-white/90 px-4 py-2 text-sm font-medium text-violet-900 shadow-sm hover:bg-violet-50 dark:border-violet-600/70 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:bg-violet-900/70"
                    onClick={() => onConfirmResult(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 dark:bg-violet-500 dark:text-violet-950 dark:hover:bg-violet-400"
                    onClick={() => onConfirmResult(true)}
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 dark:bg-violet-500 dark:text-violet-950 dark:hover:bg-violet-400"
                  onClick={onAlertDismiss}
                >
                  Entendi
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </WishTinaDialogContext.Provider>
  );
}

export function useWishTinaDialog(): WishTinaDialogApi {
  const ctx = useContext(WishTinaDialogContext);
  if (!ctx) {
    throw new Error("useWishTinaDialog deve ser usado dentro de WishTinaDialogContextProviderClient.");
  }
  return ctx;
}
