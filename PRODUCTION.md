# Portfolio production

The website runs on Vercel at https://kyleanthonyhay.com. The Vercel project is
`portfolio-site-2025` in `haykyle917-2548s-projects`, with `my-app` as its root and
files outside the root included. Production follows `main`; release changes
through `misc` → `dev` → `main`.

## Services

- Convex: team `kyle-anthony-hay-64c08`, project `portfolio-site`, production
  `https://loyal-dolphin-679.convex.cloud`. It stores shared recruiter briefs,
  extracted postings, and fit evaluations. Local development continues to use
  `brazen-wildcat-326`.
- Pinecone: the existing index, namespace `knowledge` (111 records at release).
  `backend/` contains seed scripts, not an HTTP service. Railway is unnecessary.
- Resend: sender `Kyle's Agent <agent@kyleanthonyhay.com>`. Contact forms, chat
  notes, and fit notifications go to `kyleanthonyhay@gmail.com`, always with
  `haykyle917@gmail.com` CC'd. Notes set Reply-To to the visitor. Failed sends
  retain a mail-app fallback. Supabase and Formspree are unused.
  Recruiter-brief generation also sends the same PDF as the website download,
  its saved share link, and the chat transcript. A PDF-rendering failure still
  sends the saved brief link with an explicit attachment-failure note.
  Fit notifications use the website's badge, card, and project-link styling.
  Both PDFs share a branded photo header, rounded sections, status pills, and
  the website's colors. The recruiter PDF uses the same renderer for email and
  website downloads; fit PDFs preserve every requirement across page breaks.
  They attach the full assessed report as a PDF and the chat as
  Markdown. If PDF rendering fails, the email still includes the complete report
  and explicitly notes that the PDF could not be generated.
- Scheduling: https://calendly.com/haykyle917/30min.

## Production environment

Vercel needs `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`,
`NEXT_PUBLIC_CONVEX_URL`, `BRIEF_WRITE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`,
`NOTIFY_EMAIL`, `NEXT_PUBLIC_SITE_URL`, and `NEXT_PUBLIC_CALENDLY_URL`.
`PINECONE_KNOWLEDGE_NAMESPACE` is `knowledge`. Store secrets in environment
settings, never in Git. The production write key must also be set as
`BRIEF_WRITE_KEY` on the production Convex deployment.

`NEXT_PUBLIC_*` values are baked into the build. Rebuild after changing them;
overriding only the environment of `next start` does not change the Convex URL.
The normal Vercel build does not deploy Convex. After changes to `my-app/convex`,
run `npx convex deploy` from `my-app` and verify the production deployment.

## Release checks

From `my-app`, run `npm ci`, `npm run typecheck`, and `npm run build`.
Type errors now fail the build. Runtime knowledge, profile facts, PDF fonts and
images, and the résumé are explicitly included through `next.config.js`.
Verify the live custom domain after the main deployment is Ready:

- Ask the agent what YarnScript is built with, then check a real job posting.
- Confirm the notification reaches the configured recipients through Resend.
- Generate a recruiter brief; open its shared URL and download its PDF.
- Open the résumé, play a product demo, and send a chat note.

The October 2026 release updates Next.js and patches the available compatible
dependencies. The remaining production audit findings are in the older
LangChain/LangGraph dependency family (six moderate, one high). Clearing them
requires a separate major-version migration; do not use untrusted serialized
LangChain objects or remote prompt deserialization in this app.
