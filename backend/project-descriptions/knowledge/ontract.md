---
project: OnTract
slug: ontract
type: project
role: "team: backend engineer (database migrations and design); later a solo rebuild of the backend on Convex"
status: live demo at ontract.kyleanthonyhay.com; built as a training-program team project, later rebuilt by Kyle on a separate branch
---

# OnTract

## Overview
<!-- meta: {"type":"project","project":"OnTract","category":"overview","technologies":["Next.js","React","TypeScript","Supabase","PostgreSQL","pgvector","Convex","OpenAI","RAG","Resend"]} -->
OnTract is an AI-powered contract management platform for businesses that handle many client agreements. Teams keep track of clients and contracts, upload agreements (PDF, DOCX, TXT or Markdown), and the system reads each document, confirms it is actually a contract, extracts its key terms, and indexes it so people can ask questions about their contracts in plain English. Owners get emailed before a contract expires, and client contacts can be invited to a read-only portal that shows only the contracts shared with them.

OnTract is Kyle-Anthony Hay's flagship project, and it was a team effort. It was built by a team of engineers during the Revature AI Engineering training program, with commits on the main branch running from January 21 to January 30, 2026. Kyle worked on the team as a backend engineer focused on database migrations and design; teammates built the AI agent. In October 2026 Kyle went back on his own and rebuilt the backend on Convex on a separate branch. That rebuild replaced Supabase, removed Stripe billing, redesigned the interface and added a seeded demo workspace.

The team version used Next.js, Supabase (Postgres with pgvector, Auth, Storage, Edge Functions, pg_cron), OpenAI GPT-4o and text-embedding-3-small, Stripe and Resend. The team also prototyped Python services with LangGraph, LangChain, FastAPI and AWS Bedrock. Kyle's rebuild runs on Next.js 16 and Convex, using Convex's built-in vector search, Convex Auth, crons and HTTP streaming, with OpenAI for extraction and chat. A public demo is at ontract.kyleanthonyhay.com, with a fictional company, nine clients and eleven contracts that went through the real AI pipeline.

## Problem and users
<!-- meta: {"type":"project","project":"OnTract","category":"problem","technologies":["RAG","semantic search"]} -->
OnTract addresses a common problem for legal teams, contract managers and account teams. Contracts pile up as PDFs and Word files in shared drives, the important terms (counterparty, effective and expiration dates, renewal type, governing law, payment and termination terms, obligations) are buried in the text, and a renewal deadline is easy to miss. Answering a simple question like "which of our contracts auto-renew?" or "what are the termination terms with this client?" means opening and reading documents by hand. Keyword search doesn't help much, because contract language varies from document to document.

OnTract's answer is to make every uploaded contract machine-readable. Each document is checked to confirm it is really a contract and classified by type (for example MSA, SOW, NDA, DPA, license, SLA, lease or reseller agreement). Its key terms are pulled into structured fields and its text is embedded for semantic search, so an assistant can answer questions grounded in the actual contract text and cite which document an answer came from.

OnTract serves three kinds of users:
- Team admins, who set up the organization, invite teammates, manage roles and contract types, and see the whole portfolio.
- Team members, who own contracts, collaborate on them, comment, and use the AI assistant.
- Client contacts, who get a read-only portal showing only the contracts shared with their company.

Expiration emails and a daily job that automatically marks overdue contracts as expired keep contract status accurate without anyone checking it by hand.

## Kyle's role
<!-- meta: {"type":"project","project":"OnTract","category":"role","technologies":["Supabase","PostgreSQL","pgvector","pg_cron","pg_net","Deno","Edge Functions","Resend","Convex","OpenAI","Next.js"]} -->
OnTract was a team project built during the Revature AI Engineering training program, and most of the original codebase was a team effort. Kyle was one of the backend engineers, focused on database migrations and design. Teammates built the AI agent, so the team-phase agent work is not his. Git history shows what he personally committed in the team phase:

- **Database schema work.** Kyle refactored the Postgres migrations. He added columns to the user, contract, client, document type and audit log tables (including linking app users to Supabase auth users and recording the user and IP address on audit entries) and restored the client and chunks tables.
- **Vector search alignment.** Kyle changed the embedding column and the pgvector similarity search functions to 1024 dimensions so stored vectors matched the embedding configuration the AI pipeline used.
- **Contract expiration notifications.** Kyle wrote a Supabase Edge Function in Deno and TypeScript that finds active contracts expiring within seven days and emails each contract owner through Resend. It records a notification so the same contract never triggers a second email. He also wrote the pg_cron and pg_net migration that runs it every hour, with the endpoint and key read from Supabase Vault.

Kyle's solo follow-up in October 2026 is clearly his own work. He moved the whole backend from Supabase to Convex, covering schema, auth, data functions, the document ingestion pipeline, the streaming RAG chat, emails and crons. He rewired the Next.js app to Convex, removed Stripe billing and seat limits, redesigned the interface and landing page, and wrote a seed script that builds the demo workspace. Those commits list an AI coding assistant as co-author.

## Features
<!-- meta: {"type":"project","project":"OnTract","category":"features","technologies":["Next.js","OpenAI","Resend","semantic search"]} -->
OnTract gives business teams these user-facing features (as built by the team and kept in Kyle's rebuild):

- **Contract and client management.** Teams create clients and contacts, add contracts with status (draft, pending review, active, expired), owner, client, type and dates, and download contracts.
- **AI document upload.** Uploading a PDF, DOCX, TXT or Markdown file runs automatic checks. The model confirms the file is a contract and detects its type. If the user said which type to expect and the model is confident the file is a different type, the upload is rejected. The model then fills in the counterparty, effective and expiration dates, renewal type, governing law, payment and termination summaries, and a list of key obligations.
- **Ask AI.** A chat assistant answers questions in two modes. Document mode covers the contract being viewed. Global mode covers the whole organization's contracts, clients, team and recent activity. Answers stream in live and list the source excerpts and contract names.
- **Expiration alerts.** Contract owners are emailed once when an active contract is within seven days of expiring, and overdue contracts are automatically moved to expired.
- **Team collaboration.** Admins invite teammates by email, assign roles, add internal and external collaborators to contracts, and leave comments. An audit log records activity.
- **Client portal.** Client contacts receive an email invite and get read-only access to their own contracts.
- **Contract type requests.** Users can ask admins to add a new contract type.
- **Billing (team version only).** The team version had Stripe subscriptions, a pricing page and seat limits. Kyle removed these in his rebuild.

## Architecture
<!-- meta: {"type":"project","project":"OnTract","category":"architecture","technologies":["Next.js","Supabase","PostgreSQL","pgvector","Deno","Edge Functions","LangChain","LangGraph","FastAPI","AWS Bedrock","Convex","OpenAI","Server-Sent Events"]} -->
OnTract has gone through two architectures.

**Team version (Supabase).** A Next.js App Router front end used server actions and Supabase Auth. Data lived in Supabase Postgres, defined by about 35 SQL migrations covering organizations, users, clients, contacts, contracts, collaborators, comments, invitations, notifications, audit logs, invoices and a chunks table with a pgvector embedding column. Uploads went to Supabase Storage. Deno Edge Functions did the heavy work. One ingested documents (extract text, validate with GPT-4o, extract metadata, chunk with a LangChain text splitter, embed with OpenAI, store chunks). One handled chat by embedding the question, calling a SQL similarity function filtered to the organization and streaming a GPT-4o answer with sources. Others sent invitations and expiration emails through Resend. pg_cron called the expiration function on a schedule. The team also built Python prototypes: a FastAPI ingestion service with AWS Bedrock, and a LangGraph ReAct agent with global and document search tools. The shipped web app called the Edge Functions rather than these prototypes.

**Kyle's rebuild (Convex).** The Next.js app reads live data through Convex queries. Convex holds the database, file storage, auth, vector index, scheduled crons and an HTTP endpoint. The browser uploads a file straight to Convex storage, and a Convex action extracts the text, calls OpenAI for validation and metadata, chunks and embeds the text, and saves chunks into a table with a vector index filtered by organization and contract. Chat is a Convex HTTP action that checks the user's access, runs a vector search, then streams the model's answer back as server-sent events. Two crons send expiration emails and mark overdue contracts as expired.

## Tech stack and why
<!-- meta: {"type":"project","project":"OnTract","category":"tech-stack","technologies":["Next.js","React","TypeScript","Tailwind CSS","Radix UI","Supabase","PostgreSQL","pgvector","Convex","Convex Auth","OpenAI","GPT-4o","text-embedding-3-small","Resend","Stripe","LangChain","LangGraph","AWS Bedrock","unpdf","mammoth"]} -->
OnTract's main technology choices and the reasons for each:

- **Next.js, React 19, TypeScript, Tailwind CSS and Radix UI** for the web app. App Router gives route groups for the marketing site, the app, the client portal and the auth pages in one codebase. Radix gives accessible UI primitives instead of building them by hand.
- **Supabase with Postgres and pgvector (team version).** Supabase bundles Postgres, auth, storage, Edge Functions and cron, so the team could keep relational contract data and embedding vectors in one database instead of running a separate vector store such as Pinecone. Row Level Security policies were written for multi-tenant isolation (see the decisions section for what happened to them).
- **Convex (Kyle's rebuild).** Convex combines the database, file storage, vector search, crons, HTTP actions and auth in one TypeScript backend with live queries. That removed the Docker-based local Supabase setup and the separate Deno runtime, so the whole project runs with plain npm. The alternative was to keep Supabase and fix its RLS setup.
- **OpenAI GPT-4o and text-embedding-3-small.** GPT-4o handles JSON-mode validation and extraction plus chat. The small embedding model is cheap and good enough for retrieving contract clauses. The team also tried AWS Bedrock (Claude) in its Python prototypes, but the shipped Edge Functions used OpenAI.
- **LangChain and LangGraph (team phase).** These were used for text splitting, the Python ReAct agent and LangSmith tracing. Kyle's rebuild uses plain OpenAI SDK calls and a hand-written splitter so everything runs inside the Convex runtime.
- **unpdf and mammoth** read text from PDF and DOCX files inside Convex.
- **Resend** sends invitation and expiration emails. **Stripe** handled subscriptions in the team version.

## Document ingestion pipeline
<!-- meta: {"type":"project","project":"OnTract","category":"document-ingestion-pipeline","technologies":["OpenAI","GPT-4o","text-embedding-3-small","Convex","Supabase Edge Functions","unpdf","mammoth","embeddings","LLM extraction","JSON mode"]} -->
The document ingestion pipeline is the core AI feature of OnTract. It turns an uploaded contract into structured data and searchable vectors. The team built it as a Supabase Edge Function, and Kyle reimplemented it as a Convex action in his rebuild. In the Convex version:

1. **Upload and guard rails.** The browser uploads the file straight to storage. The action then checks the file extension (PDF, DOCX, TXT, MD) and the 10 MB size limit.
2. **Text extraction.** PDFs are read with unpdf and Word files with mammoth. The Convex runtime doesn't support the transfer list pdf.js passes to structuredClone, so the code wraps structuredClone to copy instead of transfer.
3. **Contract validation.** GPT-4o in JSON mode at temperature 0 reads the first 8,000 characters. It returns whether the file is a contract, its type from a fixed list, a confidence score and a reason. Anything outside the list becomes "other." The upload is rejected if the file isn't a contract, or if the user named an expected type and the model detects a different one with confidence above 0.7.
4. **Metadata extraction.** A second JSON-mode call pulls out the counterparty, dates, renewal type, governing law, payment and termination summaries, and obligations, using null for anything the contract doesn't state. If this step fails, ingestion still continues with empty metadata.
5. **Chunking and embedding.** Text is split into roughly 1,200-character chunks with 200 characters of overlap. Splits prefer paragraph, then line, then sentence boundaries. Chunks are embedded in batches of 100.
6. **Save.** One mutation writes the chunks, embeddings and metadata to the contract.

Every failure returns a specific error code (for example NOT_A_CONTRACT, TYPE_MISMATCH, TEXT_EXTRACTION_FAILED or RATE_LIMITED) and deletes the uploaded file so storage doesn't fill with orphans. Rate limits are marked retryable.

## RAG chat assistant
<!-- meta: {"type":"project","project":"OnTract","category":"rag-chat","technologies":["RAG","vector search","embeddings","OpenAI","GPT-4o","Convex","pgvector","Server-Sent Events","LangGraph","prompt engineering"]} -->
OnTract's Ask AI assistant uses retrieval-augmented generation (RAG) to answer questions about contracts. In the team version it ran in a Supabase Edge Function that called a pgvector cosine-similarity SQL function filtered to the organization, with retries and LangSmith tracing. The team also prototyped a LangGraph ReAct agent that chose between a global search tool and a document search tool. Kyle rebuilt the assistant as a Convex HTTP action.

The assistant has two modes:
- **Document mode** is for questions about the contract on screen. Vector search is filtered to that contract's id.
- **Global mode** is for questions across the organization. Vector search is filtered to the organization. The prompt also gets a compact summary of the organization: team members and roles, clients with their contract counts, every contract with its type, status, client and expiry, counts by status, and the ten most recent audit-log events. That lets it answer portfolio questions like "how many contracts expire this month?" that pure chunk retrieval would miss.

The request flow works like this. First the action checks that the caller is a signed-in team member and that the contract belongs to their organization. It embeds the question, pulls 16 nearest chunks, drops any below a 0.2 similarity score, and keeps the top five. Excerpts are labeled with the section number and, in global mode, the contract title, so the model can cite "According to [Document Name]." The answer streams back as server-sent events with distinct event types for thinking, sources, content, done and error, so the interface can show sources before the text arrives. The system prompt keeps the assistant on the topic of contracts and tells it to say when something isn't in the material provided. If retrieval fails, the assistant still answers from the organization data instead of erroring out.

## Expiration alerts and scheduled jobs
<!-- meta: {"type":"project","project":"OnTract","category":"expiration-alerts","technologies":["Supabase Edge Functions","Deno","pg_cron","pg_net","Supabase Vault","Resend","Convex crons"]} -->
OnTract's expiration alerts are the piece of the team version Kyle built end to end, and he carried the same design into his Convex rebuild.

In the team version, Kyle wrote a Supabase Edge Function in Deno. It uses a service-role client to find active, non-deleted contracts whose expiration date falls between today and seven days from now, joining each contract's owner and client. For each one it checks the notifications table for an existing seven-day notice for that owner and contract. If none exists, it sends an HTML email through Resend with the contract name, client, expiry date, days remaining and a link to the contract. It then writes a notification record so the hourly job never emails the same owner twice about the same contract. The function counts contracts processed, emails sent, contracts skipped and errors, and returns those counts. A failure on one contract is recorded but doesn't stop the rest. Kyle's SQL migration enables pg_cron and pg_net and schedules an hourly HTTP call to the function. It reads the function URL and key from Supabase Vault so no secrets are written into the migration.

In the Convex rebuild, the same logic is split into a query, an action and a mutation. The query uses a compound index on status and expiration date and skips contracts that already have a notice. The action sends the emails, and the mutation records each notice. A second daily cron moves active contracts past their expiry date to expired and writes an audit-log entry with the source "agent," so the activity feed shows the change was automatic.

## Engineering decisions and tradeoffs
<!-- meta: {"type":"project","project":"OnTract","category":"decisions-tradeoffs","technologies":["Supabase","Row Level Security","Convex","OpenAI","LangChain","LangGraph","AWS Bedrock","Stripe","pgvector"]} -->
OnTract involved several real engineering tradeoffs.

- **Row Level Security was written and then turned off.** The team wrote Postgres RLS policies for organization isolation. Later migrations first disabled them "to get app functional" and then disabled RLS on all tables, so the team version relied on application-level filtering. In Kyle's Convex rebuild, every query and mutation goes through shared access helpers. These resolve the signed-in user to a team member or a portal contact and check that each record belongs to that person's organization. Vector search is filtered by organization or contract id. Tenant isolation lives in the code that every data function calls.
- **Python agent versus Edge Functions.** The team built a LangGraph ReAct agent and a FastAPI ingestion service on AWS Bedrock, but the web app called TypeScript Edge Functions using OpenAI. This kept deployment inside Supabase. The cost was two parallel implementations. Kyle's rebuild removed the unused Python folders.
- **Org summary in the prompt.** Global chat combines vector retrieval with a structured summary of the organization. Questions about counts, statuses and teammates are better answered from structured data than from text chunks. The tradeoff is a longer prompt as the organization grows.
- **Plain SDK over LangChain.** The rebuild calls the OpenAI SDK directly and uses a small hand-written splitter that keeps the old splitter's sizes. This avoided runtime compatibility problems in Convex and reduced dependencies.
- **Embedding dimensions.** The team version stored 1024-dimension vectors (Kyle aligned the schema and search functions to that size). The rebuild uses the model's default 1536 dimensions with Convex's vector index.
- **Billing removed.** Kyle removed Stripe and seat limits so the public demo is fully usable without a subscription.

## Challenges
<!-- meta: {"type":"project","project":"OnTract","category":"challenges","technologies":["Supabase","Row Level Security","Convex","Convex Auth","pdf.js","unpdf","OpenAI","Resend"]} -->
The OnTract codebase and commit history show the problems the system had to handle:

- **Multi-tenant security under deadline pressure.** RLS policies conflicted with app flows such as signup, invitations and portal access, and the team disabled them to keep the app working. Kyle's rebuild solved isolation by putting organization checks in every backend function.
- **Moving a team codebase to a new backend.** Kyle's migration replaced Postgres tables, RLS, Edge Functions, pg_cron, Supabase Auth and Storage with Convex equivalents. It moved the Next.js app to the repo root and rewired every page to live Convex queries. The two main migration commits deleted roughly 29,000 lines and added about 12,000.
- **Auth race conditions.** One fix addressed signup and invite acceptance racing the newly created session. Another made stale sessions for deleted users sign out cleanly.
- **Document parsing in a restricted runtime.** pdf.js passes a transfer list to structuredClone, which the Convex runtime doesn't support, so the code patches it to copy instead. PDF and DOCX libraries are loaded on demand.
- **Unreliable model output and rate limits.** LLM JSON is normalized: unknown contract types map to "other," missing confidence defaults to a neutral value, and a failed metadata step doesn't block ingestion. Rate-limit and timeout errors become a friendly retryable message. The OpenAI client retries three times with a 120-second timeout.
- **Duplicate notifications.** Hourly jobs could email the same owner repeatedly. Recording a notice for each contract and checking for it before sending prevents that.
- **Graceful degradation.** Without a Resend key, emails are logged instead of sent. If vector search fails, chat still answers.

[NEEDS KYLE: hardest part in your words]

## Quality and operations
<!-- meta: {"type":"project","project":"OnTract","category":"quality-operations","technologies":["Vitest","Deno test","GitHub","Convex Auth","Supabase Vault","LangSmith","Resend"]} -->
OnTract's quality and operations practices, as present in the repo:

- **Team workflow.** The team used GitHub pull requests with a PR template and issue templates for bugs, docs and features. Work was organized as feature branches (database schema, RLS policies, indexes, triggers, vector search functions, ingestion agent, main agent, global and document search, notifications), then promoted from dev to a staging branch to main.
- **Tests.** In the team version, the chat, ingestion and invitation Edge Functions each had Deno test files for their handlers and helper libraries. Kyle's rebuild has Vitest configured with a unit test for shared utilities. There is no automated CI pipeline in the repo.
- **Security.** In the rebuild, every Convex function checks the caller's identity and organization through shared helpers. Admin-only actions require the admin role, and portal users can only reach the contracts shared with them. Invitations use emailed tokens. CORS on the chat endpoint is limited to the site URL. Kyle's team-phase cron migration read its endpoint and key from Supabase Vault. In the team version, Row Level Security was ultimately disabled (see the decisions section).
- **Observability.** The team version wired LangSmith tracing into the chat Edge Function. Ingestion and email jobs log what they process, skip and fail on.
- **Cost and resilience.** Prompts send at most the first 8,000 characters for validation and 12,000 for extraction. Embeddings are batched. Chat sends only the top five excerpts above a similarity threshold. Uploads over 10 MB are rejected before any model call.
- **Demo data.** A seed script builds a realistic demo workspace. Its nine generated contract PDFs run through the real ingestion pipeline, so the extracted terms, alerts and chat answers in the demo come from the actual pipeline.

## Outcomes and business value
<!-- meta: {"type":"project","project":"OnTract","category":"outcomes","technologies":["RAG","OpenAI","Convex"]} -->
OnTract delivers several kinds of business value for a team managing many contracts. Contract review that used to be manual becomes structured data: the key terms and obligations are extracted when a file is uploaded instead of someone reading and typing them in. Renewal and expiry risk drops because owners get an automatic email a week ahead and statuses update themselves. Questions about a single contract or the whole portfolio get grounded answers with the source documents named, instead of searching through files. Client contacts can see their own contracts in a self-service portal, which cuts back-and-forth email.

For the team, OnTract was the capstone-style build of the Revature AI Engineering program. It involved a full multi-tenant SaaS data model, an LLM ingestion pipeline and a RAG assistant, built by a team working in parallel feature branches. For Kyle, the October 2026 rebuild turned the team codebase into a live, self-contained demo that anyone can sign into and try with realistic contracts. It shows he can take over an existing product, simplify its infrastructure and ship it.

No usage or revenue numbers are claimed for OnTract.

## Status and next steps
<!-- meta: {"type":"project","project":"OnTract","category":"status","technologies":["Convex","Supabase","Next.js"]} -->
OnTract exists in two states. The team version (Next.js plus Supabase, with Stripe billing) is on the main branch. Its last commits are from January 30, 2026, at the end of the Revature program. Kyle's solo Convex rebuild is on a separate migration branch with commits from October 2 and 3, 2026. That branch has the redesigned interface, a landing page with a tabbed product tour, a pricing page, page transitions, an improved Ask AI panel, and a seeded demo workspace for a fictional analytics company with team and client-portal logins. The public demo at ontract.kyleanthonyhay.com runs the Convex rebuild on Vercel.

Open items visible in the code:
- The team's Python LangGraph agent left a TODO to pull structured sources out of tool calls. Its pieces were not wired into the shipped app and were removed in the rebuild.
- Test coverage in the rebuild is light (one Vitest unit test), and there is no CI pipeline.
- Billing was intentionally removed from the rebuild and would need to come back for a paid product.
- Global chat puts the whole organization summary into the prompt. Very large organizations would need that summary trimmed or paginated.

## Skills demonstrated
<!-- meta: {"type":"project","project":"OnTract","category":"skills","technologies":["Next.js","React","TypeScript","Supabase","PostgreSQL","pgvector","pg_cron","Deno","Edge Functions","Convex","OpenAI","GPT-4o","text-embedding-3-small","RAG","Resend","Stripe","LangChain","LangGraph","AWS Bedrock"]} -->
OnTract shows the following skills. Kyle's personal contributions are marked; the rest of the team-era platform was a shared team effort.

- **AI engineering (Kyle's solo Convex rebuild):** retrieval-augmented generation (RAG), semantic search, vector search, embeddings (OpenAI text-embedding-3-small), vector databases (pgvector, Convex vector index), LLM document classification and validation, structured data extraction with JSON mode, chunking with overlap, prompt engineering, scoped and grounded answers with source citations, streaming LLM responses over server-sent events, handling rate limits and retries, and familiarity with the team's agent framework choices (LangChain, LangGraph ReAct agents, AWS Bedrock).
- **Backend engineering (Kyle's team role):** relational schema design and Postgres migrations, multi-tenant data modeling, pgvector similarity search functions, Supabase Edge Functions in Deno and TypeScript, scheduled jobs with pg_cron and pg_net, secrets in Supabase Vault, transactional email with Resend, and idempotent notification jobs.
- **Full-stack web (Kyle's rebuild):** Next.js App Router, React 19, TypeScript, Tailwind CSS, Radix UI, Convex (database, auth, file storage, crons, HTTP actions, live queries), role-based access control, a read-only client portal, invitation flows, and audit logging.
- **Migration and modernization:** moving a production-style app from Supabase to Convex, cutting infrastructure (no Docker), removing dead code and unused services, and building realistic seed and demo data.
- **Teamwork:** working inside a multi-engineer team with feature branches, pull requests and a dev, staging and main promotion flow.
- **Forward deployed engineering relevance:** taking over an existing team codebase, putting AI into a real business workflow (contract review, renewals, client self-service), and shipping a working, demo-ready product end to end.
