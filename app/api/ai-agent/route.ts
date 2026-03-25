// app/api/ai-agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, GROQ_CONFIG } from "@/lib/aiContext";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    // Validate that we received an array of messages
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "A 'messages' array is required" },
        { status: 400 }
      );
    }

    // Prepend our System Prompt to the beginning of the conversation history
    const payloadMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Call the Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_CONFIG.model,
        messages: payloadMessages,
        temperature: GROQ_CONFIG.temperature,
        top_p: GROQ_CONFIG.top_p,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Error:", errorText);
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Oops, my brain glitched for a second! 🔧 Try that again?";

    // Return the plain text response so our frontend can easily parse it for the ||SEARCH|| tag
    return new NextResponse(reply, { status: 200 });

  } catch (error) {
    console.error("AI Agent Endpoint Error:", error);
    
    // Friendly fallback if the API is down or rate-limited
    return new NextResponse(
      "Whoops, looks like I'm having a little trouble connecting right now! 😅 Give it a few seconds and try again, or hit up our WhatsApp support.",
      { status: 500 }
    );
  }
}
