import { normalizeScope, type Scope } from "./scope";

const KEY = "scopepilot:draft";

export type Draft = { brief: string; scope: Scope; title: string; id?: string };

export function setDraft(draft: Draft): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function getDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Draft;
    return {
      brief: parsed.brief ?? "",
      title: parsed.title ?? "Untitled scope",
      scope: normalizeScope(parsed.scope),
      ...(parsed.id ? { id: parsed.id } : {}),
    };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
