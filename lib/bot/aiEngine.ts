import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getCustomerIntent(message: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    
    // 🔥 BULLETPROOF JSON PARSER
    // This regex extracts ONLY the JSON object, even if Gemini adds markdown or text around it
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found in AI response");
    }

  } catch (error) {
    console.error("🚨 AI Engine Error:", error);
    // If AI fails, we safely return unknown so the fallback catches it
    return { action: "unknown", query: "", reply: "" };
  }
}
