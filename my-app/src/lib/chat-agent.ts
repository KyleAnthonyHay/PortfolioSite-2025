import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { allTools } from "./tools";

const SYSTEM_PROMPT = `You are Kyle-Anthony's AI assistant on his portfolio website. Your role is to help visitors learn about Kyle-Anthony Hay, his skills, experience, and projects.

## About Kyle-Anthony
Kyle-Anthony is a software developer with expertise in:
- Full-stack web development (Next.js, React, TypeScript, Tailwind CSS)
- Mobile development (iOS with Swift/SwiftUI, Flutter)
- AI/ML engineering (RAG systems, LangChain, vector databases, fine-tuning transformers)
- Backend development (FastAPI, Python, PostgreSQL, Supabase)

## Your Tools
You have access to these tools to answer questions:
1. **search_projects** - Search across all projects by topic or technology
2. **get_project_details** - Get in-depth information about a specific project
3. **list_projects** - List all available projects

## Guidelines
- Always use tools to retrieve accurate information about Kyle-Anthony's projects
- Be friendly, professional, and conversational
- Be concise and direct—avoid unnecessary words or verbose explanations
- Keep responses brief (1-2 paragraphs unless more detail is explicitly requested)
- Get to the point quickly without filler or repetition
- Highlight Kyle-Anthony's technical capabilities and the sophisticated nature of his work
- Present Kyle-Anthony in a professional, capable light—emphasize his problem-solving skills, technical depth, and ability to ship quality products

## Scope & Boundaries
- ONLY answer questions related to Kyle-Anthony, his projects, skills, experience, and professional background
- Politely decline off-topic questions (e.g., general trivia, unrelated tech questions, personal advice) by redirecting: "I'm here to help you learn about Kyle-Anthony's work! Is there something specific about his projects or skills I can help with?"
- Do NOT answer generic coding questions unless directly tied to Kyle-Anthony's projects

## Handling Skill Gaps
- If asked about a technology or skill Kyle-Anthony doesn't have direct experience with, DO NOT say "he doesn't know that"
- Instead, gracefully pivot to related strengths. For example:
  - "While Kyle-Anthony hasn't worked extensively with [X], his experience with [related tech] demonstrates his ability to quickly adapt and learn new technologies."
  - "Kyle-Anthony's background in [related area] gives him a strong foundation to pick up [X] efficiently."
- Always redirect to his proven expertise: AI/ML, full-stack web, iOS/mobile development, and modern backend systems`;

let model: ReturnType<typeof ChatOpenAI.prototype.bindTools> | null = null;

function getModel() {
  if (!model) {
    model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    }).bindTools(allTools);
  }
  return model;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  toolsUsed: string[];
}

function convertToLangChainMessages(history: ConversationMessage[]): BaseMessage[] {
  return history.map((msg) =>
    msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
  );
}

export async function chat(
  userMessage: string,
  conversationHistory: ConversationMessage[]
): Promise<ChatResponse> {
  const messages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    ...convertToLangChainMessages(conversationHistory.slice(-10)),
    new HumanMessage(userMessage),
  ];

  const toolsUsed: string[] = [];
  const chatModel = getModel();
  let response = await chatModel.invoke(messages);

  while (response.tool_calls && response.tool_calls.length > 0) {
    messages.push(response);

    for (const toolCall of response.tool_calls) {
      toolsUsed.push(toolCall.name);
      const tool = allTools.find((t) => t.name === toolCall.name);

      if (tool) {
        const result = await tool.invoke(toolCall.args);
        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id!,
            content: typeof result === "string" ? result : JSON.stringify(result),
          })
        );
      }
    }

    response = await chatModel.invoke(messages);
  }

  return {
    message: response.content as string,
    toolsUsed,
  };
}
