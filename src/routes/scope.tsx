import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ScopeSkeleton } from "@/components/ScopeSkeleton";
import { getDraft, setDraft } from "@/lib/draft";
import { getProject, saveProject } from "@/lib/projects";
import { EMPTY_SCOPE, SECTIONS, scopeToMarkdown, type Scope } from "@/lib/scope";
import { generateScope } from "@/lib/scope.functions";

export const Route = createFileRoute("/scope")({
  validateSearch: (search: Record<string, unknown>): { id?: string } =>
    typeof search["id"] === "string" ? { id: search["id"] } : {},
  head: () => ({
    meta: [
      { title: "Project scope — ScopePilot" },
      {
        name: "description",
        content:
          "Review and edit the generated project scope: summary, goals, deliverables, milestones, estimate range, risks and next steps.",
      },
      { property: "og:title", content: "Project scope — ScopePilot" },
      {
        property: "og:description",
        content: "Edit, save, copy or download your structured project scope as Markdown.",
      },
    ],
  }),
  component: ScopePage,
});

function ScopePage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const regenerate = useServerFn(generateScope);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "save" | "regenerate">(null);
  const [savedId, setSavedId] = useState<string | undefined>(id);
  const [title, setTitle] = useState("Untitled scope");
  const [brief, setBrief] = useState("");
  const [scope, setScope] = useState<Scope>(EMPTY_SCOPE);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        if (id) {
          const project = await getProject(id);
          if (!active) return;
          setSavedId(project.id);
          setTitle(project.title);
          setBrief(project.raw_brief);
          setScope(project.scope);
        } else {
          const draft = getDraft();
          if (!active) return;
          if (!draft) {
            setMissing(true);
          } else {
            setSavedId(draft.id);
            setTitle(draft.title);
            setBrief(draft.brief);
            setScope(draft.scope);
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't load that scope.");
        setMissing(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  function updateSection(key: keyof Scope, kind: "text" | "list", value: string) {
    setScope((current) => ({
      ...current,
      [key]:
        kind === "text"
          ? value
          : value.split("\n").map((line) => line.replace(/^[-•]\s*/, "")),
    }));
  }

  async function handleSave() {
    setBusy("save");
    try {
      const project = await saveProject({
        ...(savedId ? { id: savedId } : {}),
        title: title.trim() || "Untitled scope",
        raw_brief: brief,
        scope,
      });
      setSavedId(project.id);
      setDraft({ brief, scope, title: project.title, id: project.id });
      toast.success("Scope saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save this scope.");
    } finally {
      setBusy(null);
    }
  }

  function handleCopy() {
    navigator.clipboard
      .writeText(scopeToMarkdown(scope, title))
      .then(() => toast.success("Markdown copied to clipboard."))
      .catch(() => toast.error("Couldn't copy. Try downloading instead."));
  }

  function handleDownload() {
    const blob = new Blob([scopeToMarkdown(scope, title)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(title || "scope").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleRegenerate() {
    if (brief.trim().length < 20) {
      toast.error("The original brief is too short to regenerate.");
      return;
    }
    setBusy("regenerate");
    try {
      const fresh = await regenerate({ data: { brief } });
      setScope(fresh);
      setDraft({ brief, scope: fresh, title, ...(savedId ? { id: savedId } : {}) });
      toast.success("Scope regenerated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't regenerate. Try again.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <ScopeSkeleton />
      </AppShell>
    );
  }

  if (missing) {
    return (
      <AppShell>
        <div className="card-surface rise mt-10 text-center">
          <p className="section-label">No scope open</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            Nothing to show yet
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Generate a scope from a brief, or open one you saved earlier.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link
              to="/"
              className="rounded-xl bg-foreground px-4 py-3 text-[13px] font-semibold text-background"
            >
              Paste a brief
            </Link>
            <Link
              to="/saved"
              className="rounded-xl bg-background px-4 py-3 text-[13px] font-semibold ring-1 ring-foreground/15"
            >
              Saved projects
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <AppShell>
        <section className="rise pt-6 pb-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="section-label">(02) Generated scope</p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-label="Scope title"
                className="mt-1 w-full overflow-hidden bg-transparent pr-2 font-display text-[26px] leading-tight font-semibold tracking-tight text-ellipsis outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <span className="shrink-0 rounded-full bg-accent/12 px-2.5 py-1 text-[11px] font-medium text-accent ring-1 ring-accent/25">
              13 sections
            </span>
          </div>
        </section>

        <section className="space-y-3">
          {SECTIONS.map((section, index) => {
            const value =
              section.kind === "text"
                ? (scope[section.key] as string)
                : (scope[section.key] as string[]).join("\n");
            const highlight = section.key === "missing_information";
            return (
              <div
                key={section.key}
                className={`card-surface rise ${highlight ? "ring-1 ring-accent/25" : ""}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="section-label">
                    {String(index + 1).padStart(2, "0")} · {section.label}
                  </span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
                    editable
                  </span>
                </div>
                <textarea
                  value={value}
                  onChange={(event) =>
                    updateSection(section.key, section.kind, event.target.value)
                  }
                  rows={section.kind === "text" ? 3 : Math.max(2, value.split("\n").length)}
                  placeholder={
                    section.kind === "list" ? "One item per line" : "Not specified"
                  }
                  className="mt-2 w-full resize-y rounded-lg bg-transparent text-[14px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            );
          })}
        </section>

        <details className="card-surface rise mt-4">
          <summary className="section-label cursor-pointer">Original brief</summary>
          <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {brief}
          </p>
        </details>
      </AppShell>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={busy !== null}
            className="flex-1 rounded-xl bg-foreground px-4 py-3 text-[13px] font-semibold text-background disabled:opacity-60"
          >
            {busy === "save" ? "Saving…" : savedId ? "Save changes" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 rounded-xl bg-background px-4 py-3 text-[13px] font-semibold ring-1 ring-foreground/15"
          >
            Copy MD
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 rounded-xl bg-background px-4 py-3 text-[13px] font-semibold ring-1 ring-foreground/15"
          >
            Download
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={busy !== null}
            aria-label="Regenerate scope"
            title="Regenerate"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 font-mono text-[13px] font-semibold text-primary ring-1 ring-primary/25 disabled:opacity-60"
          >
            {busy === "regenerate" ? "…" : "↻"}
          </button>
        </div>
      </div>
    </>
  );
}
