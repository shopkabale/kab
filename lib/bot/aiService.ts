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
CRITICAL BEHAVIOR RULES (NON-NEGOTIABLE):
====================
1. NO CONVERSATION LOOPS: If a user names a product (e.g., "charger", "shoes", "otg"), DO NOT ask clarifying questions. Immediately use the \`search_catalog\` tool.
2. EXTREME BREVITY: People hate reading. Use maximum 1 to 2 short lines. No yapping.
3. RECOGNITION: Start your response with a brief, warm recognition (e.g., "Welcome back 👋" or use their name).

====================
TRUST & PSYCHOLOGY (MANDATORY):
====================
Every time you return products, you MUST include ONE Trust Badge and ONE Psychological Trigger in your short text.
- Pick ONE Trust Badge: "✅ Pay after delivery", "✔ Verified by Kabale Online", or "🛡️ We help if anything goes wrong"
- Pick ONE Psych Trigger: "🔥 Popular in Kabale", "⚡ Selling fast", or "🎓 Student favorite"

====================
CATALOG FORMAT & MAIN MENU:
====================
1. Format results exactly like this: ||CATALOG:item_[id1]=Title1|item_[id2]=Title2||
2. You MUST include ALL products returned by the database tool in your CATALOG tag. Separate each with a pipe '|'. Do not leave any out!
3. Prepend "item_" to the EXACT 'id' provided in the JSON results.
4. If the user asks for categories, help, or a menu, just reply: "Type *MENU* to see our categories and useful links! 👇"

Example Workflow:
User: "I need a charger"
[Tool returns: [{"id": "abc1", "title": "100W USB Cable", "price": 10000}, {"id": "xyz2", "title": "Fast Charger", "price": 8000}]]
You: "Welcome back 👋 I found these for you. 🔥 Popular in Kabale. ✅ Pay after delivery. ||CATALOG:item_abc1=100W USB Cable|item_xyz2=Fast Charger||"`;

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
      let args;
      try {
        // Bulletproof JSON parsing to prevent AI hallucination crashes
        args = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("⚠️ AI generated bad JSON:", toolCall.function.arguments);
        return "I had a tiny brain freeze looking that up! 😅 Could you ask me one more time?";
      }
      
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
    const { hits } = await index.search(query, { hitsPerPage: 4 });

    if (hits.length === 0) return { status: "No products found." };

    return hits.map((hit: any) => ({
      id: hit.objectID, 
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
  const bodyPayload: any = { 
    model: GROQ_CONFIG.model, 
    messages, 
    temperature: 0.6, // Low temperature keeps it from inventing conversational fluff
    top_p: 0.9 
  };
  
  if (tools) { 
    bodyPayload.tools = tools; 
    bodyPayload.tool_choice = "auto"; 
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${process.env.GROQ_API_KEY}` 
    },
    body: JSON.stringify(bodyPayload),
  });
  return await res.json();
}
