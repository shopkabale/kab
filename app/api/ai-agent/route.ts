// app/api/ai-agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { executeAIAgent } from "@/lib/bot/aiService"; // Import from the new service

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "A 'messages' array is required" }, { status: 400 });
    }

        const reply = await executeAIAgent(messages);
    return NextResponse.json(reply, { status: 200 });

  } catch (error) {
    console.error("AI Agent Endpoint Error:", error);
    return new NextResponse(
      "Whoops, looks like I'm having a little trouble connecting right now! 😅 Give it a few seconds and try again.",
      { status: 500 }
    );
  }
}
