import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeScope, type Scope } from "./scope";

const SYSTEM_PROMPT =
  "You are a senior project scoping assistant. Given a messy client brief, return only valid JSON with fields: summary, goals, target_users, assumptions, missing_information, in_scope, out_of_scope, deliverables, milestones, timeline, estimate_range, risks, next_steps. If information is missing, list it under missing_information. Do not invent budget or dates unless clearly implied. Be specific and concise.";

const Input = z.object({ brief: z.string().min(20).max(20000) });

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("The model did not return valid JSON. Try generating again.");
  }
}

export const generateScope = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<Scope> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.4",
        stream: false,
        response_format: { type: "json_object" },
        max_completion_tokens: 4000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: data.brief },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) {
        throw new Error("Too many requests right now. Please wait a moment and try again.");
      }
      if (response.status === 402) {
        throw new Error("AI credits are exhausted. Add credits to keep generating scopes.");
      }
      if (response.status === 403) {
        throw new Error("AI access is blocked for this workspace.");
      }
      console.error("AI gateway error", response.status, body);
      throw new Error("Couldn't generate a scope right now. Please try again.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("The model returned an empty response. Try again.");

    return normalizeScope(extractJson(content));
  });
