import type { SmartTaskNormalizedTask } from "@/lib/smart-task-normalized-task-domain-types";

/** Mescla por `id`; entradas mais à direita em `batches` sobrescrevem as anteriores. */
export function mergeSmartTaskNormalizedTaskArrayByIdPreferIncoming(
  ...batches: SmartTaskNormalizedTask[][]
): SmartTaskNormalizedTask[] {
  const map = new Map<string, SmartTaskNormalizedTask>();
  for (const batch of batches) {
    for (const t of batch) {
      map.set(t.id, t);
    }
  }
  return [...map.values()];
}
