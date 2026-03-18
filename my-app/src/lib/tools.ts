import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  getPersonalInfoDocument,
  getProjectDocuments,
  getProjectDocumentsByName,
  getProjectNames,
} from "./content-store";
import { searchProjectEmbeddings } from "./pinecone";

export interface ToolResultWithCitations {
  content: string;
  citedProjects: string[];
}

function formatSnippet(content: string, maxLength: number = 500): string {
  return content.slice(0, maxLength) + (content.length > maxLength ? "..." : "");
}

function includesTechnology(content: string, technology: string): boolean {
  return content.toLowerCase().includes(technology.trim().toLowerCase());
}

async function findTechnologyProjectEvidence(technology: string) {
  const projectDocuments = await getProjectDocuments();
  const normalizedTechnology = technology.trim().toLowerCase();

  return projectDocuments
    .filter((document) => document.fullContent.toLowerCase().includes(normalizedTechnology))
    .map((document) => {
      const matchingChunk =
        document.chunks.find((chunk) =>
          chunk.content.toLowerCase().includes(normalizedTechnology)
        ) ?? document.chunks[0];

      return {
        project_name: document.projectName,
        content: matchingChunk?.content ?? document.fullContent,
        similarity: 1,
      };
    });
}

export const searchProjects = tool(
  async ({ query }): Promise<string> => {
    const results = await searchProjectEmbeddings(query, 5, 0.3, {
      record_type: { $eq: "project" },
    });

    if (results.length === 0) {
      return JSON.stringify({ content: "No relevant project information found for this query.", citedProjects: [] });
    }

    const citedProjects = [...new Set(results.map((r) => r.project_name))];
    const formatted = results.map((r) => ({
      project: r.project_name,
      content: formatSnippet(r.content),
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
    const documents = await getProjectDocumentsByName(projectName);

    if (documents.length === 0) {
      return JSON.stringify({
        content: `No project found matching "${projectName}". Use list_projects to see available projects.`,
        citedProjects: [],
      });
    }

    const citedProjects = [...new Set(documents.map((document) => document.projectName))];
    const fullContent = documents.map((document) => document.fullContent).join("\n\n");
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
    const uniqueProjects = await getProjectNames();

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
    const data = await searchProjectEmbeddings(query, 5, 0.2, {
      record_type: { $eq: "personal_info" },
    });

    if (!data || data.length === 0) {
      const personalInfo = await getPersonalInfoDocument();
      const keywordData =
        personalInfo?.chunks
          .filter((chunk) =>
            chunk.content.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 3)
          .map((chunk) => ({
            content: chunk.content,
            chunk_index: chunk.chunkIndex,
          })) ?? [];

      if (keywordData.length > 0) {
        const formatted = keywordData.map((r) => ({
          content: formatSnippet(r.content, 600),
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
      content: formatSnippet(r.content, 600),
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

export const checkTechnologyExperience = tool(
  async ({ technology }): Promise<string> => {
    const trimmedTechnology = technology.trim();

    const [projectResults, directProjectMatches, personalResults, personalInfo] = await Promise.all([
      searchProjectEmbeddings(trimmedTechnology, 8, 0.2, {
        record_type: { $eq: "project" },
      }),
      findTechnologyProjectEvidence(trimmedTechnology),
      searchProjectEmbeddings(trimmedTechnology, 5, 0.15, {
        record_type: { $eq: "personal_info" },
      }),
      getPersonalInfoDocument(),
    ]);

    const keywordProjectMatches = [
      ...directProjectMatches,
      ...projectResults.filter((result) =>
      includesTechnology(result.content, trimmedTechnology)
      ),
    ];
    const keywordPersonalMatches = personalResults.filter((result) =>
      includesTechnology(result.content, trimmedTechnology)
    );
    const personalKeywordFallback =
      personalInfo?.chunks
        .filter((chunk) => includesTechnology(chunk.content, trimmedTechnology))
        .slice(0, 3)
        .map((chunk) => ({
          content: chunk.content,
          similarity: 1,
        })) ?? [];

    const combinedProjectMatches =
      keywordProjectMatches.length > 0 ? keywordProjectMatches : projectResults;
    const combinedPersonalMatches =
      keywordPersonalMatches.length > 0 ? keywordPersonalMatches : personalResults;

    const citedProjects = [
      ...new Set(combinedProjectMatches.map((result) => result.project_name)),
    ];

    const evidence = [
      ...combinedProjectMatches.slice(0, 5).map((result) => ({
        type: "project",
        project: result.project_name,
        content: formatSnippet(result.content, 400),
        relevance: Math.round(result.similarity * 100) + "%",
      })),
      ...(
        combinedPersonalMatches.length > 0
          ? combinedPersonalMatches
          : personalKeywordFallback
      )
        .slice(0, 3)
        .map((result) => ({
          type: "personal_info",
          content: formatSnippet(result.content, 400),
          relevance:
            "similarity" in result ? Math.round(result.similarity * 100) + "%" : "keyword match",
        })),
    ];

    const hasExperience =
      combinedProjectMatches.length > 0 ||
      combinedPersonalMatches.length > 0 ||
      personalKeywordFallback.length > 0;

    if (!hasExperience) {
      return JSON.stringify({
        content: JSON.stringify(
          {
            technology: trimmedTechnology,
            hasExperience: false,
            summary: `No direct evidence of ${trimmedTechnology} was found in Kyle-Anthony's project corpus or personal background.`,
            evidence: [],
            relatedProjects: [],
          },
          null,
          2
        ),
        citedProjects: [],
      });
    }

    const summary =
      citedProjects.length > 0
        ? `Kyle-Anthony has experience with ${trimmedTechnology}. Evidence appears in ${citedProjects.join(", ")}${combinedPersonalMatches.length > 0 || personalKeywordFallback.length > 0 ? " and his personal background." : "."}`
        : `Kyle-Anthony has experience with ${trimmedTechnology}, based on his personal background information.`;

    return JSON.stringify({
      content: JSON.stringify(
        {
          technology: trimmedTechnology,
          hasExperience: true,
          summary,
          evidence,
          relatedProjects: citedProjects,
        },
        null,
        2
      ),
      citedProjects,
    });
  },
  {
    name: "check_technology_experience",
    description:
      "Check whether Kyle-Anthony has experience with a technology by aggregating evidence from both personal background information and all project descriptions. Use this for questions like 'Does he know X?', 'Has he used Y?', or 'Does he have experience with Z?'.",
    schema: z.object({
      technology: z
        .string()
        .describe("The technology, tool, framework, or platform to verify experience with"),
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
    
    const personalInfo = await getPersonalInfoDocument();

    if (!personalInfo) {
      return JSON.stringify({
        content: "Personal information not found in the database.",
        citedProjects: [],
      });
    }

    const relevantChunks = personalInfo.chunks.filter((chunk) =>
      keywords.some((keyword) => chunk.content.includes(keyword))
    );

    if (relevantChunks.length === 0) {
      const allContent = personalInfo.fullContent;
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

export const allTools = [
  checkTechnologyExperience,
  searchProjects,
  getProjectDetails,
  listProjects,
  searchPersonalInfo,
  getPersonalInfoSection,
];

export function extractCitationsFromToolResult(result: string): { content: string; citedProjects: string[] } {
  try {
    const parsed = JSON.parse(result) as ToolResultWithCitations;
    return { content: parsed.content, citedProjects: parsed.citedProjects || [] };
  } catch {
    return { content: result, citedProjects: [] };
  }
}
