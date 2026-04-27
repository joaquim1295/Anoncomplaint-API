import type { ComplaintDocument } from "../../models/Complaint";
import { z } from "zod";

export type AIComplaintContext = {
  company: string;
  issue: string;
  severity: number;
};

const AiContextSchema = z.object({
  company: z.string().min(1).max(120),
  issue: z.string().min(1).max(120),
  severity: z.number().int().min(1).max(10),
});

export async function extractComplaintContext(input: {
  complaint: Pick<ComplaintDocument, "content" | "tags">;
}): Promise<AIComplaintContext> {
  const apiKey = process.env.GROQ_API_KEY ?? "";
  if (!apiKey) throw new Error("missing_groq_api_key");

  const model = "llama-3.3-70b-versatile";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const content = String(input.complaint.content ?? "").trim().slice(0, 7000);
  const tags = Array.isArray(input.complaint.tags)
    ? input.complaint.tags.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 12)
    : [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const body = JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 160,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Return ONLY a JSON object. No markdown. No prose. No extra keys.\n" +
            "Schema:\n" +
            "{\n" +
            '  "company": "string",\n' +
            '  "issue": "string",\n' +
            '  "severity": number\n' +
            "}\n" +
            "Constraints:\n" +
            "- severity: integer 1..10\n" +
            "- company/issue: short strings\n",
        },
        {
          role: "user",
          content: JSON.stringify({ complaint: content, tags }),
        },
      ],
    });

    const doFetch = async () =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
        cache: "no-store",
        signal: controller.signal,
      });

    let res = await doFetch();
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 650));
      res = await doFetch();
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`groq_http_${res.status}:${txt.slice(0, 200)}`);
    }

    const data = (await res.json()) as any;
    const text = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new Error("groq_empty");

    const json = JSON.parse(text);
    const parsed = AiContextSchema.safeParse(json);
    if (!parsed.success) throw new Error("groq_schema_mismatch");
    return parsed.data;
  } finally {
    clearTimeout(timeout);
  }
}

