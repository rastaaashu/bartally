/* invoice-scan — Supabase Edge Function
   Receives an invoice photo (data URL) + the bar's item catalog, asks Claude to
   extract the delivered lines, and returns them matched to catalog items.

   Deploy:  supabase functions deploy invoice-scan --project-ref oayrdregspxgssfgehrb
   Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref oayrdregspxgssfgehrb */

import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SCHEMA = {
  type: "object",
  properties: {
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "Product name exactly as written on the invoice line" },
          qty: { type: "number", description: "Quantity delivered, in individual bottles/units (24 if the line says 1 case of 24)" },
          itemId: { anyOf: [{ type: "string" }, { type: "null" }], description: "id of the matching catalog item, or null if no confident match" },
        },
        required: ["label", "qty", "itemId"],
        additionalProperties: false,
      },
    },
  },
  required: ["lines"],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { image, items } = await req.json();
    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "bad image" }), { status: 400, headers: CORS });
    }
    const mediaType = image.slice(5, image.indexOf(";"));
    const data = image.slice(image.indexOf(",") + 1);

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data } },
          {
            type: "text",
            text: `This is a supplier invoice / delivery note for a bar. Extract every product line that was delivered.
Express qty in individual bottles/units: a case ("caisse"/"pack") counts as its bottle count (e.g. 1 caisse de 24 → 24).
Match each line to the bar's catalog below when confident (same product, any spelling/abbreviation); otherwise itemId = null.
Catalog (id → name):
${(items ?? []).map((i: { id: string; name: string }) => `${i.id} → ${i.name}`).join("\n")}`,
          },
        ],
      }],
    });

    if (response.stop_reason === "refusal") {
      return new Response(JSON.stringify({ lines: [] }), { headers: { ...CORS, "content-type": "application/json" } });
    }
    const text = response.content.find((b) => b.type === "text");
    return new Response(text ? text.text : JSON.stringify({ lines: [] }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
});
