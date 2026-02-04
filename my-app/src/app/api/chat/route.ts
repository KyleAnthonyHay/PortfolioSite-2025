import { NextRequest, NextResponse } from "next/server";
import { chat, type ConversationMessage } from "@/lib/chat-agent";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body as {
      message: string;
      history?: ConversationMessage[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await chat(message, history);

    return NextResponse.json({
      message: response.message,
      toolsUsed: response.toolsUsed,
      citedProjects: response.citedProjects,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
