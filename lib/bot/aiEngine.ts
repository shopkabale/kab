import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getCustomerIntent(message: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are a friendly, intelligent shopping assistant for Kabale Online, a marketplace in Kabale, Uganda.
    Analyze this customer message: "${message}"

    Return strictly a JSON object with three keys:
    1. "action": 
       - Output "search" if they are looking for a specific item to buy.
       - Output "support" if they are angry, complaining, or explicitly asking for a human agent.
       - Output "chat" if it is a general question, greeting, or asking how the platform works.
    2. "query": If action is "search", extract the core search keyword (e.g., "iphone", "shoes"). Otherwise, leave empty.
    3. "reply": If action is "chat", write a friendly, helpful reply answering their question (keep it under 3 sentences). Tell them they can type MENU to see options. Otherwise, leave empty.

    OUTPUT JSON ONLY. Do not use markdown blocks or backticks.`;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '');
    
    return JSON.parse(textResponse);
  } catch (error) {
    console.error("🚨 AI Engine Error:", error);
    return { action: "unknown", query: "", reply: "" };
  }
}
