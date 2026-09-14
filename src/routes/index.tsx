import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ScopeSkeleton } from "@/components/ScopeSkeleton";
import { generateScope } from "@/lib/scope.functions";
import { SAMPLE_BRIEF, scopeTitle } from "@/lib/scope";
import { setDraft } from "@/lib/draft";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScopePilot — Turn messy client briefs into a clear scope" },
      {
        name: "description",
        content:
          "Paste a messy freelance or client brief and get a structured project scope: goals, deliverables, milestones, estimate range, risks and the questions you still need answered.",
      },
      { property: "og:title", content: "ScopePilot — From messy brief to clear scope" },
      {
        property: "og:description",
        content:
          "Paste a client brief and get a structured scope with deliverables, milestones, risks and open questions.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const generate = useServerFn(generateScope);

  async function handleGenerate() {
    if (brief.trim().length < 20) {
      toast.error("Add a bit more detail to the brief first.");
      return;
    }
    setLoading(true);
    try {
      const scope = await generate({ data: { brief } });
      setDraft({ brief, scope, title: scopeTitle(scope) });
      navigate({ to: "/scope" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="rise pt-7 pb-5">
        <p className="section-label">(01) Client brief</p>
        <h1 className="mt-2 max-w-[22ch] font-display text-[30px] leading-tight font-semibold tracking-tight text-balance sm:text-[38px]">
          Messy brief in. Clear scope out.
        </h1>
        <p className="mt-3 max-w-prose text-[14px] leading-relaxed text-muted-foreground">
          Paste whatever the client sent — emails, voice-note transcripts, a wall of text.
          ScopePilot structures it into thirteen sections and flags what you still need to ask.
        </p>
      </section>

      <section className="card-surface">
        <div className="flex items-center justify-between">
          <label htmlFor="brief" className="section-label">
            Paste client brief
          </label>
          <span className="font-mono text-[11px] text-muted-foreground">
            {brief.length} chars
          </span>
        </div>
        <textarea
          id="brief"
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
          placeholder="Need a booking site for my photo studio. Clients keep emailing me and I lose track of shoots…"
          rows={10}
          className="mt-3 w-full resize-y rounded-xl border border-border bg-background/70 p-3 text-[14px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-xl bg-foreground px-5 py-3 text-[13px] font-semibold text-background transition-opacity active:opacity-90 disabled:opacity-60"
          >
            {loading ? "Generating scope…" : "Generate scope"}
          </button>
          <button
            type="button"
            onClick={() => setBrief(SAMPLE_BRIEF)}
            className="font-mono text-[12px] font-medium text-primary underline-offset-4 hover:underline"
          >
            Try sample brief
          </button>
        </div>
      </section>

      {loading ? <ScopeSkeleton /> : null}
    </AppShell>
  );
}
