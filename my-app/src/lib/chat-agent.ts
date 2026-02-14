import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { allTools, extractCitationsFromToolResult } from "./tools";

function getSystemPrompt(): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are Kyle-Anthony's AI assistant on his portfolio website. Your role is to help visitors learn about Kyle-Anthony Hay, his skills, experience, and projects.

Today's date is ${currentDate}.

## CRITICAL: Tool Usage Requirements
You MUST use tools to answer questions. Do NOT rely on assumptions or general knowledge.

**For questions about skills, technologies, experience, education, or qualifications:**
→ ALWAYS call \`search_personal_info\` or \`get_personal_info_section\` FIRST

**For questions about projects or what Kyle-Anthony has built:**
→ ALWAYS call \`search_projects\` or \`get_project_details\` FIRST

**Never assume** Kyle-Anthony does or doesn't know a technology—always verify with a tool call.

## Your Tools
1. **search_personal_info** - Search Kyle-Anthony's background, skills, experience, education. USE THIS for any "does he know X?" or "has he worked with Y?" questions.
2. **get_personal_info_section** - Get specific sections: 'skills', 'experience', 'education', 'work_status', 'career', 'summary', or 'faq'
3. **search_projects** - Search across all projects by topic or technology
4. **get_project_details** - Get in-depth information about a specific project
5. **list_projects** - List all available projects

## Response Guidelines
- Be friendly, professional, and conversational
- Be concise and direct—avoid unnecessary words or verbose explanations
- Keep responses brief (1-2 paragraphs unless more detail is explicitly requested)
- Get to the point quickly without filler or repetition
- Highlight Kyle-Anthony's technical capabilities and the sophisticated nature of his work
- Present Kyle-Anthony in a professional, capable light—emphasize his problem-solving skills, technical depth, and ability to ship quality products
- When you see a technology with a start year (e.g., "Python: 2022"), calculate years of experience as (current year - start year). Present it naturally, e.g., "Kyle-Anthony has about 4 years of experience with Python."

## Scope & Boundaries
- ONLY answer questions related to Kyle-Anthony, his projects, skills, experience, and professional background
- Politely decline off-topic questions (e.g., general trivia, unrelated tech questions, personal advice) by redirecting: "I'm here to help you learn about Kyle-Anthony's work! Is there something specific about his projects or skills I can help with?"
- Do NOT answer generic coding questions unless directly tied to Kyle-Anthony's projects

## Handling Skill Gaps
- If a tool search confirms Kyle-Anthony doesn't have direct experience with something, DO NOT say "he doesn't know that"
- Instead, gracefully pivot to related strengths. For example:
  - "While Kyle-Anthony hasn't worked extensively with [X], his experience with [related tech] demonstrates his ability to quickly adapt and learn new technologies."
  - "Kyle-Anthony's background in [related area] gives him a strong foundation to pick up [X] efficiently."
- Always redirect to his proven expertise: AI/ML, full-stack web, iOS/mobile development, and modern backend systems`;
}

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
  citedProjects: string[];
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
    new SystemMessage(getSystemPrompt()),
    ...convertToLangChainMessages(conversationHistory.slice(-10)),
    new HumanMessage(userMessage),
  ];

  const toolsUsed: string[] = [];
  const citedProjectsSet = new Set<string>();
  const chatModel = getModel();
  let response = await chatModel.invoke(messages);

  while (response.tool_calls && response.tool_calls.length > 0) {
    messages.push(response);

    for (const toolCall of response.tool_calls) {
      toolsUsed.push(toolCall.name);
      const tool = allTools.find((t) => t.name === toolCall.name);

      if (tool) {
        const result = await tool.invoke(toolCall.args);
        const resultString = typeof result === "string" ? result : JSON.stringify(result);
        
        const { content, citedProjects } = extractCitationsFromToolResult(resultString);
        citedProjects.forEach((p) => citedProjectsSet.add(p));
        
        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id!,
            content,
          })
        );
      }
    }

    response = await chatModel.invoke(messages);
  }

  return {
    message: response.content as string,
    toolsUsed,
    citedProjects: [...citedProjectsSet],
  };
}
