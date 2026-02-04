import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchProjectEmbeddings, supabase } from "./supabase";
import { generateEmbedding } from "./openai";

export interface ToolResultWithCitations {
  content: string;
  citedProjects: string[];
}

export const searchProjects = tool(
  async ({ query }): Promise<string> => {
    const embedding = await generateEmbedding(query);
    const results = await searchProjectEmbeddings(embedding, 5, 0.3);

    if (results.length === 0) {
      return JSON.stringify({ content: "No relevant project information found for this query.", citedProjects: [] });
    }

    const citedProjects = [...new Set(results.map((r) => r.project_name))];
    const formatted = results.map((r) => ({
      project: r.project_name,
      content: r.content.slice(0, 500) + (r.content.length > 500 ? "..." : ""),
      relevance: Math.round(r.similarity * 100) + "%",
    }));

    return JSON.stringify({
      content: JSON.stringify(formatted, null, 2),
      citedProjects,
    });
  },
  {
    name: "search_projects",
    description:
      "Search Kyle-Anthony's portfolio projects by semantic similarity. Use this to find information about specific technologies, features, or topics across all projects.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query to find relevant project information"),
    }),
  }
);

export const getProjectDetails = tool(
  async ({ projectName }): Promise<string> => {
    const { data, error } = await supabase
      .from("project_embeddings")
      .select("content, chunk_index, project_name")
      .ilike("project_name", `%${projectName}%`)
      .order("chunk_index", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return JSON.stringify({
        content: `No project found matching "${projectName}". Use list_projects to see available projects.`,
        citedProjects: [],
      });
    }

    const citedProjects = [...new Set(data.map((d) => d.project_name))];
    const fullContent = data.map((d) => d.content).join("\n\n");
    const truncatedContent = fullContent.slice(0, 3000) + (fullContent.length > 3000 ? "\n\n[Content truncated...]" : "");

    return JSON.stringify({
      content: truncatedContent,
      citedProjects,
    });
  },
  {
    name: "get_project_details",
    description:
      "Get detailed information about a specific project by name. Use this when the user asks for in-depth details about a particular project.",
    schema: z.object({
      projectName: z
        .string()
        .describe("The name of the project to get details for (e.g., 'Ontract', 'SelahNote', 'Expense Tracker')"),
    }),
  }
);

export const listProjects = tool(
  async (): Promise<string> => {
    const { data, error } = await supabase
      .from("project_embeddings")
      .select("project_name")
      .order("project_name");

    if (error) throw error;

    const uniqueProjects = [...new Set(data?.map((d) => d.project_name) ?? [])];

    return JSON.stringify({
      content: `Kyle-Anthony's portfolio includes ${uniqueProjects.length} projects:\n\n${uniqueProjects.map((p) => `- ${p}`).join("\n")}`,
      citedProjects: [],
    });
  },
  {
    name: "list_projects",
    description:
      "List all projects in Kyle-Anthony's portfolio. Use this when the user wants to know what projects are available or asks for an overview.",
    schema: z.object({}),
  }
);

export const allTools = [searchProjects, getProjectDetails, listProjects];

export function extractCitationsFromToolResult(result: string): { content: string; citedProjects: string[] } {
  try {
    const parsed = JSON.parse(result) as ToolResultWithCitations;
    return { content: parsed.content, citedProjects: parsed.citedProjects || [] };
  } catch {
    return { content: result, citedProjects: [] };
  }
}
