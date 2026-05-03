// lib/bot/aiService.ts
import algoliasearch from "algoliasearch";
import { GROQ_CONFIG } from "@/lib/aiContext";

// ==========================================
// INITIALIZE ALGOLIA 
// ==========================================
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
);
const index = searchClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "products");

const SYSTEM_PROMPT = `You are the official WhatsApp Sales Assistant for Kabale Online, the premium student marketplace in Kabale, Uganda.

====================
YOUR PERSONA & TONE:
====================
- You are helpful, fast, and conversational.
- Keep responses RUTHLESSLY SHORT (1-2 sentences). 
- Never mention that you are an AI. 
- Build trust: Mention "Pay Cash on Delivery" and "Verified Sellers".

====================
CORE FUNCTION: SEARCHING & MENUS (CRITICAL)
====================
1. If a user asks to buy something, you MUST use the \`search_catalog\` tool.
2. When the database returns products, DO NOT list them out in text.
3. Instead, give a short intro and append a single CATALOG tag at the very end.

CRITICAL RULE: For the CATALOG tag, you MUST prepend the word "item_" to the EXACT 'id' provided in the tool's JSON results. 

FORMAT: ||CATALOG:item_[exact_db_id]=Title1|item_[exact_db_id]=Title2||

Example Workflow:
User: "I need a cable."
[Tool returns: [{"id": "8f72hjd8XkP", "title": "100W USB Cable", "price": 10000}]]
You: "I found some great cables for you! You can pay cash on delivery. Tap the button below to choose one. ||CATALOG:item_8f72hjd8XkP=100W USB Cable||"

*Note: The title in the tag must be short (under 24 characters). Do not include prices in the tag.*`;

// ==========================================
// THE UNIFIED AI ENGINE
// ==========================================
export async function executeAIAgent(userMessages: any[], userName: string = "User"): Promise<string> {
  const payloadMessages = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\nSystem Override: User's name is ${userName}.` },
    ...userMessages,
  ];

  const tools = [{
    type: "function",
    function: {
      name: "search_catalog",
      description: "Search the database for active products.",
      parameters: {
        type: "object",
        properties: { search_query: { type: "string" } },
        required: ["search_query"],
      },
    },
  }];

  let response = await fetchGroqCompletion(payloadMessages, tools);
  const responseMessage = response.choices[0]?.message;

  if (responseMessage?.tool_calls) {
    const toolCall = responseMessage.tool_calls[0];
    if (toolCall.function.name === "search_catalog") {
      const args = JSON.parse(toolCall.function.arguments);
      console.log(`🔍 AI is querying Algolia for: ${args.search_query}`);

      const products = await searchAlgoliaCatalog(args.search_query);

      payloadMessages.push(responseMessage);
      payloadMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(products),
      });

      response = await fetchGroqCompletion(payloadMessages);
    }
  }

  return response.choices[0]?.message?.content || "Oops, my brain glitched! 🔧 Try that again?";
}

// ==========================================
// 🚀 ALGOLIA SEARCH
// ==========================================
async function searchAlgoliaCatalog(query: string) {
  try {
    const { hits } = await index.search(query, { hitsPerPage: 5 });

    if (hits.length === 0) return { status: "No products found." };

    return hits.map((hit: any) => ({
      id: hit.objectID, // <--- Exact ID passed to AI
      title: hit.name || hit.title || "Unknown Item",
      price: hit.price
    }));

  } catch (error) {
    console.error("🔥 Algolia Search Error in AI Engine:", error);
    return { status: "Database search failed." };
  }
}

// ==========================================
// HELPER: GROQ API FETCH
// ==========================================
async function fetchGroqCompletion(messages: any[], tools?: any[]) {
  const bodyPayload: any = { model: GROQ_CONFIG.model, messages, temperature: 0.8, top_p: 0.9 };
  if (tools) { bodyPayload.tools = tools; bodyPayload.tool_choice = "auto"; }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify(bodyPayload),
  });
  return await res.json();
}
