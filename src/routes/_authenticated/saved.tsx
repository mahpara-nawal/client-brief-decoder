import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { listProjects } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved projects — ScopePilot" },
      {
        name: "description",
        content:
          "Every scope you saved in ScopePilot, newest first — open one to keep editing, copy it, or export it as Markdown.",
      },
      { property: "og:title", content: "Saved projects — ScopePilot" },
      {
        property: "og:description",
        content: "Open any saved project scope to keep editing or export it.",
      },
    ],
  }),
  component: SavedPage,
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });

function SavedPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  return (
    <AppShell>
      <section className="rise pt-7 pb-4">
        <p className="section-label">(03) Library</p>
        <h1 className="mt-2 font-display text-[26px] leading-tight font-semibold tracking-tight">
          Saved projects
        </h1>
      </section>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skel h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="card-surface">
          <p className="text-[14px] text-muted-foreground">
            Couldn't load your saved scopes. Refresh the page to try again.
          </p>
        </div>
      ) : !data || data.length === 0 ? (
        <div className="card-surface text-center">
          <p className="text-[14px] text-muted-foreground">
            Nothing saved yet. Generate a scope and press Save.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-xl bg-foreground px-4 py-3 text-[13px] font-semibold text-background"
          >
            Paste a brief
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface backdrop-blur-xl ring-1 ring-foreground/6">
          {data.map((project, index) => (
            <div
              key={project.id}
              className={`flex items-center gap-3 p-3 ${index < data.length - 1 ? "border-b border-border" : ""}`}
            >
              <span
                className={`size-2 shrink-0 rounded-full ${index % 2 === 0 ? "bg-primary" : "bg-accent"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{project.title}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {formatDate(project.created_at)}
                </p>
              </div>
              <Link
                to="/scope"
                search={{ id: project.id }}
                className="shrink-0 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-medium text-background"
              >
                Open
              </Link>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
