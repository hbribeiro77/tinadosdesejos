"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientFetchGitlabCreateIssueInProjectApi } from "@/lib/client-fetch-gitlab-create-issue-in-project-api";
import { clientFetchGitlabProjectMarkdownImageUploadV1 } from "@/lib/client-fetch-gitlab-project-markdown-image-upload-v1-api";
import { clientFetchGitlabTriageImportDefaults } from "@/lib/client-fetch-gitlab-triage-import-defaults-api";
import {
  readWishBoardModalAddGitlabIssueLastSelectedModeFromLocalStorage,
  writeWishBoardModalAddGitlabIssueLastSelectedModeToLocalStorage,
} from "@/lib/wish-board-modal-add-gitlab-issue-last-selected-mode-local-storage-read-write";
import { wishInsertGitlabMarkdownSnippetAtTextareaSelectionV1 } from "@/lib/wish-insert-gitlab-markdown-snippet-at-textarea-selection-v1";
import { wishGitlabProjectUploadImageFileIsAllowedV1 } from "@/lib/wish-gitlab-project-upload-image-validate-and-parse-markdown-from-api-json-v1";

type WishBoardModalAddGitlabIssueUrlProps = {
  open: boolean;
  columnTitle: string;
  onClose: () => void;
  onSubmit: (issueUrl: string) => Promise<void>;
};

type AddMode = "url" | "create";

export function WishBoardModalAddGitlabIssueUrl(props: WishBoardModalAddGitlabIssueUrlProps) {
  const [mode, setMode] = useState<AddMode>("url");
  const [issueUrl, setIssueUrl] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createProjectHint, setCreateProjectHint] = useState<string | null>(null);
  const [createLabelsHint, setCreateLabelsHint] = useState<string | null>(null);
  const issueUrlInputRef = useRef<HTMLInputElement>(null);
  const createTitleInputRef = useRef<HTMLInputElement>(null);
  const createDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const attachImageInputRef = useRef<HTMLInputElement>(null);

  const canSubmitUrl = useMemo(() => issueUrl.trim().length > 0 && !submitting, [issueUrl, submitting]);
  const canSubmitCreate = useMemo(
    () => createTitle.trim().length > 0 && !submitting && !uploadingImage,
    [createTitle, submitting, uploadingImage],
  );

  const insertMarkdownIntoDescription = useCallback(
    (snippet: string) => {
      const el = createDescriptionRef.current;
      const selectionStart = el?.selectionStart ?? createDescription.length;
      const selectionEnd = el?.selectionEnd ?? createDescription.length;
      const inserted = wishInsertGitlabMarkdownSnippetAtTextareaSelectionV1({
        text: createDescription,
        selectionStart,
        selectionEnd,
        snippet,
      });
      setCreateDescription(inserted.nextText);
      requestAnimationFrame(() => {
        const ta = createDescriptionRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(inserted.nextSelectionStart, inserted.nextSelectionEnd);
      });
    },
    [createDescription],
  );

  const uploadImageFileAndInsertMarkdown = useCallback(
    async (file: File) => {
      if (
        !wishGitlabProjectUploadImageFileIsAllowedV1({
          mimeType: file.type || "application/octet-stream",
          byteLength: file.size,
        })
      ) {
        setError("Imagem inválida. Use PNG, JPEG, GIF ou WebP até 12 MB.");
        return;
      }
      setUploadingImage(true);
      setError(null);
      try {
        const uploaded = await clientFetchGitlabProjectMarkdownImageUploadV1(file);
        if (!uploaded.ok) {
          setError(uploaded.message);
          return;
        }
        insertMarkdownIntoDescription(uploaded.markdown);
      } finally {
        setUploadingImage(false);
      }
    },
    [insertMarkdownIntoDescription],
  );

  const handleAdd = useCallback(async () => {
    if (mode === "url") {
      if (!canSubmitUrl) return;
      setSubmitting(true);
      setError(null);
      try {
        await props.onSubmit(issueUrl.trim());
        writeWishBoardModalAddGitlabIssueLastSelectedModeToLocalStorage("url");
        setIssueUrl("");
        props.onClose();
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Falha ao adicionar issue.";
        setError(message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!canSubmitCreate) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await clientFetchGitlabCreateIssueInProjectApi({
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
      });
      if (!created.ok) {
        throw new Error(created.message);
      }
      await props.onSubmit(created.issueUrl);
      writeWishBoardModalAddGitlabIssueLastSelectedModeToLocalStorage("create");
      setCreateTitle("");
      setCreateDescription("");
      props.onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Falha ao adicionar issue.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    mode,
    canSubmitUrl,
    canSubmitCreate,
    issueUrl,
    createTitle,
    createDescription,
    props.onSubmit,
    props.onClose,
  ]);

  useEffect(() => {
    if (!props.open) return;
    const id = requestAnimationFrame(() => {
      if (mode === "url") {
        issueUrlInputRef.current?.focus();
      } else {
        createTitleInputRef.current?.focus();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [props.open, mode]);

  useEffect(() => {
    if (!props.open) return;
    let cancelled = false;
    void (async () => {
      const defs = await clientFetchGitlabTriageImportDefaults();
      if (cancelled) return;
      setCreateProjectHint(defs?.createIssueProjectPathDisplay ?? "portal-da-defensoria/portal-defensoria-gateway");
      setCreateLabelsHint(
        defs?.createIssueDefaultLabelsDisplay !== undefined
          ? defs.createIssueDefaultLabelsDisplay || null
          : "squad::bravo",
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [props.open]);

  useEffect(() => {
    if (!props.open) return;
    const last = readWishBoardModalAddGitlabIssueLastSelectedModeFromLocalStorage();
    setMode(last ?? "url");
    setIssueUrl("");
    setCreateTitle("");
    setCreateDescription("");
    setError(null);
    setSubmitting(false);
    setUploadingImage(false);
  }, [props.open]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl border border-black/10 bg-white p-5 text-zinc-900 shadow-lg dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Adicionar issue do GitLab</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Coluna: <span className="font-medium">{props.columnTitle}</span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            onClick={() => {
              if (submitting || uploadingImage) return;
              setError(null);
              props.onClose();
            }}
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 flex rounded-lg border border-black/10 p-0.5 dark:border-white/10">
          <button
            type="button"
            className={[
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === "url"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10",
            ].join(" ")}
            onClick={() => {
              setMode("url");
              writeWishBoardModalAddGitlabIssueLastSelectedModeToLocalStorage("url");
              setError(null);
            }}
          >
            Colar URL
          </button>
          <button
            type="button"
            className={[
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === "create"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10",
            ].join(" ")}
            onClick={() => {
              setMode("create");
              writeWishBoardModalAddGitlabIssueLastSelectedModeToLocalStorage("create");
              setError(null);
            }}
          >
            Criar no GitLab
          </button>
        </div>

        {mode === "url" ? (
          <>
            <label className="mt-4 block text-sm text-zinc-700 dark:text-zinc-200" htmlFor="gitlab-issue-url">
              Cole a URL da issue
            </label>
            <input
              ref={issueUrlInputRef}
              id="gitlab-issue-url"
              className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-950"
              placeholder="https://gitlab.../-/issues/123"
              value={issueUrl}
              onChange={(e) => setIssueUrl(e.target.value)}
              disabled={submitting}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                void handleAdd();
              }}
            />
          </>
        ) : (
          <>
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
              A issue será criada no projeto{" "}
              <span className="font-mono font-medium text-zinc-700 dark:text-zinc-200">{createProjectHint ?? "…"}</span>{" "}
              (servidor: <span className="font-mono">GITLAB_CREATE_ISSUE_PROJECT_PATH</span>).
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {createLabelsHint ? (
                <>
                  Labels na criação:{" "}
                  <span className="font-mono font-medium text-zinc-700 dark:text-zinc-200">{createLabelsHint}</span>{" "}
                  (<span className="font-mono">GITLAB_CREATE_ISSUE_DEFAULT_LABELS</span>).
                </>
              ) : (
                <>
                  Sem labels automáticas na criação (<span className="font-mono">GITLAB_CREATE_ISSUE_DEFAULT_LABELS</span>{" "}
                  vazio).
                </>
              )}
            </p>
            <label className="mt-3 block text-sm text-zinc-700 dark:text-zinc-200" htmlFor="gitlab-create-title">
              Título
            </label>
            <input
              ref={createTitleInputRef}
              id="gitlab-create-title"
              className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-950"
              placeholder="Ex.: Corrigir timeout no login"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              disabled={submitting || uploadingImage}
              maxLength={255}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                void handleAdd();
              }}
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <label className="block text-sm text-zinc-700 dark:text-zinc-200" htmlFor="gitlab-create-description">
                Descrição (opcional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={attachImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    void uploadImageFileAndInsertMarkdown(file);
                  }}
                />
                <button
                  type="button"
                  disabled={submitting || uploadingImage}
                  className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => attachImageInputRef.current?.click()}
                  title="Enviar imagem ao GitLab e inserir na descrição"
                >
                  {uploadingImage ? "Enviando…" : "Anexar imagem"}
                </button>
              </div>
            </div>
            <textarea
              ref={createDescriptionRef}
              id="gitlab-create-description"
              rows={5}
              className="mt-2 w-full resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-950"
              placeholder="Markdown do GitLab… Cole (Ctrl+V) uma imagem ou use Anexar imagem."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              disabled={submitting || uploadingImage}
              onPaste={(e) => {
                const items = e.clipboardData?.items;
                if (!items) return;
                for (const item of items) {
                  if (!item.type.startsWith("image/")) continue;
                  const file = item.getAsFile();
                  if (!file) continue;
                  e.preventDefault();
                  void uploadImageFileAndInsertMarkdown(file);
                  return;
                }
              }}
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Imagens sobem para o projeto no GitLab e entram como Markdown{" "}
              <span className="font-mono">![…](/uploads/…)</span>.
            </p>
          </>
        )}

        {error ? <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div> : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
            disabled={submitting || uploadingImage}
            onClick={() => {
              setError(null);
              props.onClose();
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            disabled={mode === "url" ? !canSubmitUrl : !canSubmitCreate}
            onClick={() => void handleAdd()}
          >
            {submitting
              ? mode === "create"
                ? "Criando…"
                : "Adicionando…"
              : mode === "create"
                ? "Criar e adicionar"
                : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
