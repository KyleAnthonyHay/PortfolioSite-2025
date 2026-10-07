# Fit-check model comparison — October 7, 2026

Decision: make `gpt-5.6-luna` the default for fit judging and requirement extraction. Retain `gpt-4.1` as the configurable fallback and for role/claim verification and brief writing. No deployment, production data writes, or real email sends were performed.

| Full fit pipeline | GPT-4.1 | GPT-5.6 Luna, low reasoning |
| --- | ---: | ---: |
| Expected judgments passed | 16/16 | 16/16 |
| Mean wall-clock latency | 6.54 s | 6.78 s |
| Measured token cost, five cases | $0.084632 | $0.037693 |
| Input tokens (including cached) | 62,248 | 63,183 |
| Cached input tokens | 36,992 | 36,213 |
| Output tokens (including reasoning) | 1,953 | 2,907 |
| Reasoning tokens | 0 | 1,657 |

Luna's workflow cost was **55.5% lower**, with **3.6% higher** mean latency. The fit-judge stage alone cost $0.006544 versus $0.045464; verification remained GPT-4.1 and accounted for most of Luna's workflow cost.

The gate was fixed before the measured run: every Luna expectation passes, accuracy at least the baseline, no API/retrieval failures, lower token cost, and mean latency no more than 1.25 times the baseline. All conditions passed. Fallback was disabled to avoid attributing GPT-4.1 results to Luna.

Cases cover missing professional tenure and Kubernetes experience; financial analytics versus adjacent app work; on-call infrastructure versus ordinary app development; supported DistilBERT and Swift experience; personal versus teammate attribution; a trained but undeployed model; Claude via Bedrock; degree versus ambiguous graduation eligibility; and posting extraction that must retain mandatory graduation criteria and optional Kubernetes experience. The fixtures allow either gap or related for genuinely adjacent work, but never direct support. Graduation-window uncertainty is deliberately resolved by a deterministic safety rule, so that case tests the pipeline rather than model reasoning alone.

Models ran on the same fixed inputs, with model order alternating by case. Each Pinecone request was retrieved once and replayed byte-for-byte for the other model. The JSON report records the retrieval digest, per-case judgments, per-request returned model, latency, token usage and calculated cost. Verification used the same GPT-4.1 model for both arms. Its actual prompt tokens and cache hits can vary because the fit outputs differ. Application caches and Convex writes were disabled or isolated by model identity; provider prompt-cache hits remained enabled and are included in pricing.

Costs use **actual API-reported token counts**, including cached input and billable reasoning output, multiplied by [OpenAI's published Standard rates](https://developers.openai.com/api/docs/pricing). These are usage-derived costs, not an invoice reconciliation, and exclude Pinecone charges. Luna: $0.20 input/$0.02 cached input/$1.20 output per million tokens; GPT-4.1: $2/$0.50/$8. All measured requests were short-context. Cache-write counts, where returned, use the published write rate.

[Official Luna documentation](https://developers.openai.com/api/docs/models/gpt-5.6-luna) confirms Chat Completions, structured outputs and low reasoning effort. A live compatibility probe and the measured pipeline both passed with the installed LangChain client. The probe (13 input, 11 output tokens) and an initial four-case telemetry pilot are excluded from the table; the pilot's SDK bypassed the original fetch instrumentation, so its token cost was not recorded. The measured run used corrected instrumentation and recorded usage for every model request.

Limitations: one measured pass per case, five cases total, no statistical confidence claim, and warm-provider-cache effects. Brief writing was not migrated or benchmarked. These results support this narrow default change, not a general claim that Luna matches GPT-4.1 across all recruiting tasks.

Changed files:

- `src/lib/fit-models.ts`: stage settings, API parameters, fallback and cache identities.
- `src/lib/tools.ts`: fit-only routing, incomplete verdict handling and graduation eligibility guard.
- `src/lib/recruiter-brief/generate.ts`: independent extraction/writing/verification, versioned caches, fail-closed verification.
- `src/lib/recruiter-brief/verification.ts`: safe verdict parsing and unknown audit rows.
- `src/lib/recruiter-brief/types.ts`, `src/lib/chat-events.ts`, `src/lib/fit-tool.ts`: unknown metadata and safe chat-to-brief reuse.
- `src/lib/fit-report-pdf.tsx`, `src/lib/report-email.ts`, `src/components/chat/widgets/RecruiterBrief.tsx`: needs-review labels.
- `scripts/fixtures/fit-cases.json`, `scripts/evaluate-fit.ts`, `scripts/test-fit.ts`: fixed cases, metered live opt-in, offline regressions.
- `scripts/preview-emails.ts`, `scripts/run-email-preview.mjs`, `package.json`, `TESTING.md`: saved-response layout previews and explicit delivery opt-in.
- `evals/fit-comparison.json`, `evals/fit-comparison.md`: raw measurements and this report.
