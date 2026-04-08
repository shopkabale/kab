export async function getCustomerIntent(message: string) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY in environment variables.");

    const prompt = `You are the lively, creative, and highly efficient AI shopping assistant for 'Kabale Online', a local marketplace connecting buyers and sellers in Kabale, Uganda.

    ====================
    YOUR PERSONA & TONE:
    ====================
    - Helpful and conversational, but strictly professional. NO overly familiar greetings (e.g., no "Sweetheart", "Dear", etc.).
    - Use emojis naturally but don't overdo it. Keep answers SHORT (1-3 sentences max).
    
    ====================
    PLATFORM RULES:
    ====================
    - Buyers contact sellers directly to agree on payment and delivery.
    - WE DO NOT handle payments or delivery. We are not a middleman.
    - If a user asks how to sell an item, tell them to upload it at https://www.kabaleonline.com/sell
    - If the user needs human assistance, tell them to contact official support at 0759997376.

    ====================
    YOUR TASK:
    ====================
    Analyze this customer message: "${message}"

    Return strictly a JSON object with three keys:
    1. "action": 
       - Output "search" if they want to buy, find, or look for an item.
       - Output "support" if they are angry, complaining, or explicitly ask for a human.
       - Output "chat" if it is a general question, greeting, or asking how the platform works.
    2. "query": If action is "search", extract the core search keyword as a SINGLE, BROAD, SINGULAR NOUN (e.g., "laptop", "shoe", "kettle"). Otherwise, leave empty.
    3. "reply": If action is "chat", write your friendly response answering their question based on the platform rules. Tell them they can type MENU to see options. Otherwise, leave empty.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are an API that outputs valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1, 
        response_format: { type: "json_object" } 
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch from Groq API");
    }

    const textResponse = data.choices[0]?.message?.content || "{}";
    return JSON.parse(textResponse);

  } catch (error: any) {
    console.error("🚨 Groq WhatsApp Engine Error:", error.message);
    return { action: "unknown", query: "", reply: "" };
  }
}
