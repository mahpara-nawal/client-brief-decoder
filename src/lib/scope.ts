export type Scope = {
  summary: string;
  goals: string[];
  target_users: string[];
  assumptions: string[];
  missing_information: string[];
  in_scope: string[];
  out_of_scope: string[];
  deliverables: string[];
  milestones: string[];
  timeline: string;
  estimate_range: string;
  risks: string[];
  next_steps: string[];
};

export type SectionKey = keyof Scope;

export const SECTIONS: { key: SectionKey; label: string; kind: "text" | "list" }[] = [
  { key: "summary", label: "Project summary", kind: "text" },
  { key: "goals", label: "Goals", kind: "list" },
  { key: "target_users", label: "Target users", kind: "list" },
  { key: "assumptions", label: "Assumptions", kind: "list" },
  { key: "missing_information", label: "Missing information", kind: "list" },
  { key: "in_scope", label: "In scope", kind: "list" },
  { key: "out_of_scope", label: "Out of scope", kind: "list" },
  { key: "deliverables", label: "Deliverables", kind: "list" },
  { key: "milestones", label: "Milestones", kind: "list" },
  { key: "timeline", label: "Timeline", kind: "text" },
  { key: "estimate_range", label: "Estimate range", kind: "text" },
  { key: "risks", label: "Risks", kind: "list" },
  { key: "next_steps", label: "Next steps", kind: "list" },
];

export const EMPTY_SCOPE: Scope = {
  summary: "",
  goals: [],
  target_users: [],
  assumptions: [],
  missing_information: [],
  in_scope: [],
  out_of_scope: [],
  deliverables: [],
  milestones: [],
  timeline: "",
  estimate_range: "",
  risks: [],
  next_steps: [],
};

const asText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(asText).join(" — ");
  return "";
};

const asList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean);
  if (typeof value === "string") return value.split("\n").filter((line) => line.trim().length > 0);
  if (value && typeof value === "object")
    return Object.entries(value).map(([k, v]) => `${k}: ${asText(v)}`);
  return [];
};

/** Coerce anything the model returns into the exact Scope shape. */
export function normalizeScope(raw: unknown): Scope {
  const input = (raw ?? {}) as Record<string, unknown>;
  const out = { ...EMPTY_SCOPE };
  for (const section of SECTIONS) {
    if (section.kind === "text") {
      (out[section.key] as string) = asText(input[section.key]);
    } else {
      (out[section.key] as string[]) = asList(input[section.key]);
    }
  }
  return out;
}

export function scopeTitle(scope: Scope, fallback = "Untitled scope"): string {
  const first = scope.summary.split(/[.\n]/)[0]?.trim();
  if (!first) return fallback;
  return first.length > 70 ? `${first.slice(0, 67)}…` : first;
}

export function scopeToMarkdown(scope: Scope, title: string): string {
  const parts = [`# ${title}`, ""];
  for (const section of SECTIONS) {
    parts.push(`## ${section.label}`);
    if (section.kind === "text") {
      parts.push((scope[section.key] as string) || "_Not specified_");
    } else {
      const items = scope[section.key] as string[];
      parts.push(items.length ? items.map((item) => `- ${item}`).join("\n") : "_Not specified_");
    }
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

export const SAMPLE_BRIEF = `hey so we run a small photo studio (4 people) and bookings are a mess right now.
clients email us, sometimes DM on instagram, and i keep everything in a notebook + google cal. we double booked twice last month.

what i want: a site where clients pick a shoot type (portrait, product, event), see open slots, book, and pay a deposit. we also want to stop the back and forth about what to bring, so maybe a prep checklist gets emailed automatically.

we already have branding and a squarespace site we might keep for the portfolio part. budget-wise we're a small business, nothing crazy. would be nice to have before the busy holiday season but not sure exactly when that is. also my business partner wants some kind of dashboard to see the week at a glance.

oh and gift cards, people keep asking for those.`;
