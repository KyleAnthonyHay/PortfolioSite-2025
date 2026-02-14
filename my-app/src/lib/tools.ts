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

    const uniqueProjects = [...new Set(data?.map((d) => d.project_name) ?? [])].filter(
      (p) => p !== "Personal Info"
    );

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

export const searchPersonalInfo = tool(
  async ({ query }): Promise<string> => {
    const embedding = await generateEmbedding(query);
    
    const { data, error } = await supabase.rpc("match_project_embeddings_by_project", {
      query_embedding: embedding,
      target_project: "Personal Info",
      match_threshold: 0.2,
      match_count: 5,
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      const { data: keywordData } = await supabase
        .from("project_embeddings")
        .select("content, chunk_index")
        .eq("project_name", "Personal Info")
        .ilike("content", `%${query}%`)
        .order("chunk_index", { ascending: true })
        .limit(3);

      if (keywordData && keywordData.length > 0) {
        const formatted = keywordData.map((r) => ({
          content: r.content.slice(0, 600) + (r.content.length > 600 ? "..." : ""),
          relevance: "keyword match",
        }));
        return JSON.stringify({
          content: JSON.stringify(formatted, null, 2),
          citedProjects: [],
        });
      }

      return JSON.stringify({
        content: "No relevant personal information found for this query.",
        citedProjects: [],
      });
    }

    const formatted = data.map((r: { content: string; similarity: number }) => ({
      content: r.content.slice(0, 600) + (r.content.length > 600 ? "..." : ""),
      relevance: Math.round(r.similarity * 100) + "%",
    }));

    return JSON.stringify({
      content: JSON.stringify(formatted, null, 2),
      citedProjects: [],
    });
  },
  {
    name: "search_personal_info",
    description:
      "Search Kyle-Anthony's personal information including skills, experience, education, work status, and background. Use this for questions about his qualifications, years of experience, technologies he knows, education, location, or career interests.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query about Kyle-Anthony's personal info (e.g., 'years of experience', 'education', 'skills', 'work status')"),
    }),
  }
);

export const getPersonalInfoSection = tool(
  async ({ section }): Promise<string> => {
    const sectionKeywords: Record<string, string[]> = {
      skills: ["TECHNICAL SKILLS", "Languages:", "Frameworks", "Backend & APIs", "AI & ML", "Cloud & Infrastructure", "Tools:"],
      experience: ["YEARS OF EXPERIENCE", "PROJECT EXPERIENCE", "TEAM & LEADERSHIP"],
      education: ["EDUCATION", "Degree:", "Institution:", "Graduation"],
      work_status: ["WORK STATUS", "Open to", "LOCATION", "SENIORITY"],
      career: ["CAREER INTERESTS", "iOS", "Frontend", "AI Agents"],
      summary: ["PROFESSIONAL SUMMARY", "NAME:"],
      faq: ["RECRUITER FAQ", "Q:", "A:"],
    };

    const keywords = sectionKeywords[section.toLowerCase()] || [section];
    
    const { data, error } = await supabase
      .from("project_embeddings")
      .select("content, chunk_index")
      .eq("project_name", "Personal Info")
      .order("chunk_index", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return JSON.stringify({
        content: "Personal information not found in the database.",
        citedProjects: [],
      });
    }

    const relevantChunks = data.filter((chunk) =>
      keywords.some((keyword) => chunk.content.includes(keyword))
    );

    if (relevantChunks.length === 0) {
      const allContent = data.map((d) => d.content).join("\n\n");
      return JSON.stringify({
        content: allContent.slice(0, 2000) + (allContent.length > 2000 ? "\n\n[Content truncated...]" : ""),
        citedProjects: [],
      });
    }

    const content = relevantChunks.map((c) => c.content).join("\n\n");
    return JSON.stringify({
      content: content.slice(0, 2500) + (content.length > 2500 ? "\n\n[Content truncated...]" : ""),
      citedProjects: [],
    });
  },
  {
    name: "get_personal_info_section",
    description:
      "Get a specific section of Kyle-Anthony's personal information. Use this for direct questions about specific topics like skills, education, experience, work status, or career interests.",
    schema: z.object({
      section: z
        .string()
        .describe("The section to retrieve: 'skills', 'experience', 'education', 'work_status', 'career', 'summary', or 'faq'"),
    }),
  }
);

export const allTools = [searchProjects, getProjectDetails, listProjects, searchPersonalInfo, getPersonalInfoSection];

export function extractCitationsFromToolResult(result: string): { content: string; citedProjects: string[] } {
  try {
    const parsed = JSON.parse(result) as ToolResultWithCitations;
    return { content: parsed.content, citedProjects: parsed.citedProjects || [] };
  } catch {
    return { content: result, citedProjects: [] };
  }
}
