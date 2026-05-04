// lib/bot/aiService.ts
import algoliasearch from "algoliasearch";
import { GROQ_CONFIG } from "@/lib/aiContext";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
);
const index = searchClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "products");

const SYSTEM_PROMPT = `You are the elite WhatsApp Sales Closer for Kabale Online, the premium student marketplace in Kabale, Uganda.

====================
YOUR PERSONA & TONE:
====================
- You are highly persuasive, helpful, and fast.
- Keep responses RUTHLESSLY SHORT (1-2 sentences). WhatsApp users hate reading.
- Build trust: Always mention "Pay Cash on Delivery" and "Verified Sellers".

====================
CONVERSATION-TO-SALE OPTIMIZATION (CRITICAL)
====================
You must guide the user to a sale, not just act like a search engine. Follow this exact flow:

STEP 1: CLARIFY (If vague)
If a user asks for a broad category (e.g., "I need earphones", "laptops", "shoes"), DO NOT search immediately. Ask ONE short qualifying question. 
Example: "We have great earphones! Are you looking for Bluetooth or wired?" or "What is your budget?"

STEP 2: SHORTLIST & SEARCH
Once you know what they want, use the \`search_catalog\` tool. 

STEP 3: PUSH TO BUY (The Close)
When the database returns products, DO NOT list them out in text. Present a curated shortlist (max 3 items) using the CATALOG tag. Use scarcity or urgency.
Example: "I found 2 perfect matches that fit your budget. These are selling fast today. Tap below to order with cash on delivery! ||CATALOG:item_abc1=Pro Earbuds|item_xyz2=Bass Hook||"

CRITICAL RULES FOR THE CATALOG TAG:
- Prepend "item_" to the EXACT 'id' provided in the JSON results.
- Include the selected products in your CATALOG tag, separated by a pipe '|'.

FORMAT: ||CATALOG:item_[id1]=Title1|item_[id2]=Title2||`;

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
        properties: { search_query: { type: "string", description: "Specific keyword to search" } },
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
        args = JSON.parse(toolCall.function.arguments);
      } catch (e) {
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
// 🚀 ALGOLIA SEARCH (Optimized for Shortlist)
// ==========================================
async function searchAlgoliaCatalog(query: string) {
  try {
    // Only return top 3 hits so the user isn't overwhelmed (Paradox of Choice)
    const { hits } = await index.search(query, { hitsPerPage: 3 });

    if (hits.length === 0) return { status: "No products found." };

    return hits.map((hit: any) => ({
      id: hit.objectID, 
      title: hit.name || hit.title || "Unknown Item",
      price: hit.price
    }));

  } catch (error) {
    return { status: "Database search failed." };
  }
}

// ==========================================
// HELPER: GROQ API FETCH
// ==========================================
async function fetchGroqCompletion(messages: any[], tools?: any[]) {
  const bodyPayload: any = { model: GROQ_CONFIG.model, messages, temperature: 0.7, top_p: 0.9 };
  if (tools) { bodyPayload.tools = tools; bodyPayload.tool_choice = "auto"; }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify(bodyPayload),
  });
  return await res.json();
}
