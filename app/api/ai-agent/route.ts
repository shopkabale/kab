// app/api/ai-agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, GROQ_CONFIG } from "@/lib/aiContext";
import { adminDb } from "@/lib/firebase/admin"; // 🔥 Added Firebase Admin

// ==========================================
// 1. STANDARD NEXT.JS HTTP ENDPOINT (For Web)
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "A 'messages' array is required" }, { status: 400 });
    }

    // Call our newly unified AI engine
    const reply = await executeAIAgent(messages);

    return new NextResponse(reply, { status: 200 });
  } catch (error) {
    console.error("AI Agent Endpoint Error:", error);
    return new NextResponse(
      "Whoops, looks like I'm having a little trouble connecting right now! 😅 Give it a few seconds and try again.",
      { status: 500 }
    );
  }
}

// ==========================================
// 2. THE UNIFIED AI ENGINE (Shared by Web & WhatsApp)
// ==========================================
export async function executeAIAgent(userMessages: any[], userName: string = "User"): Promise<string> {
  const payloadMessages = [
    { 
      role: "system", 
      content: `${SYSTEM_PROMPT}\n\nSystem Override: The user's name is ${userName}. 
      CRITICAL INSTRUCTION: If you recommend a specific product from the database, you MUST append a hidden tag at the very end of your message in this exact format: 
      ||PRODUCT:id:title:price:imageURL|| 
      You can append multiple tags if recommending multiple products. Do not mention these tags to the user.` 
    },
    ...userMessages,
  ];

  // 🛠️ Define the Tool (Function Calling)
  const tools = [
    {
      type: "function",
      function: {
        name: "search_catalog",
        description: "Search the Kabale Online database for active products. Use this whenever the user asks for items, laptops, bundles, or specific products.",
        parameters: {
          type: "object",
          properties: {
            search_query: { 
              type: "string", 
              description: "The search keyword (e.g., 'flash', 'iphone', 'combo', 'laptop')" 
            }
          },
          required: ["search_query"],
        },
      },
    },
  ];

  // 🚀 First Call to Groq
  let response = await fetchGroqCompletion(payloadMessages, tools);

  const responseMessage = response.choices[0]?.message;

  // 🧠 Check if Groq decided to use the search_catalog tool
  if (responseMessage?.tool_calls) {
    const toolCall = responseMessage.tool_calls[0];
    
    if (toolCall.function.name === "search_catalog") {
      const args = JSON.parse(toolCall.function.arguments);
      console.log(`🔍 AI is searching catalog for: ${args.search_query}`);

      // 🔍 Query Firebase
      const products = await searchFirebaseCatalog(args.search_query);

      // Append the AI's tool call intent to history
      payloadMessages.push(responseMessage);

      // Append the actual database results back to the AI
      payloadMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(products),
      });

      // 🚀 Second Call to Groq (to formulate the final natural response based on DB data)
      response = await fetchGroqCompletion(payloadMessages);
    }
  }

  return response.choices[0]?.message?.content || "Oops, my brain glitched for a second! 🔧 Try that again?";
}

// ==========================================
// HELPER: FIREBASE CATALOG SEARCH
// ==========================================
async function searchFirebaseCatalog(query: string) {
  try {
    // We fetch products with stock. (For a massive DB, use Algolia. For Kabale Online, memory filter is perfect & fast)
    const snapshot = await adminDb.collection("products").where("stock", ">", 0).get();
    
    const q = query.toLowerCase().trim();
    
    const matchedProducts = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((p: any) => 
        p.title?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
      .slice(0, 4); // Limit to 4 to prevent WhatsApp chat flooding

    if (matchedProducts.length === 0) return { status: "No products found." };

    // Return clean, mapped data to the AI
    return matchedProducts.map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      stock: p.stock,
      image: p.images?.[0] || p.image || "no-image"
    }));

  } catch (error) {
    console.error("🔥 Firebase Search Error:", error);
    return { status: "Database search failed." };
  }
}

// ==========================================
// HELPER: GROQ API FETCH
// ==========================================
async function fetchGroqCompletion(messages: any[], tools?: any[]) {
  const bodyPayload: any = {
    model: GROQ_CONFIG.model,
    messages: messages,
    temperature: GROQ_CONFIG.temperature,
    top_p: GROQ_CONFIG.top_p,
  };

  if (tools) {
    bodyPayload.tools = tools;
    bodyPayload.tool_choice = "auto";
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq API returned status ${res.status}: ${errorText}`);
  }

  return await res.json();
}
