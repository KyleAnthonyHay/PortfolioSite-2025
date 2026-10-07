import { ChatOpenAI } from '@langchain/openai';

export const DEFAULT_AI_MODEL = 'gpt-5.6-luna';
export type ModelStage = 'fit' | 'extraction' | 'brief' | 'verification' | 'chat' | 'evidence' | 'technology';
// Bump the relevant version whenever that stage's prompt or interpretation changes.
export const PROMPT_VERSIONS = { fit: 4, extraction: 2, brief: 1, verification: 2 } as const;

export function stageModel(stage: ModelStage): string {
  const fit = process.env.OPENAI_FIT_MODEL ?? process.env.OPENAI_FIT_JUDGE_MODEL ?? DEFAULT_AI_MODEL;
  return {
    fit,
    extraction: process.env.OPENAI_FIT_EXTRACTION_MODEL ?? fit,
    brief: process.env.OPENAI_BRIEF_MODEL ?? DEFAULT_AI_MODEL,
    verification: process.env.OPENAI_VERIFICATION_MODEL ?? DEFAULT_AI_MODEL,
    chat: process.env.OPENAI_CHAT_MODEL ?? DEFAULT_AI_MODEL,
    evidence: process.env.OPENAI_JUDGE_MODEL ?? DEFAULT_AI_MODEL,
    technology: process.env.OPENAI_TECH_JUDGE_MODEL ?? DEFAULT_AI_MODEL,
  }[stage];
}

export function fitFallbackModel(): string {
  // Other models are opt-in; the production default stays entirely on Luna.
  return process.env.OPENAI_FIT_FALLBACK_MODEL ?? '';
}

export function createStageModel(name: string, temperature = 0, options: { streaming?: boolean; maxTokens?: number } = {}): ChatOpenAI {
  const luna = name === 'gpt-5.6-luna';
  return new ChatOpenAI({
    model: name,
    temperature,
    timeout: 60_000,
    maxRetries: 0,
    streaming: options.streaming,
    maxTokens: luna ? undefined : options.maxTokens,
    configuration: { fetch: (input, init) => globalThis.fetch(input, init) },
    // This installed LangChain version adds temperature even when omitted.
    // Override it at serialization for Luna; seed is for the GPT-4.1 stages only.
    modelKwargs: luna ? { temperature: undefined, reasoning_effort: 'low', max_tokens: undefined, max_completion_tokens: options.maxTokens } : { seed: 7 },
  });
}

/** Fallback results are usable but must not be cached as a primary-model result. */
export let fitFallbacks = 0;
export async function withStageModel<T>(stage: ModelStage, run: (model: ChatOpenAI) => Promise<T>, temperature = 0): Promise<T> {
  const primary = stageModel(stage);
  try {
    return await run(createStageModel(primary, temperature));
  } catch (error) {
    const fallback = fitFallbackModel();
    if ((stage !== 'fit' && stage !== 'extraction') || !fallback || fallback === primary) throw error;
    fitFallbacks++;
    console.warn(`fit check: ${stage} model ${primary} failed; using ${fallback}`);
    return run(createStageModel(fallback, temperature));
  }
}

export function extractionIdentity(): string {
  return JSON.stringify([stageModel('extraction'), PROMPT_VERSIONS.extraction, fitFallbackModel()]);
}

export function evaluationIdentity(): string {
  return JSON.stringify([
    stageModel('fit'), PROMPT_VERSIONS.fit, stageModel('fit') === 'gpt-5.6-luna' ? 'low' : null,
    extractionIdentity(), stageModel('verification'), PROMPT_VERSIONS.verification, fitFallbackModel(),
    // Date-dependent tenure must not reuse yesterday's persisted result across a year boundary.
    new Date().getFullYear(),
  ]);
}
