import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/scope", label: "Scope" },
  { to: "/saved", label: "Saved" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background font-body text-[15px] text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-foreground font-display text-sm font-semibold text-background">
              S
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">ScopePilot</span>
          </Link>
          <nav className="flex items-center gap-1 text-xs font-medium">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{
                  className: "bg-foreground text-primary-foreground hover:text-primary-foreground",
                }}
              >
                {item.label}
              </Link>
            ))}
            {signedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{
                  className: "bg-foreground text-primary-foreground hover:text-primary-foreground",
                }}
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-32">{children}</main>
    </div>
  );
}
