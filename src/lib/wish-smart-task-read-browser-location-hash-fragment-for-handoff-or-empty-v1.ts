/**
 * Devolve o fragmento `#...` atual para handoff SmartTask.
 * Em alguns ambientes (primeira hidratação) `location.hash` pode falhar; usa `href` como fallback.
 */
export function wishSmartTaskReadBrowserLocationHashFragmentForHandoffOrEmptyV1(): string {
  if (typeof window === "undefined") return "";
  const { hash } = window.location;
  if (hash.length > 0) return hash;
  const href = window.location.href;
  const i = href.indexOf("#");
  if (i < 0) return "";
  return href.slice(i);
}
