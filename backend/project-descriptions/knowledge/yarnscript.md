---
project: YarnScript
slug: yarnscript
type: project
role: solo
status: live (public demo at yarn-script.vercel.app, sessions capped at 45 seconds)
---

# YarnScript

## Overview
<!-- meta: {"type":"project","project":"YarnScript","category":"overview","technologies":["Next.js","React","TypeScript","AssemblyAI","OpenAI embeddings","Convex","Vercel"]} -->
YarnScript is an AI teleprompter that follows the speaker's voice instead of scrolling at a fixed speed. Kyle-Anthony Hay built it solo as a four-hour take-home product sprint for the startup Yarn: the git history shows the whole core product landing in one evening on March 18, 2026, from the initial commit at 8:45 PM to the final push just after midnight. In August 2026 he moved the Convex backend to a production deployment and shipped a redesigned landing page, and the app is live at yarn-script.vercel.app.

A user pastes a script (or uploads a .txt file), presses start, and reads aloud. YarnScript streams the microphone to AssemblyAI for live speech-to-text, matches what was said against the script, highlights the words already spoken, and keeps the current line centered on a large-text display of about five words per line. When the speaker skips words, ad-libs, or rephrases, a second matching layer uses OpenAI text embeddings and Convex vector search to work out where in the script they are and jump the display there.

It is for anyone who reads from a teleprompter: creators recording videos, founders filming demos, presenters, and people giving talks. The engineering focus was latency (the upcoming words must always be visible at normal reading speed) and robustness when the speaker leaves the script. Kyle built it end to end: the brief, the real-time audio pipeline, the alignment algorithms, the semantic search backend, the UI, tests, and deployment.

## Problem, users, and Kyle's role
<!-- meta: {"type":"project","project":"YarnScript","category":"problem","technologies":["AssemblyAI","OpenAI embeddings"]} -->
YarnScript addresses a problem with traditional teleprompters: they scroll at a constant pace, so the speaker has to match the machine. If they slow down, pause, or stumble, the text runs away from them. If they speed up, they run out of text. Recovering after a mistake means hunting for the right line while the camera is rolling.

The take-home brief from Yarn set the constraints. The teleprompter had to scroll automatically by transcribing the reader's speech. The text had to be large, with roughly five words per line and at most four lines visible, so very few words are on screen at once and the next words must always be in view. Readers would not be perfect: they might drop words, add phrases that are not in the script, or rephrase whole sections. The solution had to be very low latency and still handle going off script. All of this had to fit in about four hours.

Users are people who read prepared text on camera or on stage: content creators, marketers recording product videos, founders, teachers, and speakers. What they need is a prompter that keeps up with them, so they can focus on delivery rather than pacing.

Kyle built YarnScript entirely on his own. He designed the two-layer tracking approach (fast word alignment plus semantic recovery), wrote the streaming audio and WebSocket client, built the Next.js API routes and Convex schema and functions, designed the interface, wrote the unit tests, and deployed it to Vercel with a production Convex backend. This is a good example of how he works on a product: take a loosely specified, latency-sensitive problem from a real company, scope it to the core loop, and ship something people can use.

## Features
<!-- meta: {"type":"project","project":"YarnScript","category":"features","technologies":["React","Web Audio API"]} -->
YarnScript's user-facing features center on reading a script aloud without losing your place:

- **Script input:** paste a script into a text box or upload a plain-text (.txt) file. A sample script that explains the app is preloaded.
- **Voice-following teleprompter:** after the user presses start, the app prepares the script, requests microphone access, and begins listening. As the reader speaks, the words they have said light up and the active line stays centered in the view.
- **Large, readable layout:** the script is split into lines of five words, matching the brief's limit of about five words per line and four visible lines, so the reader's eyes barely move side to side.
- **Off-script tolerance:** skipped words, filler words like "um" and "uh," ad-libs, and paraphrases do not derail tracking. If the reader jumps ahead, the display follows.
- **Click to reposition:** clicking any word moves the tracking position to that point, so the reader can restart a section or jump ahead by hand.
- **Text size and highlight controls:** small, medium, and large text sizes, and a toggle to turn the spoken-word highlight on or off.
- **Manual scroll with resume:** if the user scrolls the teleprompter themselves, auto-scroll pauses instead of fighting them, and a button returns to the current line and resumes following.
- **Session controls:** stop, rewind to the top for a fresh take, and go back to edit the script.
- **Status and errors:** the app shows when it is preparing the script, connecting, or listening, and shows plain error messages if the microphone, transcription service, or matching fails.
- **Public demo limit:** on the live site, each session is capped at 45 seconds of transcription with a visible countdown. When the time runs out, an overlay explains the limit and links to the source code on GitHub.

## Architecture and tech stack
<!-- meta: {"type":"project","project":"YarnScript","category":"architecture","technologies":["Next.js","React","TypeScript","Web Audio API","WebSockets","AssemblyAI","OpenAI","text-embedding-3-small","Convex","Vercel","CSS Modules"]} -->
YarnScript is a full-stack Next.js 16 app (App Router, React 19, TypeScript) deployed on Vercel, with Convex as its database and vector store.

**Client and audio.** In the browser, a custom React hook owns the session. It captures the microphone with echo cancellation, noise suppression, and auto gain enabled, runs the audio through the Web Audio API, downsamples it to 16 kHz, converts it to 16-bit PCM, and streams the raw frames over a WebSocket directly to AssemblyAI's Universal Streaming API. Streaming the audio straight from the browser avoids routing it through the app server and keeps latency low. AssemblyAI sends back partial and final "turn" messages with word-level finality flags.

**Auth for transcription.** The browser never sees the AssemblyAI API key. A Next.js API route mints a short-lived streaming token (five-minute expiry, 30-minute maximum session) on the server, and the client uses that token to open the WebSocket.

**Script preparation.** When a session starts, a server route normalizes the script, splits it into five-word lines, builds overlapping search documents (sentences plus windows of one to five consecutive lines), embeds them in one batch with OpenAI text-embedding-3-small, and stores them in Convex. The script is hashed with SHA-256 (including the line width and an index version), so a script that has already been prepared is reused without paying for embeddings again.

**Matching.** Word-by-word alignment runs entirely in the browser for speed. When it stalls, the client sends the recent spoken text to a matching route, which embeds it and runs a Convex vector search filtered to that script's ID.

**Why these choices.** AssemblyAI streaming fits because the product depends on sub-second partial transcripts. A batch transcription API such as Whisper uploads would be too slow. Convex fits because one managed backend handles both the document store and the vector index (1536 dimensions with a script ID filter), so no separate vector database like Pinecone is needed for a sprint-sized build. OpenAI's small embedding model is cheap and fast, which suits embedding short phrases repeatedly while someone is talking.

## Hybrid alignment engine: fast word tracking
<!-- meta: {"type":"project","project":"YarnScript","category":"alignment-engine","technologies":["TypeScript","AssemblyAI","React"]} -->
YarnScript's first tracking layer is a deterministic, in-browser alignment algorithm that maps the live transcript onto script word positions. It handles the common case, where the reader is roughly on script, with no network round trip, which is why highlighting can keep up with natural speech.

A transcript manager keeps two views of what has been said. The "stable" transcript contains only words AssemblyAI has marked final, plus completed turns, with duplicate end-of-turn payloads dropped. The "live" transcript also includes the current partial text, so the display can react before words are finalized. Each update re-runs alignment on the last 20 transcript words, starting from the last confirmed script position, and the position can only move forward.

The aligner walks transcript words against a script cursor:

- Text is normalized (lowercase, punctuation and apostrophes stripped), so capitalization and punctuation differences do not matter.
- Filler words ("um," "uh," "erm," "hmm," "ah," "like") are ignored.
- Compound handling matches a script word against two transcript words, or two script words against one, for cases like a brand name that the speech model splits apart or joins together.
- A short lookahead lets the reader skip up to two script words, but only if at least two consecutive words match after the skip. One isolated word that appears later in the script cannot pull the highlight forward. A commit message from the sprint, "Adjusted the look ahead function," tracks this tuning.
- A repeated-word bridge handles scripts with back-to-back duplicate words without jumping backward.

The aligner also returns a confidence score, the share of recent non-filler words that matched. That score, plus a count of how long progress has stalled, decides when to call in the semantic layer. The unit tests cover exact readback, fillers, skips, isolated future words, ad-libs, repeated words, never moving backward, capitalization, and split or joined words.

## Semantic recovery: embeddings and Convex vector search
<!-- meta: {"type":"project","project":"YarnScript","category":"semantic-recovery","technologies":["OpenAI","text-embedding-3-small","Convex","vector search","Next.js"]} -->
YarnScript's second tracking layer finds the speaker's place when word matching fails: when they paraphrase a section, ad-lib at length, or jump ahead past what the lookahead allows. It is retrieval over the script itself, using embeddings, similar to the retrieval step in RAG.

**Indexing.** At preparation time, the script is turned into overlapping search documents: every sentence, plus every window of one to five consecutive lines. Each document points at the line where it ends. Duplicates are removed, everything is embedded in one batched OpenAI call, and the vectors are stored in a Convex table with a vector index filtered by script ID.

**Query.** Semantic recovery runs only when it is likely to help: the word aligner is not advancing, live confidence drops below 0.62 or progress has stalled, and there are at least four spoken words to work with. The client builds a spoken window from the last 28 words, sanitizes it to the last 18 normalized words, and collapses repeated words and phrases that partial transcripts tend to produce. The server embeds that window and runs a Convex vector search scoped to the script.

**Guardrails against bad jumps.** Candidates must be ahead of the current line and within a 36-line forward window, so a repeated phrase earlier in the script cannot drag the prompter backward. Similarity thresholds scale with jump distance: 0.65 for up to 3 lines, 0.72 for up to 10, and 0.80 beyond that, so long jumps need much stronger evidence. On the client, a 1.2-second cooldown after an accepted jump, a transcript fingerprint check, and a check against reusing the same spoken window stop duplicate or stale requests. An accepted match moves the word aligner's anchor to the start of the matched line, so fast word tracking takes over again from the new position.

**Fallbacks.** If Convex is unreachable, the server falls back to an in-memory store with a hand-written cosine similarity search. If no vector match clears the bar, a lexical word-overlap scorer gets a final chance.

## Engineering decisions, tradeoffs, and challenges
<!-- meta: {"type":"project","project":"YarnScript","category":"decisions-tradeoffs","technologies":["AssemblyAI","OpenAI embeddings","Convex","Web Audio API","WebSockets"]} -->
YarnScript's design reflects tradeoffs between latency, accuracy, and cost made under a four-hour limit.

**Two layers instead of one.** Embedding every partial transcript would add a network round trip and an API cost to every word. Kyle made deterministic word alignment the main path and semantic search the recovery path that runs only when alignment stalls or loses confidence. Most of the time tracking is instant and free, and embeddings are paid for only when the reader goes off script.

**Semantic over exact matching for recovery.** Exact string matching breaks as soon as someone rephrases. Embeddings tolerate paraphrase, but they can also produce plausible wrong matches, so the system limits them with forward-only search, a bounded window, and thresholds that rise with jump distance.

**Forward-only progress.** The prompter never moves backward on its own. That prevents jitter when a phrase repeats in the script. The tradeoff is that going back is manual: the reader clicks the word they want or rewinds.

**Direct-to-vendor streaming with server-minted tokens.** Audio goes straight from the browser to AssemblyAI for the lowest latency, while the API key stays on the server.

**Caching by content hash.** Prepared scripts are keyed by a hash of the text, line width, and index version, so repeat sessions skip the embedding cost, and changing the chunking strategy invalidates old indexes cleanly.

**Challenges the system had to handle**, visible in the code and tests: partial transcripts that repeat or revise words (handled by keeping stable and live text separate and collapsing repeats); AssemblyAI splitting or merging brand names; filler words; isolated future words falsely advancing the highlight; duplicate end-of-turn messages; browser audio sample rates that do not match the 16 kHz the stream expects (handled by downsampling in the client); and auto-scroll fighting a user who is scrolling by hand (programmatic scroll events are told apart from user scrolls).

[NEEDS KYLE: hardest part in your words]

## Quality, operations, status, and outcomes
<!-- meta: {"type":"project","project":"YarnScript","category":"quality-operations","technologies":["Vitest","ESLint","TypeScript","Vercel","Convex","AssemblyAI"]} -->
YarnScript has a unit test suite of about 38 Vitest tests across the alignment algorithm, the transcript manager, the semantic matcher rules, and the line and search-document builders. The tests cover off-script behavior directly: filler words, skipped words, ad-libs, repeated words, never moving backward, capitalization, split or joined brand names, distance-based thresholds, rejecting far jumps below threshold, and ignoring backward or out-of-window candidates. The codebase is TypeScript throughout and linted with ESLint. There is no CI pipeline in the repo.

**Security and cost controls.** API keys for AssemblyAI and OpenAI stay on the server. The browser receives only a short-lived AssemblyAI streaming token, valid for five minutes with a 30-minute session cap. API routes validate their inputs and return clear errors when keys are missing. Embedding costs are kept down by batch-embedding the script once, caching prepared scripts by content hash, and calling the embedding API at runtime only when word alignment stalls. On the public demo, each session is capped at 45 seconds of live transcription with a countdown and an overlay that explains the cap, which keeps hosted transcription spending in check.

**Deployment and status.** The app runs on Vercel with a production Convex deployment, which was configured in August 2026 after the original sprint. A refreshed landing page with a personal welcome note from Kyle is live. Debug logging for semantic decisions is still in place, which suggests the matcher was tuned by observing real readbacks. Natural next steps would be adding CI, and supporting languages beyond the English streaming model.

**Outcomes and business value.** YarnScript shows how a teleprompter can adapt to the speaker instead of setting the pace. For creators and presenters, that means fewer retakes, less effort spent keeping pace, and quick recovery after a stumble or ad-lib. For a company like Yarn, it showed a working, low-latency approach to their brief within the time limit.

## Skills demonstrated
<!-- meta: {"type":"project","project":"YarnScript","category":"skills","technologies":["Next.js","React","TypeScript","Web Audio API","WebSockets","AssemblyAI","OpenAI","text-embedding-3-small","Convex","vector search","Vitest","ESLint","Vercel"]} -->
YarnScript demonstrates the following skills, grouped by the kind of role they apply to:

**AI engineering:** applied AI, AI product engineering, real-time speech recognition, streaming speech-to-text (ASR, live transcription) with AssemblyAI Universal Streaming, OpenAI text embeddings (text-embedding-3-small), semantic search, vector search, vector databases (Convex vector index with metadata filtering), similarity thresholds and cosine similarity, retrieval and RAG-style chunking (overlapping sentence and sliding-window documents), hybrid retrieval (deterministic alignment plus semantic recovery plus a lexical fallback), and controlling LLM API costs with caching, batching, and gated calls.

**Web and full-stack engineering:** Next.js 16 App Router, React 19 hooks, TypeScript, Next.js API routes and server-side route handlers, Convex queries, mutations, and actions, WebSockets, Web Audio API audio capture, PCM encoding and downsampling, low-latency real-time UI, smooth scroll animation with requestAnimationFrame, file upload with FileReader, responsive CSS Modules styling, accessibility labels, and Vercel deployment.

**Algorithms and quality:** sequence alignment and fuzzy text matching, text normalization and tokenization, state management for streaming partial and final results, lookahead and skip heuristics, guardrails against false positives, unit testing with Vitest (test-driven edge cases for off-script speech), and ESLint.

**Security:** keeping API keys on the server, ephemeral and short-lived tokens, input validation, and usage limits on a public demo.

**Product and forward-deployed engineering:** turning a real company's open-ended product brief into a working, deployed product within four hours; scoping to the core loop (speak, match, scroll); designing for real user behavior, such as people who stumble, ad-lib, and paraphrase, rather than ideal input; making latency-versus-accuracy-versus-cost tradeoffs; and owning the work end to end from requirements to production as a solo engineer.
