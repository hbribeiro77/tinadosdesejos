import { describe, expect, it } from "vitest";
import { wishInsertGitlabMarkdownSnippetAtTextareaSelectionV1 } from "@/lib/wish-insert-gitlab-markdown-snippet-at-textarea-selection-v1";

describe("wishInsertGitlabMarkdownSnippetAtTextareaSelectionV1", () => {
  it("insere no cursor com newlines quando no meio da linha e devolve seleção após o snippet", () => {
    const result = wishInsertGitlabMarkdownSnippetAtTextareaSelectionV1({
      text: "Antes Depois",
      selectionStart: 6,
      selectionEnd: 6,
      snippet: "![image](/uploads/a/b.png)",
    });
    expect(result.nextText).toBe("Antes \n![image](/uploads/a/b.png)\nDepois");
    expect(result.nextSelectionStart).toBe(result.nextText.indexOf("Depois"));
    expect(result.nextSelectionEnd).toBe(result.nextSelectionStart);
  });

  it("substitui seleção e adiciona newlines se necessário", () => {
    const result = wishInsertGitlabMarkdownSnippetAtTextareaSelectionV1({
      text: "linha\nmeio\nfim",
      selectionStart: 6,
      selectionEnd: 10,
      snippet: "![x](/uploads/1/x.png)",
    });
    expect(result.nextText).toContain("![x](/uploads/1/x.png)");
    expect(result.nextText).not.toContain("meio");
  });
});
