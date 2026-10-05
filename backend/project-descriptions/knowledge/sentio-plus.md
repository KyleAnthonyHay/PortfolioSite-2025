---
project: Sentio+
slug: sentio-plus
type: project
role: "team: AI engineer and front-end engineer (original version); solo (redesign and Convex rebuild)"
status: live (sentio.kyleanthonyhay.com)
---

# Sentio+

## Overview
<!-- meta: {"type":"project","project":"Sentio+","category":"overview","technologies":["Next.js","React","TypeScript","Convex","Convex Auth","LangGraph","LangChain","OpenAI","FastAPI","ChromaDB","AWS Bedrock","RoBERTa","Python"]} -->
Sentio+ is a customer-intelligence platform that turns large volumes of unstructured customer reviews into answers a product or customer-experience team can act on. Instead of stopping at "positive vs. negative", Sentio+ lets someone ask questions in plain English, such as "what is driving 1-star reviews in Finance apps?", and get an answer grounded in quoted review evidence, next to an analytics dashboard of ratings, trends and complaint themes. The data behind it is a 50,000-review sample of the Google Play Store reviews dataset from Kaggle.

Sentio+ exists in two phases:

- **The original team version (January 7–14, 2026).** Built by a six-person team during the Revature AI Engineering program: a FastAPI backend with LangChain/LangGraph and a ChromaDB retrieval-augmented generation (RAG) pipeline, a Next.js web front end, a Streamlit demo, and a fine-tuned RoBERTa sentiment model. Kyle was the team's AI engineer and a front-end engineer.
- **Kyle's solo redesign (October 2–4, 2026).** Kyle rebuilt the product on his own: a new editorial UI, a full dashboard (analytics, a live customer globe, CSV customer upload, chat), the backend moved from FastAPI to Convex, email/password accounts with Convex Auth, an ETL step that turns the review dataset into Convex seed tables, and a LangGraph agent running inside Convex. This version is live at sentio.kyleanthonyhay.com and published at github.com/KyleAnthonyHay/sentio.

Sentio+ is aimed at Product, CX, Strategy and Leadership teams who need to know why customers feel the way they do and what to fix first. It is a strong example of Kyle taking a team AI prototype and carrying it alone to a deployed, account-based product.

## Problem and users
<!-- meta: {"type":"project","project":"Sentio+","category":"problem","technologies":["RAG","LLM"]} -->
Sentio+ targets a common gap in customer-feedback tooling. Most sentiment dashboards say what customers feel (a star average, a positive/negative split) but not why they feel it, which product aspects drive the ratings, or what a team should fix first. Reading thousands of reviews by hand does not scale, and keyword search misses reviews that describe the same problem in different words.

The intended users are internal teams at a company that collects customer feedback:

- **Product teams** who want the top recurring bugs and UX pain points, ranked by real customer impact.
- **Customer experience (CX) teams** who need the root causes of negative sentiment and how perception shifts over time.
- **Strategy and leadership** who want systemic issues across a product line to inform roadmap and investment decisions.

Sentio+ answers this with two complementary views. A conversational assistant ("Ask Sentio+") retrieves the reviews relevant to a question and writes a concise answer that quotes them as evidence, so every claim can be traced back to a real customer. An analytics dashboard shows the structured signal: review volume, average rating, positive share, rating breakdowns, trends over 30 days, 90 days, 12 months or all time, and counts of complaint themes such as crashes, payments and billing, login and accounts, performance, support and ads, filterable by app or category.

The project positions itself as a consulting-style internal analytics tool rather than a consumer chatbot: the value is converting raw feedback into explainable insights a non-technical stakeholder can trust and act on. That framing, a real business workflow with an AI layer that has to show its evidence, is the same shape of problem a forward deployed engineer solves with a client.

## Kyle's role
<!-- meta: {"type":"project","project":"Sentio+","category":"role","technologies":["Next.js","TypeScript","AWS Bedrock","ChromaDB","Python","pandas","RoBERTa","Convex","Convex Auth","LangGraph"]} -->
Sentio+ had two phases with different ownership.

**Team version (January 2026, six engineers).** Kyle was the AI engineer and a front-end engineer. Based on the git history, his own commits were:

- **The Next.js web app's first version:** the marketing landing page with a dashboard preview, and the demo chat page with multiple saved conversations kept in the browser.
- **A first chat API route** in Next.js that called a model on AWS Bedrock directly, with a scripted demo mode so the page still worked when no AWS credentials were configured.
- **An early ETL and local vector database:** a script that merged the app-info and app-review CSVs and gave each review a stable hashed ID, and a loader that upserted reviews with their metadata (app, category, rating, date, helpful count) into a local ChromaDB collection, with a cosine-distance cutoff so off-topic questions return "no matching reviews" instead of weak matches.
- **Setup documentation** for the web app's environment variables, and suggested prompts rewritten to match the real dataset (finance, health and fitness, food delivery, productivity apps).
- **The fine-tuned RoBERTa sentiment model,** which Kyle and his team fine-tuned together on open-source review data (described in its own section).

Teammates built the FastAPI service, the production RAG service and agent, ChromaDB Cloud support, Docker setup, the Streamlit demo, and the data sampling notebooks, and later pointed Kyle's front end at the FastAPI backend.

**Solo redesign (October 2026).** Kyle alone did everything on the redesign branch: the new UI and homepage, the dashboard pages, the move from FastAPI to Convex, Convex Auth accounts and a seeded demo account, the ETL that builds the dashboard data, the LangGraph agent rewritten as a Convex action, abuse limits, and deployment to his own domain. The commits show he worked with AI coding assistants as collaborators while directing the design and architecture.

## Features
<!-- meta: {"type":"project","project":"Sentio+","category":"features","technologies":["Next.js","Convex","Convex Auth","LangGraph","Framer Motion"]} -->
Sentio+ in its current, redesigned form (live at sentio.kyleanthonyhay.com) offers these user-facing features:

- **Ask Sentio+ chat.** Ask a question about the reviews in plain English. The answer comes back in markdown with short quoted review excerpts, up to four source cards (app, star rating, month), and a collapsible trace of the steps the agent took ("Found 8 reviews for Google Wallet about 'payment failed'"). Conversations are saved in the sidebar.
- **Analytics dashboard.** Stat tiles for review volume, average rating and positive share, compared against the previous period; a trend chart; a 1–5 star breakdown; and complaint-theme counts. Filters cover time range (last 30 days, 90 days, 12 months, all time) and scope (all apps, one category, or one app). Numbers, bars and chart lines animate smoothly when filters change.
- **Live view globe.** A spinning dotted globe that plots customers by location, with a side list to jump to a country.
- **Customers page with CSV upload.** Drop in a CSV of customers; Sentio+ works out a location for each row from the city or country (handling aliases such as "USA", "UK", or "Holland"), places them on the globe, and reports how many rows it skipped. A sample CSV can be downloaded.
- **Accounts.** Email and password sign-up and sign-in. A signed-in user's customer file is saved to their account. A shared demo account comes preloaded with 171 sample customers so the dashboard has data immediately.
- **Sandbox and Production modes.** Sandbox runs entirely from a bundled snapshot of the real review statistics, with prepared answers, so the demo works without a backend; Production uses the live Convex backend and agent. The mode switch lives only in Settings.
- **Marketing site.** A redesigned homepage with an animated hero, scroll-triggered animations (switched off for reduced-motion users), and a pricing page with three plans, a monthly/annual toggle, comparison table and FAQ.

The original team version offered a landing page, a chat demo over the review collection backed by a FastAPI RAG API, and a Streamlit demo with collection stats and API health.

## Architecture
<!-- meta: {"type":"project","project":"Sentio+","category":"architecture","technologies":["Next.js","FastAPI","ChromaDB","AWS Bedrock","OpenAI","LangChain","LangGraph","Convex","Convex Auth","Docker","Python"]} -->
Sentio+ has had two architectures.

**Team version: Next.js to FastAPI to ChromaDB and Bedrock.** The Next.js front end sent questions to a FastAPI service. A RAG service could first ask the LLM which apps a question was about, then run a semantic (vector) search in ChromaDB filtered to those apps, drop results beyond a distance threshold, and have the LLM write an answer from the top matches. A LangChain/LangGraph agent wrapped this with three tools (search reviews, collection stats, list apps) and in-memory conversation memory. The LLM client supported AWS Bedrock (Claude 3 Sonnet by default) or any OpenAI-compatible endpoint, and ChromaDB could run locally, over HTTP, or in Chroma Cloud. Reviews were prepared in Python notebooks and indexed with enriched text headers ("APP | CATEGORY | RATING | DATE"). Docker Compose ran the API, web app and Streamlit demo together.

**Solo redesign: Next.js to Convex.** Kyle removed the separate Python server from the live path. The Next.js 16 / React 19 app talks to Convex, which now holds everything:

- **Data:** tables for reviews, apps, daily and monthly per-app statistics, dataset metadata, chat messages, per-user customer files and uploads, and a daily usage counter, plus Convex Auth's user and session tables.
- **Queries:** an analytics query returns a compact stats snapshot for a chosen time range; review search uses a Convex full-text search index on review text, filterable by app or category.
- **Agent:** a Convex action (Node runtime) builds a LangGraph ReAct agent with an OpenAI chat model and three tools that call internal Convex queries. Conversation history is stored in Convex and the last 12 messages are passed to the model.
- **Auth:** Convex Auth with the password provider, served through Convex HTTP routes.

An offline Python ETL script converts the 50,000-review CSV into Convex seed tables plus a static JSON snapshot bundled with the web app for Sandbox mode. The FastAPI code is still in the repository but is not used by the deployed site.

## Tech stack and why
<!-- meta: {"type":"project","project":"Sentio+","category":"tech-stack","technologies":["Next.js","React","TypeScript","Tailwind CSS","Convex","Convex Auth","LangGraph","LangChain","OpenAI","gpt-4o-mini","Zod","Framer Motion","Torph","FastAPI","ChromaDB","AWS Bedrock","Python","pandas"]} -->
Sentio+'s main technology choices, with the reasoning behind each:

- **Next.js 16, React 19, TypeScript, Tailwind CSS 4.** Kept from the team version. One framework covers the marketing pages and the app-like dashboard, and TypeScript runs end to end with the Convex backend. The alternative would be a separate SPA plus a static site.
- **Convex instead of FastAPI (redesign).** Convex gives a hosted database, typed server functions, real-time React hooks, full-text search indexes, serverless actions and an auth library in one place. For a solo developer that removes a Python server, a separate database and a hosting setup to maintain. The alternatives were keeping FastAPI plus a hosted Postgres, or Firebase/Supabase.
- **Convex Auth (password provider).** Fits naturally once data lives in Convex: sessions and users sit in the same database and server functions read the signed-in user directly. Alternatives would be Clerk, Auth.js or Supabase Auth.
- **LangGraph and LangChain JS with OpenAI (gpt-4o-mini by default, temperature 0.1).** LangGraph's prebuilt ReAct agent handles the tool-calling loop; keeping LangGraph preserved the agent design from the team version while moving it to TypeScript. A small, low-temperature model keeps cost down and answers consistent. The alternative was hand-written tool calling against a single provider SDK.
- **Zod** defines the agent tools' argument schemas so the model gets well-typed tool definitions.
- **Framer Motion and Torph** animate the dashboard and marketing pages.
- **Python and pandas for ETL.** The review data and earlier notebooks were already in Python, so a Python script is the shortest path to build the Convex seed files.
- **Team version: FastAPI, ChromaDB, AWS Bedrock, OpenAI embeddings.** FastAPI suited a Python-heavy AI team; ChromaDB provided vector search with metadata filters and could run locally or in the cloud; Bedrock gave access to Claude and Llama models through the program's AWS setup.
- **RoBERTa (TensorFlow/Keras).** A transformer pretrained on social-media sentiment was a good starting point for informal review text.

## Ask Sentio+ agent on Convex
<!-- meta: {"type":"project","project":"Sentio+","category":"ask-sentio-agent","technologies":["LangGraph","LangChain","OpenAI","Convex","Zod","TypeScript","RAG"]} -->
The Ask Sentio+ assistant is the core AI piece of Kyle's Sentio+ redesign: a LangGraph tool-calling agent that runs as a Convex server action.

**How a question flows.** The browser calls the agent action with a conversation ID and the message. The action validates the input (it must not be empty, must be under 600 characters, and the conversation ID must be a sensible length), then a database mutation stores the user's message, enforces limits, and returns the last 12 messages of history. The action builds a ReAct agent with a system prompt that tells it to call its tools before answering, ground every claim in retrieved reviews, quote short excerpts, and say plainly when the reviews do not cover the question. The agent runs with a recursion limit of 12 steps, and the final answer is saved back to Convex.

**Tools.** The agent has three tools, mirroring the team version's FastAPI agent:

- **search_reviews:** full-text search over review text, optionally limited to one exact app name. Results are de-duplicated (the source data contains repeated reviews) and capped, and review text is trimmed before it reaches the model.
- **get_collection_stats:** total reviews, number of apps, categories and the newest review date.
- **list_available_apps:** every app with its category and review count, so the agent can use exact names when filtering.

**Showing its work.** Each tool call records a short human-readable step, and the reviews it found become source labels (app, star rating, month). The UI shows these as a collapsible tool trace and source cards next to the answer, which makes the AI auditable for a business user.

**Degrading gracefully.** If no OpenAI key is configured, the action skips the model and returns the five closest matching reviews as quoted evidence, so the page still shows real data.

Compared with the team version's ChromaDB vector search, the redesign uses Convex's keyword-based full-text search, trading semantic matching for one fewer service to run.

## Fine-tuned RoBERTa sentiment model
<!-- meta: {"type":"project","project":"Sentio+","category":"roberta-sentiment-fine-tuning","technologies":["RoBERTa","Hugging Face Transformers","TensorFlow","Keras","transfer learning","fine-tuning","NLP","sentiment analysis"]} -->
An earlier iteration of Sentio+, before the team moved to frontier LLMs, used a sentiment classifier that Kyle and his team fine-tuned themselves on open-source review data. The model classifies a review as negative, neutral or positive.

**Base model.** Twitter RoBERTa (cardiffnlp/twitter-roberta-base-sentiment-latest), a roughly 124M-parameter RoBERTa model already trained for sentiment on about 58M tweets. It was chosen over DistilBERT or Amazon-review models because tweets share the informal, expressive phrasing of app and product reviews.

**Fine-tuning approach (TensorFlow/Keras):**

- **Partial layer freezing.** The first 6 of 12 encoder layers were frozen so low-level language features from pretraining were kept, and only the upper layers plus the classification head trained. That cut trainable parameters from about 124.6M to 82.1M and reduced the risk of catastrophic forgetting.
- **Gentle optimization.** Adam at a 2e-5 learning rate, halved on validation-loss plateaus (down to a floor of 1e-7), batch size 8, and a maximum sequence length of 128 tokens.
- **Overfitting controls.** Stratified 80/10/10 train/validation/test splits to keep the class balance consistent, early stopping on validation loss with best-weight restoration, and checkpointing whenever validation loss improved.

**Results.** Validation loss was best after epoch 2 (0.331). By epoch 3, training accuracy kept rising while validation loss went up, so early stopping restored the epoch-2 weights. On the held-out test set the model reached 83.9% accuracy (loss 0.342). On a small hand-picked set of eight difficult reviews (mixed sentiment, sarcasm), accuracy rose from 50% for the base model to 62.5% after fine-tuning. Runs were saved in timestamped folders for reproducibility, and inference could compare the base and fine-tuned models and return confidence scores so low-confidence predictions could be flagged for human review.

The fine-tuned model was never wired into the live app. It belonged to an earlier iteration of the product; the team later moved to frontier models (Claude on AWS Bedrock) for reasoning over reviews, and the deployed redesign uses star ratings and theme matching for its sentiment views. The work still shows hands-on model training: choosing a base model, freezing layers, tuning optimization and evaluating against a held-out test set.

## Review analytics pipeline
<!-- meta: {"type":"project","project":"Sentio+","category":"review-analytics-pipeline","technologies":["Python","ETL","Convex","regex","JSON","TypeScript"]} -->
Sentio+'s redesigned dashboard is backed by real review data, not mock numbers, thanks to an ETL pipeline Kyle wrote to replace the made-up figures in the earlier demo.

**Extract and clean.** A Python script reads the processed 50,000-review CSV, strips the enrichment header the RAG pipeline had added so only the customer's own words remain, and skips rows with an invalid rating or date.

**Aggregate.** For every review it updates two buckets, one for that day and app and one for that month and app, holding counts of 1- to 5-star reviews, total helpful votes, and complaint-theme counts. Themes are found by matching 1- and 2-star review text against eight regular-expression patterns: crashes and bugs, payments and billing, login and accounts, updates, performance, customer support, ads, and notifications. It also keeps the three most helpful negative quotes of reasonable length per app.

**Two outputs from one pass:**

- A compact JSON snapshot bundled with the web app for Sandbox mode, keeping 180 days of daily rows (enough for the 90-day view plus its comparison period) and all monthly rows. Each stats row is a small array (period, app index, five rating counts, helpful votes, theme counts) to keep the file small.
- JSONL seed files for the Convex tables (reviews, apps, daily stats, monthly stats, dataset metadata), loaded with the Convex import command.

**Querying.** The Convex analytics query returns the same compact layout for a requested range. For 30- or 90-day views it returns twice the window so the page can compare against the previous period; longer ranges use monthly rows. A shared TypeScript module turns those rows into stat tiles, trends, rating breakdowns and theme rankings for any app or category filter, so Sandbox and Production render through identical code.

## Engineering decisions and tradeoffs
<!-- meta: {"type":"project","project":"Sentio+","category":"decisions-tradeoffs","technologies":["Convex","FastAPI","ChromaDB","LangGraph","Next.js","react-three-fiber","Three.js"]} -->
Sentio+'s redesign involved several deliberate tradeoffs:

- **Convex over the FastAPI stack.** Moving the backend into Convex let one developer run data, search, auth and the agent without a Python server, a separate vector database or container hosting. The cost is that the existing FastAPI RAG code stays in the repo unused, and the agent had to be rewritten in TypeScript.
- **Full-text search over vector search.** The live agent searches reviews with a Convex full-text index instead of ChromaDB embeddings. That removes an embeddings service and per-query embedding cost, at the price of keyword matching rather than semantic similarity. The agent partly compensates by choosing its own search phrases and app filters, and can search several times.
- **Pre-aggregated statistics instead of querying 50,000 reviews live.** Rolling reviews up into daily and monthly per-app buckets at ETL time makes dashboard queries small and fast, and lets the same data ship as a static file. The tradeoff is that themes are fixed regex categories decided at build time rather than discovered by a model.
- **Sandbox and Production modes.** A bundled snapshot means anyone can explore the product with no backend, sign-in or API cost, while Production shows the real agent. Both modes share one analytics module so they cannot drift apart.
- **Retrieval-only fallback.** Without a model key the agent still returns real matching reviews, so a missing secret degrades the experience instead of breaking it.
- **Shared demo account.** A seeded account with sample customers lets a visitor see a full dashboard in one click, while new accounts get their own private customer data.
- **Reverting a 3D globe.** Kyle rebuilt the live-view globe in Three.js with react-three-fiber, then reverted to the lighter 2D canvas globe, choosing simplicity and load weight over visual flourish.
- **Customer data per account, with a cap.** Each upload replaces the user's previous file and is limited to 2,000 customers, keeping storage and rendering bounded.

## Challenges
<!-- meta: {"type":"project","project":"Sentio+","category":"challenges","technologies":["Convex","LangGraph","Python","ChromaDB","AWS Bedrock","TypeScript"]} -->
Sentio+ had to handle a number of practical problems, visible in the code and commit history:

- **A public AI endpoint with real cost.** The chat agent is reachable by anyone on the live site, so the backend caps each conversation at 60 messages, limits questions to 600 characters, and stops model calls after 300 per day across the whole demo, with clear messages when a limit is hit.
- **Messy source data.** The review dataset contains duplicated reviews, so search results are de-duplicated by text before reaching the model. The processed CSV stored reviews with an enrichment header, which the ETL strips so the dashboard and agent quote only the customer's words. Invalid ratings and dates are skipped.
- **Missing configuration.** Both versions keep working without credentials: Kyle's original Next.js chat route fell back to a scripted demo when AWS keys were absent, and the redesigned agent falls back to plain retrieval without an OpenAI key. The web app also runs in Sandbox mode when it is built without a Convex deployment.
- **Weak matches.** In the team version, Kyle's ChromaDB loader applied a cosine-distance cutoff so an unrelated question returned "no records match" rather than irrelevant reviews.
- **Turning messy customer CSVs into map points.** The customer upload resolves free-text cities and countries against built-in tables, country aliases and extra small territories missing from the map data, and reports how many rows it could not place.
- **Model output quirks.** The original Bedrock route had to strip leaked prompt markers from the model's raw output.
- **Overfitting during fine-tuning.** The RoBERTa model began overfitting by its third epoch, handled by early stopping and restoring the best weights.
- **Robust browser storage.** Saved chats and settings in local storage are wrapped so a full or blocked storage does not break the page.

[NEEDS KYLE: hardest part in your words]

## Quality and operations
<!-- meta: {"type":"project","project":"Sentio+","category":"quality-operations","technologies":["Convex","Convex Auth","Docker","Docker Compose","Next.js","FastAPI"]} -->
Sentio+'s quality and operations practices, as they appear in the code:

- **Authentication and data isolation.** The redesign uses Convex Auth email and password accounts (minimum 8-character passwords). Customer files are stored per user and every read or write checks the signed-in user, so one account cannot see another's customers. Saving while signed out in Production prompts the user to create an account.
- **Server-side validation.** Convex validators type every function argument. Uploaded customer fields are length-trimmed, uploads are capped at 2,000 rows, and the agent action rejects empty, overlong or malformed requests.
- **Cost controls.** A daily usage table limits model calls to 300 per day, conversations are capped at 60 messages, only the last 12 messages are sent to the model, tool results are trimmed before reaching the model, and the agent has a step limit. The default model is the inexpensive gpt-4o-mini.
- **Admin tooling.** Internal-only Convex functions seed or refresh the demo account and fully remove an account along with its sessions, refresh tokens and customer data.
- **Accessibility and performance.** All motion is disabled for users who prefer reduced motion; the globe uses a 2D canvas; the sandbox snapshot is fetched once and cached.
- **Team version operations.** Dockerfiles for the API, web app and Streamlit demo with Docker Compose, structured logging configuration, configurable CORS origins, and error handling for model quota failures.
- **Testing.** Neither version has an automated test suite or CI pipeline in the repository; validation was done through notebooks and manual testing.

The redesigned site is deployed at sentio.kyleanthonyhay.com, hosted on Vercel with a Convex backend.

## Outcomes and business value
<!-- meta: {"type":"project","project":"Sentio+","category":"outcomes","technologies":["RAG","LangGraph","Convex"]} -->
Sentio+ creates value for the teams that own customer feedback by turning tens of thousands of reviews into answers they can act on:

- **Faster root-cause analysis.** A product manager can ask why ratings dropped for a category or app and get an answer that quotes the reviews behind it, instead of reading reviews by hand.
- **Trust through evidence.** Every agent answer shows its sources and the steps it took, so a stakeholder can check a claim before acting on it, which matters when AI output feeds roadmap decisions.
- **Prioritization signal.** Complaint-theme counts, rating breakdowns and period-over-period comparisons show which issues (crashes, billing, login, performance) are growing and where to focus first.
- **Customer context.** Uploading a customer list puts a company's own customers on a map next to the review analytics.
- **Easy evaluation.** Sandbox mode and a one-click demo account let a prospective user or reviewer explore a complete, populated dashboard without setup.

For Kyle's portfolio, Sentio+ shows the full arc from a one-week team AI prototype to a deployed, account-based product he rebuilt and operates alone, with cost limits and graceful fallbacks suitable for a public demo. There are no user, usage or revenue metrics for Sentio+; the pricing page presents illustrative plans rather than paying customers. The model accuracy figures in the RoBERTa section are evaluation results, not business outcomes.

## Status and next steps
<!-- meta: {"type":"project","project":"Sentio+","category":"status","technologies":["Convex","ChromaDB","Next.js"]} -->
Sentio+ is live. The redesigned version is deployed at sentio.kyleanthonyhay.com and its code is at github.com/KyleAnthonyHay/sentio. The most recent work (early October 2026) added a collapsible agent tool trace with a pixel loader, a reworked homepage hero, tighter analytics filters, and a favicon. The original team repository's last commit was January 14, 2026, when the team version was completed in the Revature AI Engineering program.

Natural next steps, suggested by the code and README rather than announced plans:

- **Bring back semantic search.** The redesign's agent uses keyword search; adding vector embeddings (Convex supports vector indexes) would restore the meaning-based retrieval the team version had with ChromaDB.
- **Quantitative evaluation.** The team README lists retrieval precision at K and human-in-the-loop review as future work; neither exists yet.
- **Automated tests and CI** for the Convex functions, the ETL and the analytics math.
- **Model-discovered themes.** Complaint themes are fixed regex categories; an LLM or classifier (such as the fine-tuned RoBERTa model) could find themes and sentiment directly.
- **Retire or reconnect the FastAPI service,** which remains in the repository but is unused by the live site.
- **Bring-your-own reviews.** Customers can upload customer lists but not their own review data yet.

## Skills demonstrated
<!-- meta: {"type":"project","project":"Sentio+","category":"skills","technologies":["Next.js","React","TypeScript","Tailwind CSS","Framer Motion","Convex","Convex Auth","LangGraph","LangChain","OpenAI","Zod","FastAPI","ChromaDB","AWS Bedrock","RoBERTa","TensorFlow","Keras","Python","pandas","Docker"]} -->
Sentio+ demonstrates these skills for Kyle-Anthony Hay:

**AI engineering:** LLM agents, tool calling, function calling, ReAct agents, LangGraph, LangChain (Python and JavaScript), retrieval-augmented generation (RAG), grounded answers with citations, prompt engineering and system prompts, semantic search, vector search, vector databases, embeddings, ChromaDB, similarity thresholds, full-text search, conversation memory, OpenAI API, AWS Bedrock, LLM cost controls and rate limiting, graceful degradation when a model is unavailable, agent observability (tool traces).

**Machine learning and NLP:** fine-tuning transformers, transfer learning, RoBERTa, Hugging Face models, TensorFlow and Keras, sentiment analysis and text classification, layer freezing, learning-rate scheduling, early stopping, stratified splits, model evaluation and overfitting diagnosis.

**Data engineering:** ETL pipelines in Python and pandas, data cleaning and de-duplication, aggregation into time-series rollups, regex-based theme tagging, JSON and JSONL seed generation, database seeding and imports.

**Full-stack web development:** Next.js App Router, React 19, TypeScript, Tailwind CSS, responsive dashboards, data visualization and charts, animation with Framer Motion, accessible reduced-motion design, CSV upload and parsing, geocoding by lookup, canvas rendering, Three.js and react-three-fiber prototyping, marketing site and pricing page design.

**Backend and cloud:** Convex (serverless functions, queries, mutations, actions, indexes, search indexes, schema design), FastAPI REST APIs, authentication and authorization with Convex Auth, per-user data isolation, input validation, environment and secrets management, Docker and Docker Compose, deployment to a custom domain.

**Forward deployed and product relevance:** taking a team prototype to a production deployment alone (end-to-end ownership), migrating an architecture to cut operational burden, designing AI features business users can audit, building demo-ready experiences (sandbox mode, seeded demo account) for stakeholders, and working inside a six-person engineering team on a shared codebase.
