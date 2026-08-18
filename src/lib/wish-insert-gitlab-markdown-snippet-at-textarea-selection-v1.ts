export type WishInsertGitlabMarkdownSnippetAtTextareaSelectionResultV1 = {
  nextText: string;
  nextSelectionStart: number;
  nextSelectionEnd: number;
};

/**
 * Insere (ou substitui a seleção) um snippet Markdown na descrição,
 * com newlines em volta quando o snippet fica no meio de conteúdo.
 */
export function wishInsertGitlabMarkdownSnippetAtTextareaSelectionV1(params: {
  text: string;
  selectionStart: number;
  selectionEnd: number;
  snippet: string;
}): WishInsertGitlabMarkdownSnippetAtTextareaSelectionResultV1 {
  const text = params.text ?? "";
  const start = Math.max(0, Math.min(params.selectionStart, text.length));
  const end = Math.max(start, Math.min(params.selectionEnd, text.length));
  const snippet = params.snippet.trim();

  const before = text.slice(0, start);
  const after = text.slice(end);

  const needsLeadingNewline = before.length > 0 && !before.endsWith("\n");
  const needsTrailingNewline = after.length > 0 && !after.startsWith("\n");

  const block =
    (needsLeadingNewline ? "\n" : "") + snippet + (needsTrailingNewline ? "\n" : "");

  const nextText = before + block + after;
  const nextSelectionStart = before.length + block.length;
  return {
    nextText,
    nextSelectionStart,
    nextSelectionEnd: nextSelectionStart,
  };
}
