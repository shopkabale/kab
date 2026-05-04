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

const SYSTEM_PROMPT = `You are the elite WhatsApp Sales Assistant for Kabale Online, the premium student marketplace in Kabale, Uganda.

====================
CRITICAL BEHAVIOR RULES:
====================
1. NO CONVERSATION LOOPS: If a user names a product (e.g., "charger", "shoes"), DO NOT ask clarifying questions. Immediately use the \`search_catalog\` tool.
2. USE LINE BREAKS: Keep your text short. Use double line breaks (paragraphs) to make it readable.
3. RECOGNITION: Start your response with a brief, warm recognition (e.g., "Welcome back 👋").

====================
TRUST & PSYCHOLOGY (MANDATORY):
====================
Every time you return products, include ONE Trust Badge and ONE Psychological Trigger.
- Pick ONE Trust Badge: "✅ Pay after delivery", "✔ Verified by Kabale Online", or "🛡️ We help if anything goes wrong"
- Pick ONE Psych Trigger: "🔥 Popular in Kabale", "⚡ Selling fast", or "🎓 Student favorite"

====================
SYSTEM INSTRUCTION FOR SEARCHING:
====================
When you use the \`search_catalog\` tool, the system will AUTOMATICALLY attach the products to your message as a menu. You DO NOT need to format or list the products yourself. Just provide the short, persuasive text with the badges!
If the user asks for categories, help, or a menu, just reply: "Tap the button below to see our categories! 👇"

Example Workflow:
User: "I need a charger"
[Tool returns products]
You: 
"Welcome back 👋 

I found these fast chargers for you. ⚡ Selling fast. 

✅ Pay after delivery."`;

// ==========================================
// THE UNIFIED AI ENGINE (Decoupled UI)
// ==========================================
export async function executeAIAgent(userMessages: any[], userName: string = "User"): Promise<{ text: string, products: any[] | null }> {
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
  let responseMessage = response.choices[0]?.message;
  let finalProducts: any[] | null = null;

  if (responseMessage?.tool_calls) {
    const toolCall = responseMessage.tool_calls[0];
    if (toolCall.function.name === "search_catalog") {
      let args;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("⚠️ AI generated bad JSON.");
        return { text: "I had a tiny brain freeze looking that up! 😅 Could you ask me one more time?", products: null };
      }
      
      console.log(`🔍 AI is querying Algolia for: ${args.search_query}`);
      
      // Fetch the exact products and save them directly (Bypassing AI memory)
      const products = await searchAlgoliaCatalog(args.search_query);
      finalProducts = products.length > 0 ? products : null;

      payloadMessages.push(responseMessage);
      payloadMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(products),
      });

      response = await fetchGroqCompletion(payloadMessages);
    }
  }

  return {
    text: response.choices[0]?.message?.content || "Oops, my brain glitched! 🔧 Try that again?",
    products: finalProducts
  };
}

// ==========================================
// 🚀 ALGOLIA SEARCH
// ==========================================
async function searchAlgoliaCatalog(query: string) {
  try {
    const { hits } = await index.search(query, { hitsPerPage: 4 });
    if (hits.length === 0) return [];

    return hits.map((hit: any) => ({
      id: hit.objectID, 
      title: hit.name || hit.title || "Unknown Item",
      price: hit.price
    }));
  } catch (error) {
    console.error("🔥 Algolia Search Error:", error);
    return [];
  }
}

// ==========================================
// HELPER: GROQ API FETCH
// ==========================================
async function fetchGroqCompletion(messages: any[], tools?: any[]) {
  const bodyPayload: any = { model: GROQ_CONFIG.model, messages, temperature: 0.5, top_p: 0.9 };
  if (tools) { bodyPayload.tools = tools; bodyPayload.tool_choice = "auto"; }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify(bodyPayload),
  });
  return await res.json();
}
