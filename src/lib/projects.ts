import { supabase } from "@/integrations/supabase/client";
import { normalizeScope, type Scope } from "./scope";

export type SavedProject = {
  id: string;
  title: string;
  raw_brief: string;
  scope: Scope;
  created_at: string;
};

type Row = {
  id: string;
  title: string;
  raw_brief: string;
  scope_json: unknown;
  created_at: string;
};

const toProject = (row: Row): SavedProject => ({
  id: row.id,
  title: row.title,
  raw_brief: row.raw_brief,
  scope: normalizeScope(row.scope_json),
  created_at: row.created_at,
});

export async function listProjects(): Promise<SavedProject[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, raw_brief, scope_json, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(toProject);
}

export async function getProject(id: string): Promise<SavedProject> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, raw_brief, scope_json, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("That saved scope no longer exists.");
  return toProject(data as Row);
}

export async function saveProject(input: {
  id?: string;
  title: string;
  raw_brief: string;
  scope: Scope;
}): Promise<SavedProject> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Please sign in to save scopes.");

  const payload = {
    title: input.title,
    raw_brief: input.raw_brief,
    scope_json: JSON.parse(JSON.stringify(input.scope)) as never,
    user_id: auth.user.id,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", input.id)
      .select("id, title, raw_brief, scope_json, created_at")
      .single();
    if (error) throw new Error(error.message);
    return toProject(data as Row);
  }

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("id, title, raw_brief, scope_json, created_at")
    .single();
  if (error) throw new Error(error.message);
  return toProject(data as Row);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
