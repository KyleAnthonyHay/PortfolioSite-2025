---
project: SelahNote
slug: selahnote
type: project
role: solo
status: live (iOS App Store; ongoing releases)
---

# SelahNote

## Overview
<!-- meta: {"type":"project","project":"SelahNote","category":"overview","technologies":["Swift","SwiftUI","SwiftData","Convex","OpenAI","AssemblyAI","Pinecone","Firebase Auth","RevenueCat"]} -->
SelahNote is an AI sermon note-taking app for iPhone that Kyle-Anthony Hay designed, built and ships on his own. It is Kyle's flagship project and has over 400 users (about 40 of them paying subscribers, per Kyle as of October 2026). Kyle wrote the iOS app himself in Swift (SwiftUI and SwiftData), and it has been a production Swift app, live on the App Store, since August 2025. Earlier in development the app was called Lectra, and that name still appears in the codebase.

A listener records a sermon live, uploads an audio file, or pastes a YouTube link. SelahNote transcribes it, writes structured notes, finds the Bible verses the preacher quoted or referenced, and keeps everything synced across devices. Newer versions add a sermon chat assistant that answers questions about a specific message with citations, a voice mode for that assistant, a built-in Bible reader in two translations, note sharing by link or QR code, and a recap feature called Selah Stories.

The app is live on the App Store. Kyle publishes regular updates: App Store Connect showed version 1.4.2 approved in mid-September 2026, and version 1.4.6 was being prepared in early October 2026. The current git history begins in November 2025 with a clean reset at build 1.0.8, so the app was already on the App Store by then, and work has continued every month since. The codebase has about 50,000 lines of Swift in the iOS app, a TypeScript backend on Convex, a Python service on Google Cloud Run, and a release automation pipeline in GitHub Actions.

For recruiters, SelahNote shows one engineer running a real consumer AI product end to end: native iOS development, backend and data design, LLM and retrieval systems, subscriptions and billing, and live operations for paying users.

## Problem and users
<!-- meta: {"type":"project","project":"SelahNote","category":"problem","technologies":[]} -->
SelahNote is built for churchgoers and Bible-study users who want to remember and act on what they heard in a sermon. During a service it is hard to listen, write, and look up every scripture the preacher mentions at the same time. Afterward, a raw transcript is too long to be useful and a generic summary loses the verses, the quotable lines, and the structure of the message.

SelahNote is designed around how sermons actually work. Preachers quote verses, paraphrase them, or tell the congregation to "turn to" a passage. They move between illustrations, teaching points and applications, and they repeat lines for emphasis. The app records the sermon with a live transcript, catches scripture as it is spoken, and turns the transcript into organized notes that keep the preacher's own words where they matter. Later the user can ask the sermon questions such as "what did he say about forgiveness?" or "what did I miss?" and get answers grounded in that message.

The code points to several user groups:
- Church members who record Sunday services and want notes and references without typing.
- People who watch sermons and podcasts on YouTube and want the same notes from a link.
- Bible readers who want to jump from a detected reference into the full chapter, save verses, and highlight them.
- Users who take their own notes during the service and want the AI to build on them, not replace them.

Feature choices like midweek recap notifications, church-service reminders, and speaker (preacher) tagging show the product is shaped around a weekly church routine and not around general meeting transcription.

## Kyle's role
<!-- meta: {"type":"project","project":"SelahNote","category":"role","technologies":["Swift","SwiftUI","Convex","TypeScript","Python","Google Cloud Run","GitHub Actions"]} -->
SelahNote is a solo project. Kyle-Anthony Hay is the only engineer and owns the whole product, from idea to App Store operations. Every commit in the repository is his.

What Kyle owns:
- iOS app: all SwiftUI screens, the SwiftData data model and its schema migrations, audio recording and playback, the live transcription client, the block note editor (a separate Swift package), the Bible reader, onboarding, paywalls, and notifications.
- Backend: the Convex schema, queries, mutations, HTTP endpoints and Node actions for sync, note generation, reference detection, sermon chat, voice sessions, credits, sharing and referrals.
- AI systems: prompt and schema design for note generation, the Pinecone scripture index and detection algorithm, the agent and tools behind sermon chat, the voice assistant's server worker, and evaluation scripts.
- Cloud services: a Python service on Google Cloud Run for YouTube transcripts, secured with Firebase token checks and Secret Manager.
- Business systems: RevenueCat subscriptions with three paid tiers, a server-side credit ledger, voice-minute metering, and a creator referral program with webhook-driven attribution.
- Operations: release versioning, a guarded GitHub Actions workflow that ties backend deploys to App Store approval, production versus development deployments, privacy and consent flows, and cost telemetry.

He also does the product work: deciding which features to build, writing the engineering design docs in the repo, reviewing real sermons to tune detection thresholds, and acting on what users run into, such as transcription errors in book names and recordings lost after reinstalling.

## Features
<!-- meta: {"type":"project","project":"SelahNote","category":"features","technologies":["SwiftUI","AssemblyAI","OpenAI","WebRTC"]} -->
SelahNote's user-facing features, in plain language:

- **Live recording with a real-time transcript.** Words appear as the preacher speaks, with pause, resume, and recovery from phone calls and audio interruptions.
- **Live scripture detection.** Verses that are quoted, referenced, or announced ("turn to John 3") appear on a timestamped reference timeline during the sermon. Each one opens the passage in the in-app Bible.
- **Upload and YouTube import.** Users can add an audio file or paste a YouTube link and get the same transcript, notes and references.
- **AI-generated notes.** A structured outline with headings, explanation, application points, exact memorable quotes, and scripture excerpts. If the listener typed their own notes during the service, the AI keeps them and builds on them.
- **Editable notepad.** The notes open in a block editor (headings, bullets, checklists, quotes, scripture cards) with undo, and users can switch between the AI-enhanced version and their original notes.
- **Sermon chat.** Users can ask questions about one sermon. Answers cite the transcript, detected references, and Bible text, and on YouTube imports a citation can link to the exact moment in the video. Chat also works during a recording, including a "What did I miss?" button.
- **Voice chat.** A spoken conversation with the same sermon assistant, metered in monthly voice minutes.
- **Dictation.** Users can speak a chat question and the app cleans it up before sending.
- **Bible reader.** KJV and World English Bible text bundled offline, with chapter navigation, saved scriptures, color highlights, and a reading-position memory.
- **Sharing.** Notes can be shared by universal link or QR code. The recipient gets their own independent copy.
- **Selah Stories and reminders.** AI-generated recap cards from a sermon, a midweek digest notification, church-service reminders, and a daily verse.
- **Library tools.** Folders, speaker tags, PDF export, and sync across devices.

## Architecture
<!-- meta: {"type":"project","project":"SelahNote","category":"architecture","technologies":["SwiftUI","SwiftData","Convex","AssemblyAI","OpenAI","Pinecone","Firebase Auth","Google Cloud Run","Supadata","RevenueCat","WebRTC"]} -->
SelahNote has four layers: a local-first iOS client, a Convex backend, outside AI providers, and a small Google Cloud service.

**iOS client.** A SwiftUI app with SwiftData as the on-device store. Each sermon is a single record that holds the audio reference, the live and final transcripts, timed transcript segments, the user's notes, the AI note document, and the reference timeline. The app reads and writes SwiftData first so the UI stays fast and works offline. Sync metadata (remote id, sync status, revisions) tracks what still needs uploading.

**Backend.** Convex is the system of record in the cloud. Authenticated HTTP endpoints accept Firebase ID tokens, verify them, and take the user id from the token, never from the request body. Convex also pushes realtime updates to the app through the Convex Swift client. Long-running AI work runs in Convex Node actions that the scheduler starts in the background.

**AI pipeline.**
- During recording, audio streams over a WebSocket to AssemblyAI's streaming speech-to-text. Each finished speech turn is sent to the backend for scripture detection.
- Uploaded audio is transcribed by AssemblyAI's batch API through the backend. YouTube transcripts come from Supadata through the Cloud Run service.
- Scripture detection embeds transcript windows with OpenAI embeddings and searches a Pinecone index of every verse in the World English Bible, alongside a rule-based parser for spoken references.
- Note generation calls an OpenAI model with a strict JSON schema and stores the result as a block document.
- Sermon chat runs the OpenAI Agents SDK in Convex actions, with hybrid keyword and vector search over Convex indexes plus a bundled Bible corpus. Voice chat connects the phone to OpenAI's live voice model over WebRTC, and a server worker hands questions to the same agent.

**Storage.** SwiftData on the device. Convex tables for users, folders, sermons, speakers, chat, credits, voice usage, share links and referrals. Convex file storage for audio. Pinecone for verse vectors. Firestore for the YouTube service's legacy credit counters. RevenueCat for subscription state.

## Tech stack and why
<!-- meta: {"type":"project","project":"SelahNote","category":"tech-stack","technologies":["Swift","SwiftUI","SwiftData","Convex","TypeScript","Firebase Auth","Sign in with Apple","AssemblyAI","OpenAI","OpenAI Agents SDK","Pinecone","RevenueCat","Superwall","WebRTC","Starscream","Python","Google Cloud Run","GitHub Actions","Vitest"]} -->
SelahNote's stack and the reasoning behind each major choice:

- **Swift, SwiftUI and SwiftData (iOS 17.6+).** Native gives the app reliable background audio, AVFoundation recording, and close control over the audio session, all of which matter for an hour-long recording. A cross-platform framework like React Native would make streaming audio and interruption handling harder. SwiftData keeps a local-first store with versioned schema migrations (the code is on schema version 10 or later).
- **Convex (TypeScript) as the backend.** Convex combines a database, realtime subscriptions, HTTP endpoints, scheduled background jobs and vector search in one deployment. That fits a solo developer better than running a separate API server, database, queue and vector store. Transactional mutations also make the credit and voice ledgers safe to implement.
- **Firebase Auth with Sign in with Apple.** Firebase issues JWTs that both Convex (custom JWT provider) and the Cloud Run service can verify, so one identity works across every backend.
- **AssemblyAI.** A streaming WebSocket API with turn detection and a force-endpoint control for live sermons, plus batch transcription and a dictation API, all from one provider.
- **OpenAI.** Structured outputs with strict JSON schema for notes, text-embedding-3-large for verse and transcript embeddings, the Agents SDK for tool-using chat, and the live voice model for voice chat.
- **Pinecone.** Holds roughly 31,000 verse vectors at 3,072 dimensions and supports fetching records by predictable ids. Sermon chat's per-sermon passage search uses Convex's built-in vector index instead, so that data stays next to its ownership checks.
- **RevenueCat and Superwall.** Subscription purchase, entitlements and webhooks without building receipt validation, plus server-side entitlement checks through RevenueCat's REST API.
- **Python on Google Cloud Run.** A small isolated service for YouTube transcripts, with secrets in Google Secret Manager.
- **WebRTC and Starscream.** WebRTC is OpenAI's documented mobile transport for live voice. Starscream and URLSession handle WebSocket streaming.
- **Vitest, node:test and XCTest.** Tests for the backend and the iOS app.

## Live transcription pipeline
<!-- meta: {"type":"project","project":"SelahNote","category":"live-transcription-pipeline","technologies":["AVFoundation","AVAudioEngine","AssemblyAI","WebSocket","Swift","Convex"]} -->
SelahNote's live transcription pipeline turns a phone microphone in a church sanctuary into a growing transcript that the rest of the AI features can use while the sermon is still going.

On the device, the audio engine captures microphone input and converts it in real time to 16 kHz mono 16-bit PCM. The audio streams over a WebSocket to AssemblyAI's streaming speech-to-text (v3 endpoint) using the user's chosen language. At the same time the app records a compressed copy of the audio for playback and cloud storage.

AssemblyAI sends partial and final "turns." Sermons run long without natural pauses, so the app watches partial text and sends a force-endpoint command when a turn gets too long. This keeps finished text flowing to downstream features. A message reducer, which has its own unit tests, merges partial, formatted and end-of-turn messages so the transcript never commits a half-formatted revision. In the UI, the current turn streams in word by word: words already on screen stay still, new words fade in, and the finished text swaps in without animating again.

Each finished turn feeds two systems:
- **Live scripture detection.** The turn, plus recent context, goes to the backend reference detector. Any match is merged into the sermon's reference timeline with a timestamp.
- **Live sermon chat.** While the chat sheet is open, the app syncs transcript changes as small diffs: the offset where the text first changed, the new tail, and changed timed paragraphs. A revision number makes the sync idempotent and lets the server rebuild the transcript at any earlier revision.

The recorder handles phone calls, audio route changes, backgrounding, pause and resume, and a two-hour cap. Stopping a recording saves the audio locally, uploads it, and starts note generation and a full batch reference pass.

## Scripture reference detection
<!-- meta: {"type":"project","project":"SelahNote","category":"scripture-reference-detection","technologies":["Pinecone","OpenAI embeddings","text-embedding-3-large","Convex","TypeScript","vector search","semantic search"]} -->
SelahNote's scripture reference detection finds Bible verses in a sermon transcript and labels each one as a quote, a reference, or a "turn to" instruction. It is a hybrid of rule-based parsing and semantic vector search.

**Index.** Kyle wrote a script that embeds every verse of the World English Bible with OpenAI's text-embedding-3-large and loads them into a Pinecone index under predictable record ids. Exact verses and ranges can then be fetched by id, and paraphrased or quoted text can be found by meaning.

**Explicit references.** A parser handles how references sound when spoken and then transcribed: "first/second" book prefixes, singular slips like "Psalm 91", and common speech-to-text errors such as "Philippines 4:13" for Philippians or "Collations" for Colossians. When a reference is announced, the detector compares the surrounding words to the verse text. A close match is labeled a quote, otherwise "turn to."

**Semantic matches.** Transcript windows are embedded and searched against Pinecone. Scores at or above 0.7 count as quotes and lower accepted scores count as references. A next-verse check reuses the same vector to extend a match into a range, with a slightly lower threshold. Matches within 15 seconds of each other are merged.

**Batch mode.** Uploads, YouTube imports and regenerations go through a batch detector. It cuts the transcript into 24-word windows at an 8-word stride plus sentence-ending windows, embeds up to 64 windows per request, and runs Pinecone searches with at most six at a time. Kyle's September 2026 rewrite was benchmarked on real transcripts against the old version: a 3,420-word sermon went from 100 seconds to 21 seconds (254 embedding requests down to 13) with the same scripture labels. A versioned server-side cache and run ids stop repeated or outdated work.

On the device, a durable job queue with retries and backoff runs batch detection, and partial results appear one by one while the batch is still running.

## Sermon chat agent and voice assistant
<!-- meta: {"type":"project","project":"SelahNote","category":"sermon-chat-agent","technologies":["OpenAI Agents SDK","Convex","RAG","vector search","hybrid search","WebRTC","OpenAI live voice","TypeScript","Swift"]} -->
SelahNote's sermon chat is a retrieval-augmented agent that answers questions about one sermon, with citations a user can tap to check.

**Indexing.** Once notes are generated, a background job splits the transcript into passages of about 300 words with a 35-word overlap, preferring sentence boundaries. Each passage is stored with exact UTF-16 offsets into the original text and embedded with text-embedding-3-large into a Convex vector index. Search combines keyword and vector results with reciprocal-rank fusion. Transcript snapshots are hashed and versioned. When the source changes, the app starts a new conversation and does not quietly answer from stale text.

**Agent and tools.** The OpenAI Agents SDK runs inside Convex Node actions. The model gets tools to search and read the transcript, read the detected references, find scripture together with the sermon context around it, look up timestamps, build YouTube links to an exact moment, and catch up on the last few minutes. User and sermon ids are bound on the server, so the model cannot ask for another user's data. Verse text always comes from a bundled KJV/WEB corpus, never from the model's memory. Every citation id is checked before an answer is saved, and an answer that cites an unknown source fails.

**Streaming.** Answers stream into the message record about every 250 ms and the app polls for them, so a client that disconnects can pick up where it left off. Tool steps appear live as an activity trail. Request ids make retries idempotent, and a watchdog clears runs that get stuck.

**Live chat.** During a recording, each answer is tied to the transcript revision that existed when the question was asked.

**Voice.** The phone connects to OpenAI's live voice model over WebRTC. No API key ever reaches the device. A Convex worker attaches to the session, sends spoken questions to the same agent, speaks the answer only after its citations pass validation, meters connected seconds against a monthly allowance, and hands off to a new worker before Convex's ten-minute action limit.

## Engineering decisions and tradeoffs
<!-- meta: {"type":"project","project":"SelahNote","category":"decisions-tradeoffs","technologies":["SwiftData","Convex","OpenAI","Pinecone","RevenueCat","JSON Schema"]} -->
Key engineering decisions in SelahNote and the tradeoffs behind them:

- **Local-first with cloud sync.** SwiftData is the working copy and Convex is the shared copy. A failed upload never deletes the local draft, and an older remote snapshot is not allowed to overwrite newer local edits. The cost is extra machinery: revision-aware acknowledgements, deletion tombstones that survive reinstalls, and a stated policy for missing versus blank fields.
- **Structured JSON notes, not markdown.** Note generation uses strict JSON schema output with a fixed set of block types. That makes notes renderable, editable and syncable, and it lets the server enforce rules such as allowing scripture blocks only for verses actually quoted in the transcript. Older clients get a simplified copy of the document so they keep working.
- **Faithfulness over polish in prompts.** The note prompt requires quotes to be single continuous excerpts from the transcript, forbids reconstructing verses from memory, and leaves the Bible translation empty unless the speaker named one. The listener's own notes are treated as priority input.
- **Stale-work protection everywhere.** Note generations carry a revision number, and late results from older runs are rejected on both client and server. Reference detection uses run ids and a versioned cache. Chat ties answers to transcript versions.
- **Pinecone for the static Bible, Convex vectors for per-user transcripts.** The large shared corpus lives in a dedicated vector database. Private sermon passages stay inside the backend that enforces ownership.
- **Server-trusted billing for expensive features.** Credits moved from a client-reported counter to a transactional Convex ledger. Voice minutes are checked against RevenueCat's API on the server instead of trusting the app's claim about the user's tier.
- **Thresholds held steady.** When the batch detector was rewritten, Kyle kept the existing acceptance thresholds and did not lower them to recreate old matches, and he wrote down which differences were still unconfirmed.
- **Polling over server-sent events for chat.** Persisted incremental writes with polling are simpler on Convex and survive app suspension. The cost is some extra latency and read traffic, which the docs note.

## Challenges
<!-- meta: {"type":"project","project":"SelahNote","category":"challenges","technologies":["AVFoundation","SwiftData","Convex","AssemblyAI","WebRTC","Swift Concurrency"]} -->
The SelahNote codebase and its history show the hard problems the system had to handle:

- **Long, real-world recordings.** Sermons last an hour or more, in noisy rooms, with phone calls, headphone changes and app backgrounding partway through. Commit history shows repeated work on interruption recovery, keeping recording state across app refreshes, fixing duplicate transcription, and making sure navigating to the Bible mid-recording does not break the recorder.
- **Speech-to-text errors in scripture.** Transcription turns book names into other words ("Philippines" for Philippians). The parser learned these substitutions and spoken patterns, and the gate that decides which captions to check was aligned with the parser so valid mentions are not dropped early.
- **Cross-device sync correctness.** Several commits fix and then roll back sync changes before a July 2026 overhaul of the sync engine. Edge cases included deletes reappearing on other devices, offline edits, reordered responses, and restoring cloud audio after a reinstall.
- **Concurrency and account switching.** An architecture audit with full Swift concurrency checking found races. Examples: a late purchase result from a previous account updating the current one, an old cancellation clearing a newer note generation, and old WebRTC callbacks affecting a new call. Kyle added generation guards and moved ownership to the main actor.
- **Platform limits.** Convex actions stop after ten minutes, so the voice worker hands off to a successor. Chat sources have explicit size caps that fail visibly instead of quietly cutting text.
- **AI cost and latency.** Embedding cost is logged per request, and the batch detector was rebuilt around batching and bounded concurrency.

[NEEDS KYLE: hardest part in your words]

## Quality and operations
<!-- meta: {"type":"project","project":"SelahNote","category":"quality-operations","technologies":["XCTest","Vitest","node:test","GitHub Actions","Convex","Firebase Auth","Google Secret Manager","App Store Connect API","RevenueCat"]} -->
SelahNote has testing, release and security practices that are unusual for a solo app.

**Testing.** The iOS target has about 25 XCTest suites covering live transcript diffs, WebSocket turn handling, library sync and hydration, deletion, note document storage, dictation merging, the Bible packaging, voice session cancellation, and YouTube URL validation. The block editor package has its own tests. The backend has Vitest and node:test suites for reference detection, structured notes, sermon chat, voice metering, subscription plans, referrals and the creator dashboard. A September 2026 audit recorded 119 passing iOS tests, 109 editor package tests, and roughly 130 backend unit tests. Sermon chat also has opt-in live model evaluations and a development smoke test, plus proposed release gates such as at least 90% retrieval success and a p95 response time under 20 seconds.

**Release automation.** A GitHub Actions workflow polls App Store Connect and deploys the matching backend to Convex production only after Apple approves the matching app version. It records each release on a dedicated ledger branch, refuses deploys that do not descend from the last verified backend commit, and runs an authenticated smoke test. It ships disarmed by default and has its own policy tests in CI.

**Environments.** Separate Convex deployments for development and production. Debug-only tools, like a voice-minute grant, are blocked on the server in production.

**Security and privacy.** Every endpoint verifies Firebase tokens and checks ownership. Trusted helpers are internal-only Convex functions. API keys for OpenAI, AssemblyAI and Supadata stay on the server. The YouTube service uses Secret Manager. RevenueCat webhooks check a shared secret. Production logs are scrubbed. The app has an AI-processing consent flow, App Store privacy manifests, and full account-data deletion that also removes chat history.

**Cost controls.** Monthly credits per tier, metered voice minutes with reservations, a cutoff when minutes run out, silence detection that ends idle calls, and cost reports for embeddings and voice.

## Outcomes and business value
<!-- meta: {"type":"project","project":"SelahNote","category":"outcomes","technologies":["RevenueCat","App Store"]} -->
SelahNote is a live consumer product with over 400 users, built and run by one engineer. It is the clearest evidence in Kyle-Anthony Hay's portfolio that he can take an AI product from idea to paying users and keep improving it after launch.

Business value SelahNote creates:
- **For listeners:** time saved and better recall. A sermon becomes an organized, editable set of notes with every referenced verse attached, and the listener can ask follow-up questions instead of rewatching or rereading the whole message.
- **For engagement:** recap cards, midweek digest notifications, church-service reminders and a daily verse bring users back between Sundays. Sharing by link and QR code spreads the app from one churchgoer to another.
- **For the business:** a working monetization model. There are three subscription tiers (Basic, Pro and Pro Plus) through RevenueCat, a credit allowance per tier, metered voice minutes for the most expensive feature, and upgrade paths. A creator referral program pays creators a fixed reward for verified free trials, tracked through RevenueCat webhooks, with an audit log and payout records. Meta and Google ad conversion reporting are wired in for paid acquisition.
- **For operating cost:** usage limits and cost telemetry make the cost of each AI feature visible and keep it within a budget.

Verified results as of October 2026: over 400 users, and a 5.0 average App Store rating across 16 ratings. User feedback is positive. A content creator with over 130,000 followers, quoted on the SelahNote website, praised the app for taking and summarizing sermon notes so they no longer have to worry about writing during the service.

## Status and next steps
<!-- meta: {"type":"project","project":"SelahNote","category":"status","technologies":["App Store","Convex","GitHub Actions"]} -->
SelahNote is live on the App Store and in active development. The repository shows commits nearly every month from November 2025 through October 2026. Version 1.4.2 was approved for distribution in September 2026, and version 1.4.6 (build 2) was being prepared in early October 2026.

Recent work in the repository:
- Sermon chat, live chat during recording, the "What did I miss?" catch-up tool, and voice chat with metered minutes. Live chat during recording and voice chat are live for App Store users as of October 2026.
- Saved scriptures with color highlights, Bible reading-position memory, and a Bible sheet that opens on top of a sermon.
- Sharing transcript timing in shared notes, and an account screen for the display name shown on shares.
- Two starter sermons seeded into new libraries so first-time users see a finished example right away.
- The creator referral program and its payout tooling.

Open items named in the docs:
- Arm the App Store release automation after confirming which backend commit is in production.
- Run a larger labeled accuracy test for scripture detection before claiming better precision or recall.
- Have a human review speaker attribution in chat answers on real sermons.
- Restart a broader architecture-stability pass from a clean baseline.

## Skills demonstrated
<!-- meta: {"type":"project","project":"SelahNote","category":"skills","technologies":["Swift","SwiftUI","SwiftData","AVFoundation","Convex","TypeScript","Python","OpenAI","OpenAI Agents SDK","Pinecone","AssemblyAI","WebRTC","WebSocket","Firebase Auth","RevenueCat","Google Cloud Run","GitHub Actions","XCTest","Vitest"]} -->
Skills SelahNote demonstrates for Kyle-Anthony Hay, grouped by role:

**iOS engineering:** Swift, SwiftUI, SwiftData persistence and schema migrations, MVVM, Swift Concurrency and main-actor isolation, AVFoundation and AVAudioEngine audio capture, real-time audio format conversion, background audio, interruption handling, WebSocket streaming, WebRTC, a custom block-based rich text editor built on UIKit text views, universal links, push and local notifications, StoreKit subscriptions through RevenueCat, Sign in with Apple, accessibility (Dynamic Type, Reduce Motion), Liquid Glass UI, and App Store releases.

**AI and LLM engineering:** retrieval-augmented generation (RAG), semantic search, vector search, embeddings, hybrid search with reciprocal-rank fusion, the Pinecone vector database, OpenAI structured outputs and JSON schema, prompt engineering for faithful summarization, tool-calling agents with the OpenAI Agents SDK, agentic workflows, citation checks that block ungrounded answers, streaming LLM responses, real-time voice AI, speech-to-text and real-time transcription with AssemblyAI, LLM evaluation harnesses and release gates, tracing, and AI cost tracking.

**Backend and web:** TypeScript, Convex (serverless functions, realtime database, scheduler, vector index, file storage), REST and HTTP API design, JWT authentication with Firebase, webhook processing, idempotency, transactional ledgers, Python microservices on Google Cloud Run, Google Secret Manager, and CI/CD with GitHub Actions.

**Product and forward-deployed relevance:** end-to-end ownership of a live product with over 400 users; turning domain knowledge about how sermons are preached and transcribed into concrete algorithms; tuning AI behavior against real user content; subscription pricing and usage metering; referral attribution for creator partners; privacy, consent and data deletion; and design docs that separate what was verified from what was not. These are the habits a forward deployed engineer uses to ship AI into real workflows for real users.
