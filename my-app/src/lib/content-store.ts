import path from "path";
import {
  loadPortfolioDocuments,
  PERSONAL_INFO_PROJECT_NAME,
  type PortfolioDocument,
} from "./project-content";

const descriptionsDir =
  process.env.PORTFOLIO_CONTENT_DIR ||
  path.resolve(process.cwd(), "../backend/project-descriptions");

let documentsPromise: Promise<PortfolioDocument[]> | null = null;

export async function getPortfolioDocuments(): Promise<PortfolioDocument[]> {
  if (!documentsPromise) {
    documentsPromise = loadPortfolioDocuments(descriptionsDir);
  }

  return documentsPromise;
}

export async function getProjectDocumentsByName(
  projectName: string
): Promise<PortfolioDocument[]> {
  const documents = await getPortfolioDocuments();
  const normalizedQuery = projectName.toLowerCase();

  return documents.filter(
    (document) =>
      document.recordType === "project" &&
      document.projectName.toLowerCase().includes(normalizedQuery)
  );
}

export async function getProjectDocuments(): Promise<PortfolioDocument[]> {
  const documents = await getPortfolioDocuments();
  return documents.filter((document) => document.recordType === "project");
}

export async function getProjectNames(): Promise<string[]> {
  const documents = await getPortfolioDocuments();

  return documents
    .filter((document) => document.projectName !== PERSONAL_INFO_PROJECT_NAME)
    .map((document) => document.projectName)
    .sort((a, b) => a.localeCompare(b));
}

export async function getPersonalInfoDocument(): Promise<PortfolioDocument | null> {
  const documents = await getPortfolioDocuments();
  return (
    documents.find(
      (document) => document.projectName === PERSONAL_INFO_PROJECT_NAME
    ) ?? null
  );
}
