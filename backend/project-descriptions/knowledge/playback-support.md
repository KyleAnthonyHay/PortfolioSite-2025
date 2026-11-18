---
project: Playback Support Agent
slug: playback-support
---

## Overview and context
<!-- meta: {"category":"overview","technologies":["Vapi","GPT-Live","Next.js","Convex","Pinecone"]} -->
Playback Support Agent is an inbound AI voice support demo for MultiTracks Playback, built for the Regal AI Product Specialist take-home. The caller describes a song-loading or audio-output problem before rehearsal or service and receives short, documented troubleshooting steps. It is a deployed demo, not a Regal employment engagement or an official MultiTracks product. It is not affiliated with MultiTracks.com. No adoption, customer satisfaction, revenue, or support-resolution improvements are established.

The public website is https://playback.kyleanthonyhay.com. A visitor can enter a browser call from the landing page or use the displayed inbound test number. The call interface combines an iPhone-style call screen with an agent activity panel. The project demonstrates voice-agent design, retrieval, function tools, account-aware support, evaluation, and the boundary between a live API and a simulated business action.

Source: the Inbound-Customer-Service-Playback repository README, src/app/page.tsx, src/components/CallScreen.tsx, and docs/conversation-test-plan.md. Development and production configurations differ; a feature verified in development should not be described as verified in the public voice demo.

## Architecture and stack
<!-- meta: {"category":"architecture","technologies":["Next.js 16","React 19","TypeScript","Tailwind CSS 4","Vapi Web SDK","OpenAI GPT-Live","Convex","Web Audio API"]} -->
Playback Support Agent uses Next.js 16, React 19, TypeScript, and Tailwind CSS 4 for the website. The Vapi Web SDK connects browser calls to a GPT-Live voice assistant. A shared definition in src/lib/assistant.ts holds support instructions, model configuration, and tool definitions for the browser and phone paths. Function schemas live in src/lib/vapiTools.ts.

Vapi tool calls reach a server-side Convex HTTP action. Convex dispatches the tools, reads the synthetic demo records, persists simulated callback bookings, and writes call events. Live Convex queries update the browser activity panel as events arrive. Private tool credentials stay on the server. Web Audio API cues indicate connect, mute, hang-up, and the simulated browser transfer.

External services include Apple's public iTunes Lookup API for current Playback app information, a Pinecone manual-retrieval pipeline, and a Planning Center Services integration against a separate fictional demo organization. Planning Center development activation and live read-only verification are documented separately from production. Sources: README architecture, docs/planning-center-integration.md, and docs/dev-integration/README.md.

## Documentation retrieval with Pinecone
<!-- meta: {"category":"retrieval","technologies":["Pinecone","llama-text-embed-v2","RAG","TypeScript"]} -->
Playback Support Agent's search_playback_docs tool combines a bounded help-center snapshot with semantic retrieval over the official Playback User Guide. The repository's manual pipeline downloads the article, creates readable source snapshots and extracted text, builds heading-based chunks, indexes them in Pinecone, and evaluates retrieval against caller questions and expected sections.

The README documents 96 chunks, averaging roughly 630 characters and kept under 1,200. Chunks preserve heading paths, source metadata, and support scope. Only text is embedded through Pinecone integrated llama-text-embed-v2 embeddings. Screenshot references are metadata; image binaries are not embedded. Scope and category tags distinguish supported issues from adjacent or out-of-scope material, so a retrieved manual section does not silently expand the agent's remit.

If Pinecone is not configured, the manual result explicitly reports not-configured while the keyword knowledge snapshot remains available. Development indexing or retrieval evaluation is not proof that the production deployment uses the same index or configuration. Sources: README's Playback User Guide in Pinecone section, scripts/manual/, and src/lib/tools/manual.ts.

## Account-aware tools and personalization
<!-- meta: {"category":"tool-use","technologies":["Convex","function calling","Planning Center Services API","Apple iTunes Lookup API"]} -->
Playback Support Agent separates an account-entitlement failure from a device or download problem. Synthetic organizations contain subscription plans and status, purchased or rented songs, memberships, and permissions. Organization ID is the primary lookup key, with email as a fallback. Tools can distinguish a genuinely expired plan, the wrong organization, missing Team Sharing permission, an expired rental, and a song the organization never purchased. The agent should not prescribe download recovery for content the account cannot access.

The Apple lookup provides current app information. A separate Planning Center demo integration can read a shared service and song list for useful context without accessing a real caller's church. That context does not establish MultiTracks ownership, and optional personalization should not delay documented support or a direct request for a person.

Customer records, entitlement fixtures, team availability, transfers, and callbacks are simulated. A callback is saved only in this demo's Convex database, and no real support team is contacted. Sources: README synthetic accounts and simulation boundaries, src/lib/demo/accounts.ts, src/lib/tools/, and docs/planning-center-integration.md.

## Voice experience and support boundaries
<!-- meta: {"category":"voice-design","technologies":["Vapi","GPT-Live","Web Audio API","Convex"]} -->
Playback Support Agent introduces itself as an AI. Its support scope centers on song loading, audio output, and bounded first-time setup. A request for a human should go directly to the handoff flow. Uncertain or out-of-scope questions use specialist review rather than improvised guidance. Troubleshooting should be conversational, concise, and grounded in what the caller can see or do.

Development work includes turn-taking, truthful holding lines, avoiding repeated acknowledgments, and guarded closing that waits for farewell and speech-completion evidence. The browser can play a local transfer tone, but that is not a real support transfer. Phone behavior differs because provider and transport capabilities differ. Idle nudges and maximum call durations are part of the call lifecycle.

The activity panel labels events as live API, documentation, or simulated so visitors can inspect the agent's actions. Development admission controls reserve provider headroom; those controls should not be claimed as provider-enforced production isolation. Sources: README, docs/call-closing.md, docs/call-admission.md, and src/lib/voicePolicy.ts.

## Evaluation, tradeoffs, and evidence
<!-- meta: {"category":"testing","technologies":["Node.js test runner","TypeScript","Vapi Chat","Convex"]} -->
Playback Support Agent includes unit tests, TypeScript checks, scripted scenarios, and a text conversation harness. The text harness derives reasoning instructions, model settings, and function tools from the voice definition, uses Vapi Chat, and keeps its conversations and tool logs isolated. It checks reasoning, personalization, support scope, and tool selection without starting a voice call or changing the saved voice assistant.

The project explicitly separates text proof-of-concept evidence from voice evidence. Text checks cannot establish audio quality, latency, interruptions, speech recognition, speaker delegation, or call closing. The conversation test plan uses private caller backgrounds and natural openings, with real follow-ups instead of leading hints that reveal the expected fix. Per-call measurements track expected intent, observed outcome, and operational timing; transcript estimates are kept distinct from phone audio timing.

The main engineering tradeoff is a realistic support workflow with inspectable, fictional account and handoff data. It demonstrates integration and evaluation without claiming a real customer deployment or measured business gains. Sources: docs/conversation-test-plan.md, docs/open-ended-test-method.md, docs/call-metrics.md, docs/text-tests/README.md, and AGENTS.md.
