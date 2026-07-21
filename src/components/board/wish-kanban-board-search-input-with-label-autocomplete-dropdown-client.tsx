"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { WishKanbanBoard } from "@/lib/wish-kanban-board-domain-types";
import {
  wishKanbanBoardBuildSearchAutocompleteLabelSuggestionsGroupedFromBoardSnapshots,
  wishKanbanBoardFilterAutocompleteLabelGroupsBySearchPrefix,
} from "@/lib/wish-kanban-board-build-search-autocomplete-label-suggestions-grouped-from-board-snapshots";

export type WishKanbanBoardSearchInputWithLabelAutocompleteDropdownClientProps = {
  board: WishKanbanBoard;
  value: string;
  onValueChange: (next: string) => void;
  /** Contagem de issues que batem com o filtro atual (já calculada no pai). */
  filteredIssueCount: number;
  /** Com busca ativa: abre modal com a lista de issues encontradas. */
  onOpenSearchResults?: () => void;
};

function wishKanbanBoardSearchAutocompletePillClassName(label: string): string {
  const u = label.toUpperCase();
  const isSem = u.includes("SEM TRIAGEM");
  const isIa = u.includes("TRIAGEM IA") || u.includes("COM TRIAGEM IA");
  if (isSem) {
    return "border border-zinc-300/80 bg-zinc-200/80 text-zinc-800 hover:bg-zinc-300/90 dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-700/90";
  }
  if (isIa) {
    return "border border-violet-300/80 bg-violet-200/80 text-violet-900 hover:bg-violet-300/80 dark:border-violet-500/50 dark:bg-violet-900/50 dark:text-violet-100 dark:hover:bg-violet-800/60";
  }
  return "border border-sky-300/80 bg-sky-100/90 text-sky-950 hover:bg-sky-200/90 dark:border-sky-600/45 dark:bg-sky-950/45 dark:text-sky-100 dark:hover:bg-sky-900/55";
}

export function WishKanbanBoardSearchInputWithLabelAutocompleteDropdownClient(
  props: WishKanbanBoardSearchInputWithLabelAutocompleteDropdownClientProps,
) {
  const { board, value, onValueChange, filteredIssueCount, onOpenSearchResults } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const reactAutoId = useId();
  const baseHtmlId = `wish-kanban-board-search-${reactAutoId.replace(/:/g, "")}`;

  const allGroups = useMemo(
    () => wishKanbanBoardBuildSearchAutocompleteLabelSuggestionsGroupedFromBoardSnapshots(board),
    [board],
  );

  const visibleGroups = useMemo(
    () => wishKanbanBoardFilterAutocompleteLabelGroupsBySearchPrefix(allGroups, value),
    [allGroups, value],
  );

  const hasAnyLabelOnBoard = allGroups.some((g) => g.labels.length > 0);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = rootRef.current;
      if (!el || !(e.target instanceof Node)) return;
      if (!el.contains(e.target)) close();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [close]);

  const onInputKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        inputRef.current?.blur();
      }
    },
    [close],
  );

  const isSearchActive = value.trim().length > 0;

  return (
    <div ref={rootRef} className="relative min-w-[220px] flex-1 sm:min-w-[280px] md:max-w-md">
      <span className="sr-only">Buscar issues no quadro</span>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input
        ref={inputRef}
        id={`${baseHtmlId}-input`}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${baseHtmlId}-panel`}
        aria-autocomplete="list"
        className="relative z-[1] w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-20 text-sm text-zinc-900 shadow-sm outline-none ring-violet-400/40 placeholder:text-zinc-400 focus:border-violet-400/60 focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-violet-500/50"
        placeholder="Buscar por título, #iid, URL, projeto, label…"
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
        aria-label="Buscar issues no quadro"
      />
      <div className="pointer-events-none absolute right-2 top-1/2 z-[2] flex -translate-y-1/2 items-center gap-1">
        {isSearchActive ? (
          onOpenSearchResults ? (
            <button
              type="button"
              className="pointer-events-auto inline-flex cursor-pointer items-center rounded-md border border-violet-300/60 bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold text-violet-800 transition-colors hover:border-violet-400/70 hover:bg-violet-100/90 dark:border-violet-500/50 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-900/55"
              title="Ver lista de issues encontradas"
              aria-label={`${filteredIssueCount} issue${filteredIssueCount === 1 ? "" : "s"} encontradas — clique para ver a lista`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onOpenSearchResults()}
            >
              {filteredIssueCount}
            </button>
          ) : (
            <span
              className="pointer-events-auto inline-flex items-center rounded-md border border-violet-300/60 bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold text-violet-800 dark:border-violet-500/50 dark:bg-violet-950/50 dark:text-violet-200"
              title="Issues encontradas pelo filtro"
              aria-label={`${filteredIssueCount} issue${filteredIssueCount === 1 ? "" : "s"} encontradas pelo filtro`}
            >
              {filteredIssueCount}
            </span>
          )
        ) : null}
        {isSearchActive ? (
          <button
            type="button"
            className="pointer-events-auto rounded-md p-1 text-zinc-400 hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            aria-label="Limpar busca"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onValueChange("");
              setOpen(true);
              inputRef.current?.focus();
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={`${baseHtmlId}-panel`}
          role="listbox"
          aria-label="Sugestões de labels do quadro"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(70vh,420px)] overflow-y-auto rounded-lg border border-black/10 bg-white py-2 shadow-lg dark:border-white/10 dark:bg-zinc-900"
        >
          {!hasAnyLabelOnBoard ? (
            <p className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
              Nenhuma label carregada nos cards. Atualize as issues no GitLab para ver sugestões de labels.
            </p>
          ) : visibleGroups.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
              Nenhuma label no quadro corresponde a “{value.trim()}”.
            </p>
          ) : (
            visibleGroups.map((group) => (
              <div key={group.id} className="px-2 pb-2 pt-1">
                <div className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {group.sectionTitle}
                </div>
                <div className="h-px bg-black/5 dark:bg-white/10" />
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {group.labels.map((label) => (
                    <button
                      key={`${group.id}:${label}`}
                      type="button"
                      role="option"
                      aria-selected={false}
                      className={[
                        "rounded-full px-2.5 py-1 text-left text-[11px] font-semibold uppercase tracking-wide transition-colors",
                        wishKanbanBoardSearchAutocompletePillClassName(label),
                      ].join(" ")}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onValueChange(label);
                        setOpen(false);
                        requestAnimationFrame(() => inputRef.current?.focus());
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
