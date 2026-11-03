---
project: Playback Support Agent
slug: playback-support-agent
type: project
role: solo
status: live public demo (Vercel frontend + Convex production backend + Vapi production assistant); phone number not provisioned yet
---

# Playback Support Agent

## Overview
<!-- meta: {"type":"project","project":"Playback Support Agent","category":"overview","technologies":["Vapi","OpenAI GPT-Live","Next.js","React","TypeScript","Convex","Pinecone","Vercel"]} -->
The Playback Support Agent (Kyle-Anthony sometimes calls it his "multi-track agent" or "MultiTracks agent") is an inbound AI voice support agent that Kyle-Anthony Hay built solo for MultiTracks Playback, the app worship teams use to run click tracks, guide cues and backing tracks during rehearsal and church services. A caller starts a browser call from the landing page (a phone line is planned) and talks to it like a support line. The agent says up front that it is an AI, asks why they are calling, and helps with two kinds of problems: songs that will not load or download, and audio that comes out of the wrong output or not at all.

Every answer is backed by a tool. The agent searches the official help-center articles and the Playback User Guide (embedded in Pinecone), checks Apple's live App Store record for the current Playback version, reads the church's service plan from the Planning Center Services API, looks up a simulated organization's subscription, song library and team permissions, and can book a callback or hand the caller to a person. A side panel shows the live transcript and every tool call as it happens.

Kyle-Anthony built it solo from October 30 to November 3, 2026. It is a demo: it is not affiliated with or used by MultiTracks, customer accounts, transfers and callbacks are simulated, and it has no real callers. The public demo is at playback-support.vercel.app and the code is on GitHub at KyleAnthonyHay/Inbound-Customer-Service-Playback.

## Problem and users
<!-- meta: {"type":"project","project":"Playback Support Agent","category":"problem","technologies":[]} -->
The Playback Support Agent targets a support moment with real time pressure: a worship team's tracks will not load, or the click is coming through the front-of-house speakers, minutes before rehearsal or a Sunday service. The people calling are often volunteers who do not know version numbers or audio-routing vocabulary, so the agent has to ask for things they can actually see on screen, explain technical terms in everyday words, and avoid guessing.

Many of these calls are not bugs at all. A song may not download because the organization never bought it, a rental expired with no credits left, a subscription payment is past due, a team member lacks the Team Sharing permission, or the caller is signed into the wrong organization. The agent is designed to check the account before giving download steps, so it does not walk someone through troubleshooting for a song their church cannot access.

The intended users of a system like this are the caller (a worship leader, music director or production volunteer) and the support team behind it, who want routine calls resolved and the rest handed off with context. In this project the support team, transfers and callbacks are simulated.

## Features
<!-- meta: {"type":"project","project":"Playback Support Agent","category":"features","technologies":["Vapi","OpenAI GPT-Live","Convex","Pinecone","Planning Center Services API","Apple iTunes Lookup API","Web Audio API"]} -->
The Playback Support Agent's main features:

- Real-time voice calls in the browser through the Vapi Web SDK, on an iPhone-style call screen with mute, keypad and synthesized button sounds.
- An honest opening: it introduces itself as an AI, answers "are you a robot?" truthfully every time, and sends "can I just speak to a human?" straight to the handoff flow without troubleshooting first.
- Grounded troubleshooting for song loading and audio output from a source-backed help-center snapshot plus the Playback User Guide in Pinecone.
- A live version check against Apple's App Store record, with the documented changes since the caller's version, so "update the app" is only suggested when it applies.
- Account-aware answers from a fictional organization keyed by Playback's six-digit Organization ID: plan, subscription status, purchased songs, rentals and team permissions, with a diagnosis such as expired, past due, missing Team Sharing or wrong organization.
- A real, read-only Planning Center Services connection to a separate demo organization, so the agent knows which songs are on the upcoming service.
- Callback booking at the exact time the caller asked for, resolved server-side in their time zone, and simulated handoffs with a transfer tone in the browser.
- Idle handling: a check-in after 45 seconds of silence and a spoken goodbye at 75 seconds.
- An agent activity panel with the live transcript and every tool call, each expandable to show its arguments and JSON result and labelled Live API, Docs or Simulated.
- Past calls with transcript, tool trail and per-call measurements, plus archive, restore and confirmed permanent delete.

## Architecture
<!-- meta: {"type":"project","project":"Playback Support Agent","category":"architecture","technologies":["Vapi","OpenAI GPT-Live","Convex","Next.js","Pinecone","Vercel"]} -->
The Playback Support Agent has three parts. The Next.js 16 frontend on Vercel holds the landing page and the call screen. Vapi runs the voice agent. Convex holds the data and the tool backend.

The voice model is OpenAI GPT-Live through Vapi, which runs two models: a speaker that talks to the caller in real time and a reasoner that decides what to do and calls tools. Kyle-Anthony wrote separate prompts for each. The speaker keeps turns short and delegates; the reasoner holds the support policy, calls tools before answering and never claims an action happened unless a tool confirmed it. Both prompts and the tool list live in one assistant definition in code that serves browser and phone calls, and a sync script creates or updates the saved Vapi assistant from it.

When the reasoner calls a tool, Vapi posts to a Convex HTTP action. Convex runs the tool (docs search, live App Store lookup, Planning Center read, account and song-access checks, team availability, callback slots, reservations, handoff), logs it as a call event, and returns JSON. Vapi's server messages (status updates, final transcripts and the end-of-call report) go to a second Convex endpoint, which writes calls and transcripts. The browser subscribes to those tables with live queries, so the activity panel updates as the call happens, including calls that did not start in the browser.

Development and production are separate but identical: two Convex deployments, two Vapi assistants built from the same function, and different tool secrets. A single release command type-checks, runs the tests, deploys Convex, upgrades the fictional accounts without wiping bookings, syncs the production assistant and deploys the site.

## Retrieval and the Playback User Guide in Pinecone
<!-- meta: {"type":"project","project":"Playback Support Agent","category":"rag","technologies":["Pinecone","llama-text-embed-v2","RAG","TypeScript","node-html-parser"]} -->
The Playback Support Agent answers from two knowledge sources returned by one search tool. The first is a keyword-searched snapshot of help-center articles, stored with source URLs and retrieval dates. The second is the official Playback User Guide, embedded in Pinecone for semantic search.

Kyle-Anthony built a four-step pipeline for the guide. A fetch script downloads the article and its images. A build script turns it into a readable, labelled source snapshot, extracted text and chunks. An index script upserts the chunks into a Pinecone integrated index using the llama-text-embed-v2 model, and can prune stale chunk ids for that document without ever deleting the index. An evaluation script runs real caller questions against the index and checks that the expected sections come back.

Chunking follows the document's structure: one chunk per leaf heading, with the title and heading path on every chunk, split only between blocks so numbered steps, lead-ins and notes stay together. That produced 96 chunks averaging about 630 characters, all under 1,200. Only text is embedded; screenshots are referenced by id and mapped in a manifest to their source URL, caption and section.

Each chunk is tagged with a scope (in scope, adjacent, out of scope) and a category, so retrieval can cite the manual without widening what the agent supports. Out-of-scope hits come back only as titles. If Pinecone is not configured, the tool reports that and keeps working on the help-center snapshot alone.

## Voice behavior and conversation design
<!-- meta: {"type":"project","project":"Playback Support Agent","category":"conversation-design","technologies":["Vapi","OpenAI GPT-Live","Web Audio API"]} -->
Much of the work on the Playback Support Agent went into how it sounds on a call, not just what it knows.

- No unexplained silence. The speaker can delegate silently and go straight to useful content; a slow lookup may get one truthful holding line. A voice test script prints a per-turn timing analysis. Runs on November 2, 2026 measured 0.2 to 0.6 seconds of silence after most caller turns (one 1.6 seconds), with a short transition line covering the 1 to 4 seconds until the reasoner's answer.
- No stacked acknowledgments. The reasoner checks the last two things the assistant said and starts with the answer or next question, so the caller does not hear "Got it" twice.
- Guarded closing. A spoken goodbye does not end a Vapi call, so the agent asks if there is anything else, and the server only disconnects after it sees the farewell and evidence that speech finished. A "no" to a troubleshooting question or a declined callback offer is not treated as a goodbye.
- Honest scheduling. The agent may not say "that works" before the tool confirms a slot. If a requested time is unavailable it says why (in the past, weekend, outside hours, taken) before offering the nearest alternatives, and it reads back date, time, zone and number before booking.
- Plain language. It asks for what the caller can see, explains a needed technical term briefly, and does not demand a version or setting the caller cannot find.
- Sounds. Button cues and the transfer tone (two beeps, then US ringback) are synthesized with the Web Audio API; no audio files are used.

## Testing and evaluation
<!-- meta: {"type":"project","project":"Playback Support Agent","category":"quality-operations","technologies":["tsx","TypeScript","Vapi","Convex"]} -->
The Playback Support Agent has an unusually thorough test setup for a five-day project.

- Unit tests (run with tsx) cover the tools, callbacks and time zones, the manual pipeline, the synthetic accounts and their diagnoses, Planning Center, handoff, call admission, guarded closing, acknowledgments, call history, call metrics, evaluation runs and inbound routing. The account tests import the same fictional rows the database seed uses, so the diagnosis logic is tested on the data callers hit.
- A text harness talks to the same reasoner and tools through Vapi Chat, so reasoning and tool use can be checked without spending voice minutes. Scenario files script specific situations, and a curated set of ten caller situations, each with two opening phrasings, uses private caller profiles (what they know, what they can find with help, what they genuinely do not know) rather than a fixed script.
- A voice test script places real calls and reports per-turn latency.
- A 19-row scenario matrix defines intent accuracy and containment, and states that a correct escalation counts as success but not as containment.
- After each call, a versioned Vapi structured output classifies primary and secondary intent, resolution and escalation from the actual dialogue. Reviewers can tag a call with its expected scenario to score intent accuracy; the scenario is never shown to the agent or the classifier.
- A server-side admission guard allows one development call at a time and keeps a Vapi slot free for production.

No measured containment or accuracy figures are recorded yet; the matrix's results section is unfilled.

## Engineering decisions and tradeoffs
<!-- meta: {"type":"project","project":"Playback Support Agent","category":"decisions","technologies":["Vapi","OpenAI GPT-Live","Convex","Pinecone"]} -->
Decisions recorded in the Playback Support Agent's code and docs:

- Tools on Convex, not a separate server. The tool webhook lives on the Convex deployment, which is public as soon as it runs, so real calls could hit tools without tunnelling or a separate deploy.
- Two prompts for two models. Without explicit delegation triggers, GPT-Live's speaker tended to answer on its own and tools never ran, so the speaker prompt is short and lists when to delegate, and the reasoner owns policy.
- Organization ID as the account key. Playback shows a six-digit Organization ID in Settings, and the organization is where content is bought and subscriptions are shared. Six digits are easy to say and transcribe on a call; a spoken email address is not.
- Time zones resolved on the server. The caller's own words ("Monday", "5 PM", "EST") go to the tool, which returns pre-formatted local times; the prompts tell the model never to convert zones itself.
- Stated limits instead of workarounds. Vapi's GPT-Live does not support its built-in knowledge base or query tool, transfers are unsupported on browser calls, and real phone transfers would need SIP the demo does not use. The agent therefore uses its own search tool, plays a local transfer tone in the browser, and speaks the handoff on the phone.
- Simulation is labelled everywhere. Accounts, availability, transfers and callbacks are fictional and marked as such in the data and the activity panel; the Planning Center read is real but points at a separate demo organization.

## Status and next steps
<!-- meta: {"type":"project","project":"Playback Support Agent","category":"status","technologies":["Vercel","Convex","Vapi"]} -->
The Playback Support Agent is live as a public demo at playback-support.vercel.app, with a production Convex backend and a production Vapi assistant. Browser calls work; the inbound phone number shows "not provisioned yet". The newest combined build (structured version checks, Planning Center personalization, the synthetic organization and song-access tools, and updated voice behavior) is on the development backend and development assistant, with production unchanged until release.

Open items in the project notes: claim and route the phone number, fill in the scenario matrix results, and finish the remaining manual voice checks.

[NEEDS KYLE: hardest part in your words]

## Skills demonstrated
<!-- meta: {"type":"project","project":"Playback Support Agent","category":"skills","technologies":["Vapi","OpenAI GPT-Live","Voice AI","Conversational AI","Pinecone","RAG","Convex","Next.js","React","TypeScript","Tailwind CSS","Vercel","Planning Center Services API","Web Audio API"]} -->
The Playback Support Agent demonstrates skills across voice AI, applied AI and product work.

AI engineering: voice AI agents, conversational AI, real-time speech-to-speech models (OpenAI GPT-Live via Vapi), speaker and reasoner prompt design, function calling and tool use, retrieval-augmented generation (RAG), document chunking, embeddings and semantic search with Pinecone integrated inference (llama-text-embed-v2), retrieval evaluation, scope tagging to limit what an agent supports, structured outputs for post-call classification, hallucination control (never claim an action without a tool result), and evaluation design (intent accuracy, containment, latency).

Full-stack engineering: Next.js 16, React 19, TypeScript, Tailwind CSS, Convex (HTTP actions, live queries, schema, seed data, environment variables), webhooks with shared secrets, third-party API integration (Vapi, Apple iTunes Lookup, Planning Center Services), time-zone-correct scheduling, Web Audio API sound design, separate development and production environments, and a one-command release.

Product and customer-facing skills: Kyle-Anthony built it solo, translating a real support workflow (volunteers under time pressure, entitlement problems that look like bugs, honest handoffs) into agent policy, a demo a reviewer can watch step by step, and clear documentation of what is real and what is simulated.
