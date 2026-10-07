# Portfolio production deploy — handoff for Codex

Repo: `~/Documents/CODE/Other/Web/Personal-Portfolio/PortfolioSite-2025` (run commands from here unless a step says `my-app/` or `backend/`).
Site: Next.js in `my-app/` on Vercel. `backend/` is only Pinecone seed scripts (no server).
Branch flow: `misc` → `dev` → `main`. Vercel and Railway deploy production from `main` only.

Rules
- Never print, paste or commit secret values. Show variable names only.
- Do not commit `.DS_Store`, `DESIGN-PROFILE.pdf`, `backend/project-descriptions/yarnscript.txt` or any `.env*`.
- Stop at anything under "Kyle decides" and ask Kyle.

## Current state (checked 2026-10-06)

- `misc` = `origin/misc` = `origin/dev`. `origin/dev` is 57 commits ahead of `origin/main`.
- No `vercel.json`, `convex.json`, Railway config, Procfile or Dockerfile in the repo. `vercel` and `railway` CLIs are not installed; `gh` is.
- Convex project `portfolio-site` (team `kyle-anthony-hay-64c08`): dev deployment `brazen-wildcat-326` only. Dev env has `BRIEF_WRITE_KEY`. Tables: `recruiterBriefs`, `postingExtractions` and `fitEvaluations` (added 2026-10-07: each job posting's extracted rows, and its judged fit keyed by the posting plus a hash of the facts and write-ups, so a posting always gets the same rows and verdict; functions in `convex/postings.ts`, same `BRIEF_WRITE_KEY`).
- Pinecone: one index (`PINECONE_INDEX_NAME`), namespaces `knowledge` = 111 records (matches the 111 chunks the seed script builds today) and `portfolio` = 80 (old, unused by the site).
- `my-app/.env.local` has: `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_NAMESPACE`, `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `BRIEF_WRITE_KEY`, `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT`, plus unused `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Missing locally: `RESEND_API_KEY`, `RESEND_FROM`, `NOTIFY_EMAIL`, `NEXT_PUBLIC_CALENDLY_URL`, `NEXT_PUBLIC_SITE_URL`, `OPENAI_CHAT_MODEL` (all optional except `RESEND_API_KEY` for email).
- `backend/.env` has: `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `OPENAI_API_KEY`.

## Variables the site reads (`my-app/`)

| Variable | Needed in prod | Default / note |
|---|---|---|
| `OPENAI_API_KEY` | yes | read implicitly by `@langchain/openai` |
| `PINECONE_API_KEY` | yes | `src/lib/knowledge.ts` |
| `PINECONE_INDEX_NAME` | yes | same index as local |
| `PINECONE_KNOWLEDGE_NAMESPACE` | no | `knowledge` |
| `NEXT_PUBLIC_CONVEX_URL` | yes | **prod** Convex URL; build-time var |
| `BRIEF_WRITE_KEY` | yes | must equal the Convex prod env value |
| `RESEND_API_KEY` | yes | without it `/api/note` returns 503 and fit-check alerts don't send |
| `RESEND_FROM` | only with a verified domain | `Kyle's Agent <onboarding@resend.dev>` (delivers only to the Resend account's own address) |
| `NOTIFY_EMAIL` | no | `haykyle917@gmail.com` (`profile.email`) |
| `NEXT_PUBLIC_SITE_URL` | no | `https://kyleanthonyhay.com` (used in brief PDF footer/links) |
| `NEXT_PUBLIC_CALENDLY_URL` | Kyle decides | unset = `book_time` has no link |
| `OPENAI_CHAT_MODEL` | no | `gpt-5.6-luna` |
| `OPENAI_FIT_JUDGE_MODEL` / `OPENAI_JUDGE_MODEL` / `OPENAI_BRIEF_MODEL` | no | `gpt-5.6-luna` for all stages |
| `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT` | optional | LangSmith tracing |
| `PORTFOLIO_CONTENT_DIR`, `PORTFOLIO_KNOWLEDGE_DIR` | no | `../backend/project-descriptions[/knowledge]` relative to `my-app` |
| `PINECONE_NAMESPACE` | no | only read by `src/lib/pinecone.ts`, which nothing imports |
| `NEXT_PUBLIC_SUPABASE_*` | no | not read anywhere; do not add to Vercel |

## 1. Convex (production deployment)

1. Confirm the logged-in account: `cd my-app && npx convex dashboard` → browser shows team `kyle-anthony-hay-64c08`, project `portfolio-site`. If wrong, stop and ask Kyle.
2. Create prod and push functions: `cd my-app && npx convex deploy` (answer yes to create production).
   Check: output ends with a `https://<name>.convex.cloud` URL; dashboard → portfolio-site → Production shows tables `recruiterBriefs`, `postingExtractions` and `fitEvaluations`.
3. Generate a prod write key (do not echo it): `openssl rand -hex 32 | pbcopy`
4. Set it on Convex prod: `npx convex env set BRIEF_WRITE_KEY "$(pbpaste)" --prod`
   Check: `npx convex env list --prod | cut -d= -f1` prints `BRIEF_WRITE_KEY`.
5. Check the read path: `npx convex run --prod recruiterBriefs:get '{"publicId":"smoke"}'` → `null`. Postings are keyed reads: `npx convex run --prod postings:get '{"key":"wrong","hash":"smoke"}'` → `Not allowed` error (expected).
6. Keep the prod URL and key for step 3 (Vercel). Note: Vercel's build is plain `next build`; it does not deploy Convex. Re-run `npx convex deploy` whenever `my-app/convex/` changes.

## 2. Resend

1. resend.com → API Keys → Create (Sending access). Copy it.
2. Domain: Kyle decides the DNS host first. Until a domain is verified, leave `RESEND_FROM` unset; mail then only reaches the Resend account's own address, so the Resend account must be the `NOTIFY_EMAIL` address (`haykyle917@gmail.com` by default).
   If verifying: resend.com → Domains → Add `kyleanthonyhay.com` → add the shown DNS records at the DNS host → wait for "Verified". Then `RESEND_FROM="Kyle's Agent <agent@kyleanthonyhay.com>"`.
3. Add `RESEND_API_KEY=` to `my-app/.env.local` too (local dev uses it).
   Check locally: `cd my-app && npm run dev`, then
   `curl -s -X POST localhost:3000/api/note -H 'content-type: application/json' -d '{"name":"Smoke","email":"smoke@example.com","message":"deploy smoke test"}' -w ' %{http_code}\n'` → 200 and an email arrives (503 `not_configured` means the key is missing).

## 3. Vercel env vars (Production)

Dashboard: vercel.com → the portfolio project → Settings → Environment Variables → Environment = Production. (Root Directory should be `my-app`; confirm under Settings → Build and Deployment.)

Add:
1. `OPENAI_API_KEY` (from `my-app/.env.local`, if not already there)
2. `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` (from `my-app/.env.local`)
3. `NEXT_PUBLIC_CONVEX_URL` = prod URL from Convex step 2 (not the dev `brazen-wildcat-326` URL)
4. `BRIEF_WRITE_KEY` = prod key from Convex step 3
5. `RESEND_API_KEY`; `RESEND_FROM` only if the domain is verified; `NOTIFY_EMAIL` only if Kyle picks a non-default address
6. `NEXT_PUBLIC_CALENDLY_URL` once Kyle gives it
7. Optional: `OPENAI_CHAT_MODEL=gpt-5.6-luna`, `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT`

Check: the Production list shows every name above. `NEXT_PUBLIC_*` values are baked in at build time, so a new deploy is needed after any change (step 6 covers it).

## 4. Railway env vars

Finding: nothing in this repo is a Railway service. `backend/package.json` has only `seed`, `seed:knowledge`, `build`, `typecheck` (no `start`), and the site calls no Railway URL.
1. railway.app → open the project → note which service exists, its root directory and start command.
2. If it builds `backend/`: it needs only `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` (and `PINECONE_NAMESPACE` for the old seed). It serves nothing; ask Kyle whether to keep it (see Kyle decides).
3. Check: the service's latest deploy log, to confirm what it actually runs.

## 5. Pinecone (`knowledge` namespace)

The site reads namespace `knowledge` from the same index locally and in prod, and it is already seeded (111 = local chunk count). Re-seed only if `backend/project-descriptions/knowledge/` changes before merge.
1. Check counts:
   `cd backend && node --input-type=module -e 'import "dotenv/config"; import {Pinecone} from "@pinecone-database/pinecone"; const s=await new Pinecone({apiKey:process.env.PINECONE_API_KEY}).index(process.env.PINECONE_INDEX_NAME).describeIndexStats(); console.log(s.namespaces)'`
2. Re-seed if needed: `cd backend && npm run seed:knowledge` (clears and rewrites `knowledge` only).
   Check: prints `Loaded N chunks` and `Upserted N/N`; re-run step 1 and `knowledge.recordCount` = N.

## 6. Merge and deploy

1. Build locally first: `cd my-app && npm ci && npm run build` → no errors. (`next.config.js` sets `ignoreBuildErrors: true`, so also run `npx tsc --noEmit` and report any errors to Kyle rather than fixing them.)
2. `git fetch origin && git checkout dev && git pull origin dev && git merge --ff-only origin/misc` (no-op today; misc = dev).
3. `git checkout main && git pull origin main && git merge --no-ff dev -m "Merge dev: site redesign, agent, recruiter brief"` → `git push -u origin main`.
   Check: `git rev-list --count origin/main..origin/dev` → `0`.
4. Vercel → Deployments: the `main` deploy goes Ready. If it started before step 3 env vars were saved, Redeploy it.
5. Knowledge files at runtime: the site reads `../backend/project-descriptions/knowledge/*.md` and `../backend/project-descriptions/kyle-profile.md` (Kyle's own-account facts: QA work, office, sponsorship, relocation) with `fs` from inside `my-app`. If the profile is missing in prod the site logs a warning and the fit card says "ask him" for office and visa rows. Confirm in Vercel → Settings → Build and Deployment that "Include files outside the root directory" is on, and check smoke test 2. If project details are missing in prod, report to Kyle (the likely fix is `outputFileTracingIncludes` in `my-app/next.config.js`, a code change).
6. `git checkout misc` when done.

## 7. Smoke test (production URL)

1. Home page `/` loads, no console errors.
2. `/chat`: ask "What is YarnScript built with?" → answer cites the project. Then paste a Greenhouse job link and ask "Am I a fit?" style fit check (e.g. "Check Kyle's fit for https://job-boards.greenhouse.io/<company>/jobs/<id>") → fit result renders; with Resend set, a notify email arrives at `NOTIFY_EMAIL`.
3. In chat, ask for a recruiter brief for that role → brief card appears. Open its share link `/brief/<publicId>` in a private window → renders. `/brief/<publicId>/pdf` downloads a PDF. Convex dashboard → Production → `recruiterBriefs` has the row, and `postingExtractions` and `fitEvaluations` each have a row for the posting (company and role filled). To make a posting extract fresh: `npm run postings:forget -- <role or company>` with the prod `NEXT_PUBLIC_CONVEX_URL` and `BRIEF_WRITE_KEY` in the environment.
4. Résumé: header "Resume" link and `/resume` → `/Kyle-Anthony_Resume.pdf` opens/downloads.
5. `/demo` in the chat composer (slash command) → demo of a product plays/opens.
6. `/note` in the chat composer → note card → send → 200 and email arrives (fallback to mail app means `RESEND_API_KEY` is missing).

## Kyle decides

1. Email recruiters see: résumé `kyleanthonyhay@gmail.com` vs site `haykyle917@gmail.com` (site uses `profile.email` in `my-app/src/lib/profile.ts`).
2. Calendly link for `book_time` → `NEXT_PUBLIC_CALENDLY_URL`.
3. YarnScript icon.
4. Green accent colour for the brief.
5. DNS host for the domain (blocks Resend domain verification and `RESEND_FROM`).
6. Railway: keep or remove the service, since `backend/` has no server (step 4).
7. Whether to delete the unused Supabase keys from `my-app/.env.local` and the old Pinecone `portfolio` namespace.

## October 7 Luna release

All portfolio AI operations now default to `gpt-5.6-luna`: chat/tool selection, follow-up suggestions, evidence searches, fit judging, posting extraction, brief writing, and role/claim verification. Production must leave the stage model overrides unset or set them to Luna. The fit fallback is disabled unless explicitly configured. See `my-app/TESTING.md` for the complete setting list. Earlier current-state notes above describe the original setup and may be stale.
