import { useEffect } from "react";

/**
 * Evita que a página atrás da modal continue rolando (scroll chaining) enquanto o overlay está ativo.
 * Restaura `overflow` de `html` e `body` ao fechar ou desmontar.
 */
export function useLockDocumentBodyScrollWhileTruthyForModalOverlay(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [locked]);
}
