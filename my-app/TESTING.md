# Portfolio testing

Run commands from `my-app` after installing dependencies in both `my-app` and `backend` (the scripts reuse backend's existing tsx/esbuild tooling).

Default local checks make no live AI calls and send no real email:

- `npm run test:fit`: regression tests with mocked model responses; real network is blocked.
- `npm run eval:fit`: read the saved comparison, without loading the model pipeline.
- `npm run preview:emails`: render both existing email templates and PDF attachments from saved AI judgments. Resend requests are captured locally and mocked. Outputs, including JSON suitable for UI fixtures, are in `.data/email-previews/`. Brief prose is fixed layout data, not newly generated AI output.
- `npm run typecheck` and `npm run build`: compiler/build checks.

Explicit live opt-ins:

- `npm run eval:fit -- --live-ai`: paid model-quality/latency/cost comparison. Uses the configured OpenAI and Pinecone keys. Disables LangSmith tracing, Convex persistence and model fallback. No Resend calls. Replays each retrieval response for the second model and saves results in `evals/fit-comparison.json`.
- `npm run preview:emails -- --send-email=fit` (or `brief`): **delivery check only**. Uses saved AI results and sends exactly one selected template through the configured Resend account/recipients; the other template remains mocked. Never use real sends for layout iteration.

The user-provided Resend free-plan budget is 3,000 emails/month and 100/day. Local previews avoid spending that quota. Neither test script changes production sending behavior: `src/lib/email.ts` and the notification delivery paths remain unchanged.

# Model configuration

| Setting | Default | Scope |
| --- | --- | --- |
| `OPENAI_FIT_MODEL` | `gpt-5.6-luna` | Fit evidence judgments |
| `OPENAI_FIT_EXTRACTION_MODEL` | Fit model | Posting requirement extraction |
| `OPENAI_FIT_FALLBACK_MODEL` | unset | Optional fit/extraction fallback; disabled by default |
| `OPENAI_BRIEF_MODEL` | `gpt-5.6-luna` | Brief writing only |
| `OPENAI_VERIFICATION_MODEL` | `gpt-5.6-luna` | Role audit and brief claim verification |
| `OPENAI_TECH_JUDGE_MODEL` | `gpt-5.6-luna` | Named-technology evidence searches outside fit checks |
| `OPENAI_JUDGE_MODEL` | `gpt-5.6-luna` | Other evidence searches |
| `OPENAI_CHAT_MODEL` | `gpt-5.6-luna` | Chat, tool selection, and follow-up suggestions |

The saved comparison is historical evidence for the fit-only migration; the subsequent full migration also moves chat, evidence searches, writing, and verification to Luna.

The legacy `OPENAI_FIT_JUDGE_MODEL` remains a fit-model alias when `OPENAI_FIT_MODEL` is unset. Set `OPENAI_FIT_MODEL=gpt-4.1` to roll fit checks back; optionally pin extraction separately. Brief/verification settings are independent, so changing the writer does not change verification.

Luna uses `reasoning_effort: low` with no temperature or seed; GPT-4.1 retains the previous temperature/seed settings. Existing JSON outputs and quote/evidence validation are preserved. A request/JSON parse failure can use a fallback only when explicitly configured. All production AI operations default to Luna. Follow-up suggestions use a 1,024-token completion budget that includes reasoning. A missing or invalid verdict is unknown, never supported.

Extraction and evaluation caches include model settings and prompt versions. Bump the stage's `PROMPT_VERSIONS` in `fit-models.ts` whenever its prompt or interpretation changes. Evaluations also retain the existing facts/knowledge hash. Unknown, failed and fallback evaluations are not reused as successful primary-model evaluations, including chat-to-brief reuse. Old persistent entries remain stored but no longer match the new keys.

Unknown fit rows retain a conservative `gap` status for backward compatibility with the three-bucket widget, carry `verificationStatus: unknown`, and explicitly say they need review. Overall recommendations cannot advance them as verified matches. Unknown brief claims are withheld and counted separately from checked claims.
