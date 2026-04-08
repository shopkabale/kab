export async function getCustomerIntent(message: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY in environment variables.");

    const prompt = `You are a friendly, intelligent shopping assistant for Kabale Online, a marketplace in Kabale, Uganda.
    Analyze this customer message: "${message}"

    Return strictly a JSON object with three keys:
    1. "action": 
       - Output "search" if they are looking for a specific item to buy.
       - Output "support" if they are angry, complaining, or explicitly asking for a human agent.
       - Output "chat" if it is a general question, greeting, or asking how the platform works.
    2. "query": If action is "search", extract the core search keyword (e.g., "iphone", "shoes"). Otherwise, leave empty.
    3. "reply": If action is "chat", write a friendly, helpful reply answering their question (keep it under 3 sentences). Tell them they can type MENU to see options. Otherwise, leave empty.

    OUTPUT ONLY VALID JSON. Do not include markdown formatting, backticks, or extra text.`;

    // 🚀 BYPASSING THE SDK: Directly hitting the v1beta endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch from Google AI");
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    
    // 🔥 BULLETPROOF JSON PARSER
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found in AI response");
    }

  } catch (error: any) {
    console.error("🚨 AI Engine Error:", error.message);
    // Safe fallback to human agent if the AI fails
    return { action: "unknown", query: "", reply: "" };
  }
}
