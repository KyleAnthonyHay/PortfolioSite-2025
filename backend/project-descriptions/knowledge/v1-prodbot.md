---
project: V1 ProdBot
slug: v1-prodbot
type: project
role: solo
status: live (Vercel frontend + Convex production backend, public demo church); homepage and multi-church sign-in work on a redesign branch
---

# V1 ProdBot

## Overview
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"overview","technologies":["React","TypeScript","Vite","Convex","OpenAI Responses API","React Flow","Vercel"]} -->
V1 ProdBot is a documentation and troubleshooting assistant that Kyle-Anthony Hay built solo for the production (audio, video, lighting and stream) teams at V1 Church campuses. A volunteer on a Sunday morning can type a symptom like "no sound from the playback Mac" and get a streamed, step-by-step answer grounded only in that campus's approved documentation: the wiring graph, a list of known pitfalls, the service runbook and a systems overview. Answers cite the pitfall ids, runbook steps and device ids they used, and the model's reasoning summary streams into a collapsible "Thinking" block above the answer.

The app has three areas. Ask is the chat. Explore is an interactive wiring diagram of the campus built with React Flow. Admin is where a production lead turns pasted notes, TXT files or PDFs into AI-drafted documentation, then reviews each draft side by side against the approved version before anything goes live.

Kyle built it with React 19, TypeScript and Vite on the frontend, Convex as the backend and database, and the OpenAI Responses API for chat, structured wiring output and document generation. The frontend is deployed on Vercel and the backend on a Convex production deployment. The git history runs from mid-September 2026 to early October 2026: the first commit implemented and deployed the app, a second release redesigned it as a sidebar-plus-chat workspace with streamed reasoning and a chat-driven wiring editor, and later commits added email sign-in, per-church data, a nightly-reset demo church and an animated marketing homepage.

## Problem and users
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"problem","technologies":[]} -->
V1 ProdBot targets a specific, real problem: church production teams run mostly on volunteers, and the knowledge of how a campus is wired (which stage box feeds which console input, how the playback computer reaches the stream, what broke last month and how it was fixed) tends to live in a few people's heads, scattered notes and PDFs. When something fails minutes before a service, the volunteer at the desk needs the right first check, not a long manual.

The app's system prompt makes this framing explicit. It tells the model it is helping volunteers and engineers set up and troubleshoot Sunday morning production, that people read answers on a phone with a service about to start, and that it should be symptom-first: name the most likely cause and the first thing to check, then walk the documented signal chain hop by hop from the device closest to the symptom. It must never invent port numbers, channels, IP addresses or model names, and must say plainly when something is not documented and what an admin should add.

There are two user groups:
- Volunteers and production staff, who ask questions in chat, browse the wiring diagram, work through a dated runbook checklist, and report fixes they found.
- Production leads acting as admins, who feed in raw notes and keep the approved documentation current without writing YAML or markdown by hand.

The product is multi-campus by design: each campus has its own documents and chats, while links and a glossary are shared across a church. The project started as a direct request: V1 Church's head global audio engineer and floor manager asked Kyle to build it for the production team, and Kyle scoped and built it around how that team actually works during services.

## Kyle's role
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"role","technologies":["React","Convex","OpenAI Responses API","React Flow","Vercel","GitHub Actions"]} -->
V1 ProdBot is a solo project: every commit in the repository is by Kyle-Anthony Hay, and he owned the product end to end. That covers scoping the problem for a nontechnical audience of church production volunteers, designing the data model and document workflow, the AI prompting and structured-output design, the frontend, the wiring diagram layout engine, the tests and CI, and deployment to Vercel and Convex.

Specific pieces Kyle designed and built:
- The grounded chat agent, including streaming answer text and reasoning summaries into Convex so every open client updates live.
- A draft-and-approve documentation pipeline with revision history, stale-draft protection and source attribution.
- A typed wiring graph model (devices, groups, signals, cables, nested internal wiring) with validation, diffing and a deterministic layout algorithm.
- The chat-driven wiring workspace, where an admin describes a setup in plain language and the AI redraws the diagram.
- A volunteer fix-report flow that uses a model tool call but keeps a human admin in the loop.
- Email/password sign-in with per-church data isolation, plus a fictional demo church that resets every night.
- The marketing homepage and an app preview video.

The early project notes record that the first version shipped with a simple Admin view switch and no user accounts "as requested", which reflects building to the stated needs of the people using it; accounts were added later when the app moved toward serving more than one church.

## Features
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"features","technologies":["React Flow","OpenAI Responses API","unpdf"]} -->
V1 ProdBot's user-facing features, in plain language:

- Ask: a chat that streams answers grounded in the campus's approved documents, with a collapsible "Thinking" block showing the model's reasoning summary and a "worked for N seconds" timer. Chats are kept per campus and shared with the campus team, and can be renamed or deleted from the sidebar.
- Explore: the campus wiring diagram with device search, show/hide by group (audio, video, stage and so on), fullscreen, PNG export, hover details, and double-click into a device to see its internal wiring, like opening a folder.
- Runbook checklist: runbook steps can be checked off per campus and per date.
- Fix reports: when a volunteer says in chat that they resolved a documented pitfall (naming its id, such as P-003), the assistant submits a proposal for admin review instead of changing the docs itself.
- Admin, pitfalls: paste notes or upload TXT/PDF files, generate an AI draft, compare it side by side with the approved version, then approve, discard or edit by hand. A structured editor lists each pitfall as the issue, what is actually wrong and the solution.
- Admin, wiring: a full-screen workspace with the canvas on one side and a chat on the other. Typing "the playback Mac now goes over Dante" redraws the diagram; a form edits a selected device and its inputs and outputs, with cable type, signal, port and channel. Nothing is saved until "Save changes", which writes a revision.
- Admin, more tools: runbook and systems docs, a glossary, a shared links document, "Generate all drafts", ZIP export of approved docs, atomic import, and a confirmed "clear campus" action.
- Accounts and demo: email sign-in, a first-run step to name the church and its campuses, and a "Try the demo" button that opens a fictional church with sample data.

## Architecture
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"architecture","technologies":["React","Vite","Convex","OpenAI Responses API","Convex Auth","Vercel","unpdf","Zod"]} -->
V1 ProdBot is a single-page React app talking to a Convex backend, with all AI calls made server-side from Convex actions.

Client: a Vite-built React 19 and TypeScript app on Vercel. Views (Ask, Explore, Admin), the diagram, the markdown renderer and export code are lazy-loaded so the first load stays small. The client subscribes to Convex queries, so chat messages, drafts and generation status update in real time without polling.

Backend: Convex holds organizations (churches), memberships, campuses, documents, drafts, revisions, sources, conversations, messages, checklists and fix proposals. Each document is unique per campus and kind (wiring, pitfalls, runbook, systems), and shared kinds (links, glossary) have no campus. Every public function checks the signed-in user's church through one access helper before reading or writing.

AI path for chat: sending a message is a mutation that inserts the user message and an empty assistant message marked "streaming", then schedules a background action. That action loads the campus's approved documents, builds a system prompt (the wiring graph is converted to readable text plus the raw YAML), trims history to a budget, and streams from the OpenAI Responses API. Text and reasoning deltas are written back into the assistant message about every 250 ms, which pushes the update to every connected client.

AI path for documents: admin actions gather the campus's extracted sources and current approved content, call the model (structured output via a Zod schema for wiring, plain markdown for the rest), validate the result, and store it as a draft next to the approved content.

Storage and files: uploads go to Convex file storage, and a Node action extracts text from PDFs with unpdf. Pure logic shared by server and client (graph parsing, diffing, layout, document parsers, backups) lives in one shared module with no React or Convex imports, which keeps it easy to unit test.

## Tech stack and why
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"tech-stack","technologies":["React","TypeScript","Vite","Tailwind CSS","shadcn/ui","ElevenLabs UI","React Flow","Streamdown","Convex","Convex Auth","OpenAI Responses API","Zod","YAML","unpdf","Bun","Vercel","html-to-image"]} -->
V1 ProdBot's stack and the reasoning behind each choice:

- Convex (backend, database, file storage, scheduler, cron) instead of a custom Node/Express API plus Postgres and a websocket layer. Convex fits because streaming chat is just a row being patched while clients subscribe to it, so live updates to every viewer come for free. Its scheduler runs the AI call in the background after a send, and its cron runs the nightly demo reset.
- OpenAI Responses API with a reasoning model (configured as GPT-5.6 Luna by default, overridable by environment variable) instead of Chat Completions. The Responses API provides streamed reasoning summaries for the "Thinking" block, function tools for fix proposals, and structured outputs parsed against a Zod schema for wiring graphs. Reasoning effort is configurable separately for chat (medium) and generation (high).
- Long-context grounding instead of a vector database. One campus's documentation is small enough to fit in the prompt, so the app sends the full approved docs every time and enforces a byte budget, rather than adding embeddings and retrieval that could miss a relevant pitfall.
- YAML for the wiring graph and markdown for the other docs, so the content is human-readable, diffable and exportable into a Git repository as a backup.
- React Flow (@xyflow/react) for the diagram instead of a static image or hand-rolled SVG, because it gives panning, zooming, selection and custom nodes; layout positions are computed by Kyle's own deterministic algorithm.
- Vite, React 19, TypeScript, Tailwind CSS 4 and shadcn/ui, with chat components from ElevenLabs UI and Streamdown for streaming markdown.
- Convex Auth for email/password sign-in, which keeps identity inside the same backend as the data.
- Bun for installs, scripts and tests, with convex-test for backend tests; Vercel for the static frontend.

## Grounded streaming chat agent
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"grounded-chat-agent","technologies":["OpenAI Responses API","Convex","streaming","function calling","prompt engineering","React"]} -->
The chat agent in V1 ProdBot is built to give a volunteer a trustworthy answer under time pressure, and most of the design serves grounding and honesty rather than cleverness.

Grounding: instead of retrieval, every request carries the campus's full approved documentation in the system prompt, ordered wiring, pitfalls, runbook, systems, links and glossary. The wiring YAML is also converted into a plain-text description of devices and signal paths so the model can trace a chain. If the campus has no documents yet, the prompt tells the model to say so up front, avoid presenting general knowledge as campus-specific, and point the user to Admin. Drafts are never sent to chat; only approved content is.

Behavior rules in the prompt: symptom-first, numbered short steps for a phone screen, walk the documented signal chain starting closest to the symptom, cite pitfall ids, runbook step numbers and device ids, ask at most one clarifying question, and lead with a pitfall's "last seen" fix when one exists.

Streaming: the background action consumes the Responses API event stream, appending answer text and reasoning-summary deltas to buffers and flushing them into the message row at most every 250 ms. Because the client is subscribed to that row, the answer and the "Thinking" block grow live for everyone in the conversation. Refusals are captured, incomplete responses are surfaced as clear errors, and OpenAI auth, rate-limit and API errors are translated into plain-language messages.

Guardrails on input: messages are capped at 12,000 characters, a second message cannot be sent while an answer is still streaming, history is limited to the latest 60 messages and trimmed to 48,000 characters starting at a complete user turn, and the combined prompt is checked against an 800 KB budget before any call. Responses use store: false, and token usage, including cached tokens, is logged per operation.

## AI draft and review pipeline
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"draft-review-pipeline","technologies":["OpenAI Responses API","structured outputs","Zod","Convex","unpdf","human-in-the-loop"]} -->
V1 ProdBot treats every AI-written or imported document as a draft that a human must approve, and the approval path is defensive against the ways a shared document can go wrong.

Inputs: an admin adds sources by pasting text or uploading TXT or PDF files. PDF text is extracted in a Convex Node action; image-only PDFs produce a readable error asking for pasted text, since OCR is not included. Generation can use all ready sources or a chosen subset, and refuses inputs over 800,000 characters.

Generation: the prompt tells the model to use only facts in the sources or the current document, keep existing ids stable, merge in what the sources add, and output the complete updated document. Wiring comes back as structured output validated against a Zod schema, plus a list of assumptions the model made; the graph is then normalized and validated, and any issues are shown with the draft. Pitfalls and runbook drafts are given the wiring graph so their device references use real ids. "Generate all drafts" runs wiring, pitfalls, runbook and systems in order, so dependent drafts use the new draft wiring without publishing it.

Review: non-wiring drafts appear side by side with the approved version, along with the source titles they came from. Wiring drafts show added, removed and changed devices and connections, and which pitfalls touch the changed devices.

Safety checks on approval:
- A per-document generating lock prevents two generations at once and blocks approve or discard mid-generation.
- Each draft records the approved content it was based on; if that content changed since, approval is refused.
- A pitfalls or runbook draft records the exact wiring it used, and cannot be approved until that wiring is the approved one.
- Invalid wiring cannot be approved, and the previous version is always saved as a revision first, so it can be restored.

## Wiring graph model and diagram
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"wiring-diagram","technologies":["React Flow","TypeScript","Zod","YAML","html-to-image","graph algorithms"]} -->
V1 ProdBot represents each campus's signal flow as a typed graph, and the diagram, the AI prompts and the docs all share that one model.

Data model: devices have a stable snake_case id, label, type, group, optional model, location and notes, and an optional parent id. Connections carry a signal type, a cable (XLR, Cat 6, USB Type A/B/C, or free text, with mono/stereo where relevant), port, channel and notes. The stored YAML stays flat: a device inside a bigger unit, such as a laptop inside a playback rig, just points to its parent, so pitfall references and ids never change when wiring is nested. Shared, framework-free functions parse and validate the YAML, diff two graphs (including cable and note changes), describe a graph in text for the model, and merge AI-generated internal wiring into an existing graph, renaming ids that would clash.

Views: the main diagram shows a device with internal wiring as a single node with an "N inside" badge and collapses connections leaving that group onto it. Double-clicking opens the inside as its own canvas, where outside devices appear as small "from …" and "to …" pills at the edge, and a connection attached to the group itself shows as an unattached pill so an admin can reconnect it to the right inner device.

Layout: Kyle wrote a deterministic layout instead of relying on manual positions. Devices flow left to right in columns, each one a column right of whatever feeds it. Group boxes are sized from their contents and placed near the devices they connect to without overlapping, so adding devices grows a box and pushes neighbors aside rather than drawing over them.

Editing by chat: in the wiring workspace an admin types a description and an action sends the current canvas (including unsaved edits) plus that text to the model, which returns a full updated graph or, when focused on one device, its complete internal wiring. The description is also saved as a wiring note for later document drafts. Nothing persists until Save.

## Engineering decisions and tradeoffs
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"decisions-tradeoffs","technologies":["OpenAI Responses API","Convex","Convex Auth","YAML","function calling"]} -->
Several deliberate tradeoffs shape V1 ProdBot:

- Full-context prompting over RAG. Sending all of a campus's approved docs avoids a retrieval step that could drop the one pitfall that matters, and keeps the system simple. The cost is larger prompts per question, which the app manages with an 800 KB budget, bounded chat history and prompt caching (cached input tokens were observed in testing). The project notes list chunking or summarization as later work if sources outgrow this.
- Human approval for everything the AI writes. No generated or imported content reaches volunteers until an admin approves it, and fix reports from chat are proposals, not edits. This trades speed for trust, which matters when a wrong port number could take down a service.
- Evidence copied by the server, not the model. When the model calls the fix-proposal tool, the server attaches the volunteer's original message verbatim as evidence, checks that it names the pitfall id and that the pitfall exists, so a model paraphrase is never presented as a quote.
- Structured output for wiring, free text for prose. The graph needs to be machine-valid, so it is schema-constrained and validated; runbooks and pitfalls follow a markdown template so they stay readable and editable.
- A flat YAML file with parent pointers instead of nested structures, so internal wiring can be added without changing ids that other documents reference.
- Accounts were left out at first, with Admin as a simple view switch, and added later with Convex Auth, per-church scoping, and a one-time command to move pre-existing data into a church.
- Secrets only on the backend. The OpenAI key lives in Convex environment variables and never in the Vite build.
- Two deploy targets. Convex and Vercel deploy separately, which is documented because a frontend build alone does not ship backend changes.

## Challenges
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"challenges","technologies":["OpenAI Responses API","Convex","unpdf","Bun","Vercel","React Flow"]} -->
V1 ProdBot's code shows a set of real-world problems the system had to handle:

- Model output that is incomplete, refused or invalid. Every call checks that the response completed, detects refusals, and turns token-limit or API failures into messages a volunteer can act on ("Try a smaller request", "Check API billing"). Wiring output that fails schema parsing or graph validation is rejected or flagged rather than saved.
- Concurrent edits to shared documents. Because several admins can work on one campus, the app needed generation locks, base-content checks so a draft cannot overwrite an approval that happened after generation began, and dependency checks between wiring and the documents built on it.
- Trusting volunteer fix reports. The fix flow validates the pitfall id format, requires that the user's own message names it, confirms it exists in the approved pitfalls, ignores duplicates, and saves a revision before changing the "last seen" note.
- Messy source material. PDFs with no extractable text get a clear "scanned PDF? paste the text" error, and oversized inputs are refused with guidance.
- Readable diagrams for growing rigs. Nested devices, collapsed connections, edge pills for signals that cross a group boundary, and a non-overlapping layout all exist because a real campus diagram quickly becomes unreadable.
- Data migration when accounts arrived. Existing documents created before sign-in needed a command to claim them into a church owned by a specific account.
- Deployment friction. A fix commit pinned Bun through an npm launcher on Vercel because the default Bun version there could not read the lockfile.
- A safe public demo. The nightly reset refuses to run if the demo account ever belongs to a real church, and the demo is labeled as fictional.

[NEEDS KYLE: hardest part in your words]

## Quality and operations
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"quality-operations","technologies":["Bun","convex-test","GitHub Actions","TypeScript","Convex Auth","Vercel","Convex"]} -->
V1 ProdBot has more operational care than a typical side project.

Testing: unit tests cover the shared logic (graph parsing, validation and diffing, document parsers, context and history budgets, import validation), and backend tests use convex-test under Bun to exercise revision preservation, stale-draft and dependent-draft approval, generation locking, checklist dates and evidence-backed fix review. The project's verification notes record 18 passing tests with 55 assertions at the first release; the suite has grown since. Development-only smoke scripts exercise PDF and TXT extraction, live model generation and the approval flow against clearly fictional fixtures, and track what they create so cleanup only removes their own data.

CI: a GitHub Actions workflow installs with a pinned Bun version and runs typecheck (frontend and Convex configs), tests and a production build on pushes to main and on pull requests.

Security and access: email/password sign-in via Convex Auth; every church is an organization and every public Convex function checks the caller's membership and that the campus or row belongs to their church. The OpenAI key exists only in Convex environment variables. The demo church is isolated in its own organization.

Cost and performance controls: configurable reasoning effort per task, output caps (8K tokens for chat, 32K for generation), an 800 KB prompt budget, bounded history, store: false on responses, per-operation token usage logging including cached tokens, a client timeout with one retry, and lazy-loaded views to keep the initial bundle down.

Operations and data safety: revisions on every approval, ZIP export of approved docs for Git-based backup, atomic validated imports that land as drafts, and a campus-clearing action that requires typing the campus name. A Convex cron resets the demo church nightly.

## Outcomes and business value
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"outcomes","technologies":[]} -->
V1 ProdBot is designed to create value for a church production team in a few concrete ways:

- Faster recovery during services: a volunteer gets a symptom-first checklist that follows the campus's actual signal chain, instead of searching notes or waiting for the one person who knows the rig.
- Knowledge that outlasts any one volunteer: wiring, pitfalls and fixes are captured as structured, versioned documents, and every resolved issue can be fed back in through a reviewed fix report.
- Low effort to keep docs current: admins paste whatever notes they have, or describe a wiring change in a sentence, and the AI produces a draft in the right format for them to check.
- Trust and control: nothing the AI writes reaches volunteers without approval, every change keeps a revision, and approved docs export as plain files.
- Multi-campus reuse: each campus has its own documentation and chats, with shared links and glossary, and later work made the app usable by other churches through accounts and a public demo.

Result: the head global audio engineer and floor manager who requested ProdBot was very impressed with it and plans to integrate it across V1 Church's campuses nationwide. As of October 2026 that rollout is planned, not done: ProdBot is not yet in use across the campuses, and the production team still has to add each campus's real sources. This is a forward-deployed style engagement: a real stakeholder with an operational problem, a tool built around their workflow, and a path to rollout across a multi-campus organization. The public demo uses fictional sample content so real campus documentation stays private.

## Status and next steps
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"status","technologies":["Vercel","Convex","OpenAI Responses API"]} -->
V1 ProdBot is live: the frontend runs on Vercel with a production Convex backend, and the public site is at prodbot.kyleanthonyhay.com with a "Try the demo" entry into a fictional church that resets every night. The main branch holds the deployed app and the September 2026 workspace redesign; the newer work (email sign-in, per-church data, the pre-filled demo church, a Deep Teal brand, an Admin overview, and the animated homepage with a recorded app preview) sits on a homepage redesign branch dated early October 2026.

Open items recorded in the project notes:
- Manual checks still listed: phone layout on a real device, confirming the diagram PNG download in a normal browser, and having the production team add real campus sources and validate the resulting signal chains.
- Possible later work: OCR for image-only PDFs, chunking or summarization for sources beyond the current size limit, and timer-based streaming flushes if latency from inline writes shows up in measurements.

## Skills demonstrated
<!-- meta: {"type":"project","project":"V1 ProdBot","category":"skills","technologies":["React","TypeScript","Vite","Tailwind CSS","shadcn/ui","React Flow","Convex","Convex Auth","OpenAI Responses API","Zod","YAML","unpdf","Bun","convex-test","GitHub Actions","Vercel"]} -->
V1 ProdBot demonstrates skills across web, AI and forward-deployed engineering.

AI engineering: LLM application development, grounded generation, long-context prompting as an alternative to RAG (retrieval-augmented generation, vector search), prompt engineering and system prompt design, hallucination control, OpenAI Responses API, reasoning models and reasoning effort tuning, streaming responses and streamed reasoning summaries, structured outputs and JSON schema with Zod, function calling and tool use, human-in-the-loop review, AI-assisted document generation, context window and token budgeting, prompt caching, LLM cost control, usage logging, and error handling for model failures and refusals.

Web and full-stack engineering: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, real-time apps, Convex (serverless backend, reactive queries, mutations, actions, scheduler, cron jobs, file storage), authentication and authorization, multi-tenant data isolation, data modeling, document versioning and revision history, optimistic concurrency and stale-write protection, import/export and backups, PDF text extraction, lazy loading and code splitting.

Data visualization and algorithms: interactive node graph diagrams with React Flow, graph data modeling, graph diffing and validation, hierarchical (nested) graphs, and a custom deterministic layout algorithm; PNG export.

Quality and DevOps: unit and backend testing with Bun and convex-test, GitHub Actions CI, typecheck and build gates, Vercel and Convex deployment, environment and secret management, smoke testing with self-cleaning fixtures.

Forward-deployed and product skills: Kyle built V1 ProdBot solo, end to end, for a real organization's nontechnical volunteers, translating how church production teams actually work (Sunday time pressure, phone use, tribal knowledge) into product rules, safe AI workflows an admin can trust, a public demo for stakeholders, and honest documentation of what was and was not verified.
