export async function getCustomerIntent(message: string) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY in environment variables.");

    const prompt = `You are a friendly, intelligent shopping assistant for Kabale Online, a marketplace in Kabale, Uganda.
    Analyze this customer message: "${message}"

    Return strictly a JSON object with three keys:
    1. "action": 
       - Output "search" if they are looking for a specific item to buy.
       - Output "support" if they are angry, complaining, or explicitly asking for a human agent.
       - Output "chat" if it is a general question, greeting, or asking how the platform works.
    2. "query": If action is "search", extract the core search keyword (e.g., "iphone", "shoes"). Otherwise, leave empty.
    3. "reply": If action is "chat", write a friendly, helpful reply answering their question (keep it under 3 sentences). Tell them they can type MENU to see options. Otherwise, leave empty.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192", // You can change this to "llama3-8b-8192" if you want it even faster
        messages: [
          { role: "system", content: "You are an API that outputs valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1, // Keep it low so it follows the JSON instructions perfectly
        response_format: { type: "json_object" } // 🔥 GROQ MAGIC: Guarantees it won't crash your parser
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch from Groq API");
    }

    // Parse the perfect JSON straight from Groq
    const textResponse = data.choices[0]?.message?.content || "{}";
    return JSON.parse(textResponse);

  } catch (error: any) {
    console.error("🚨 Groq WhatsApp Engine Error:", error.message);
    // Safe fallback to human agent if the AI fails
    return { action: "unknown", query: "", reply: "" };
  }
}
