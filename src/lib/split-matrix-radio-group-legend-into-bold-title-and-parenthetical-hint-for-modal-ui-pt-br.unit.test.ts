import { describe, expect, it } from "vitest";
import { splitMatrixRadioGroupLegendIntoBoldTitleAndParentheticalHintForModalUiPtBr } from "./split-matrix-radio-group-legend-into-bold-title-and-parenthetical-hint-for-modal-ui-pt-br";

describe("splitMatrixRadioGroupLegendIntoBoldTitleAndParentheticalHintForModalUiPtBr", () => {
  it("separa título e dica quando há um par de parênteses no final", () => {
    const r = splitMatrixRadioGroupLegendIntoBoldTitleAndParentheticalHintForModalUiPtBr(
      "Desenvolvimento (esforço para implementar)",
    );
    expect(r).toEqual({ title: "Desenvolvimento", parentheticalHint: "esforço para implementar" });
  });

  it("retorna o texto inteiro sem dica quando não há parênteses", () => {
    const r = splitMatrixRadioGroupLegendIntoBoldTitleAndParentheticalHintForModalUiPtBr("Gravidade");
    expect(r).toEqual({ title: "Gravidade", parentheticalHint: null });
  });

  it("aplica trim ao texto completo", () => {
    const r = splitMatrixRadioGroupLegendIntoBoldTitleAndParentheticalHintForModalUiPtBr(
      "  Uso (abrangência de usuários afetados)  ",
    );
    expect(r.title).toBe("Uso");
    expect(r.parentheticalHint).toBe("abrangência de usuários afetados");
  });
});
