/** Só limpa `.next` quando o ensure recompilou o binário nativo (Node diferente / .node quebrado). */
export function nextDevShouldWipeDotNextCacheAfterSqliteEnsureStdout(stdout) {
  return String(stdout ?? "").includes("[sqlite] native-rebuild-happened=yes");
}
