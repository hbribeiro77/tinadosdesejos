"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type WishKanbanBoardScrollHorizontalToMaximumOptions = {
  /** Chamado depois que o `scrollLeft` foi aplicado (instant) ou a animação smooth terminou (`scrollend` ou fallback). */
  onComplete?: () => void;
};

export type WishKanbanBoardDualSyncedHorizontalScrollbarsHandle = {
  /** Leva o miolo até o fim (`scrollWidth`) com animação suave; a faixa superior acompanha via `onScroll`. */
  scrollHorizontalToMaximum: (options?: WishKanbanBoardScrollHorizontalToMaximumOptions) => void;
};

type WishKanbanBoardDualSyncedHorizontalScrollbarsTopAndBottomClientProps = {
  children: ReactNode;
};

/**
 * Faixa de scroll horizontal **no topo** espelhando o `scrollLeft` do miolo.
 * A barra horizontal de baixo fica só no miolo (evita duas barras empilhadas).
 *
 * O miolo **não** usa `flex-1` na vertical: senão ele estica até a altura da gaveta
 * e a barra horizontal some para baixo da viewport.
 */
export const WishKanbanBoardDualSyncedHorizontalScrollbarsTopAndBottomClient = forwardRef<
  WishKanbanBoardDualSyncedHorizontalScrollbarsHandle,
  WishKanbanBoardDualSyncedHorizontalScrollbarsTopAndBottomClientProps
>(function WishKanbanBoardDualSyncedHorizontalScrollbarsTopAndBottomClient(props, ref) {
  const { children } = props;

  const mainRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const [trackPx, setTrackPx] = useState(0);
  const [showTopStrip, setShowTopStrip] = useState(false);

  const syncScrollLeft = useCallback((source: HTMLDivElement) => {
    const left = source.scrollLeft;
    const main = mainRef.current;
    const top = topRef.current;
    if (main && main !== source && main.scrollLeft !== left) main.scrollLeft = left;
    if (top && top !== source && top.scrollLeft !== left) top.scrollLeft = left;
  }, []);

  useImperativeHandle(ref, () => ({
    scrollHorizontalToMaximum(options?: WishKanbanBoardScrollHorizontalToMaximumOptions) {
      const onComplete = options?.onComplete;

      let attempts = 0;
      const maxAttempts = 50;

      const pollUntilLayoutThenScroll = () => {
        attempts += 1;
        const main = mainRef.current;

        if (!main) {
          if (attempts >= maxAttempts) onComplete?.();
          else requestAnimationFrame(pollUntilLayoutThenScroll);
          return;
        }

        if (attempts > maxAttempts) {
          onComplete?.();
          return;
        }

        const maxLeft = Math.max(0, main.scrollWidth - main.clientWidth);

        // Nova coluna ainda não entrou na largura total — espera o próximo frame.
        if (maxLeft < 2 && attempts < maxAttempts) {
          requestAnimationFrame(pollUntilLayoutThenScroll);
          return;
        }

        const reducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const behavior = reducedMotion ? "instant" : "smooth";

        main.scrollTo({
          left: maxLeft,
          behavior,
        });

        if (!onComplete) return;

        let completeRan = false;
        const runCompleteOnce = () => {
          if (completeRan) return;
          completeRan = true;
          onComplete();
        };

        if (behavior === "instant") {
          requestAnimationFrame(() => {
            requestAnimationFrame(runCompleteOnce);
          });
          return;
        }

        main.addEventListener("scrollend", runCompleteOnce, { once: true });
        window.setTimeout(runCompleteOnce, 520);
      };

      requestAnimationFrame(pollUntilLayoutThenScroll);
    },
  }));

  useLayoutEffect(() => {
    const main = mainRef.current;
    const measure = measureRef.current;
    if (!main || !measure) return;

    function update() {
      const m = measureRef.current;
      const mn = mainRef.current;
      if (!m || !mn) return;
      const sw = Math.max(m.scrollWidth, mn.scrollWidth);
      const cw = mn.clientWidth;
      setTrackPx(sw);
      setShowTopStrip(sw > cw + 1);
    }

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(main);
    ro.observe(measure);

    return () => ro.disconnect();
  }, [children]);

  const topRailClass =
    "min-h-[18px] max-h-6 overflow-x-auto overflow-y-hidden border-b border-black/[0.06] dark:border-white/[0.06]";

  const spacerWidth = trackPx > 0 ? trackPx : 1;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {showTopStrip ? (
        <div
          ref={topRef}
          className={topRailClass}
          style={{ scrollbarGutter: "stable" }}
          onScroll={(e) => syncScrollLeft(e.currentTarget)}
        >
          <div aria-hidden className="h-1" style={{ width: spacerWidth }} />
        </div>
      ) : null}

      <div
        ref={mainRef}
        data-wish-kanban-board-horizontal-scroll-root="true"
        className="min-h-0 min-w-0 shrink-0 overflow-x-auto overflow-y-auto [scrollbar-gutter:stable]"
        onScroll={(e) => syncScrollLeft(e.currentTarget)}
      >
        <div ref={measureRef} className="block min-h-0 w-max min-w-full">
          {children}
        </div>
      </div>
    </div>
  );
});
