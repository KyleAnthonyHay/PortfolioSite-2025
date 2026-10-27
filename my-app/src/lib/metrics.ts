import { AsyncLocalStorage } from 'node:async_hooks';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

/**
 * Speed and usage numbers for each answer, so Kyle-Anthony can see how the
 * agent performs. Only numbers and tool names are kept, never what visitors wrote.
 */
export interface Meter { modelCalls: number; inputTokens: number; outputTokens: number; pending: Promise<void>[] }
export interface MetricRow {
  kind: 'answer' | 'plan';
  channel: 'typed' | 'voice';
  status: string;
  /** Message accepted by the server until the first words of the answer. */
  waitMs?: number;
  /** Task start until the first words of the answer. */
  firstTextMs?: number;
  totalMs: number;
  tools: { name: string; ms: number }[];
  fitCheck: boolean;
}

const meters = new AsyncLocalStorage<Meter>();

export function withMeter<T>(run: () => Promise<T>): { meter: Meter; result: Promise<T> } {
  const meter: Meter = { modelCalls: 0, inputTokens: 0, outputTokens: 0, pending: [] };
  return { meter, result: meters.run(meter, run) };
}

/** Counts one OpenAI response against the current answer, reading its usage from a copy of the body. */
export function meterResponse(response: Response): void {
  const meter = meters.getStore();
  if (!meter || !response.ok) return;
  meter.modelCalls++;
  meter.pending.push(response.clone().text().then((body) => {
    // Streamed responses end with a usage chunk; plain ones carry usage at the top level.
    const usage = body.match(/"usage"\s*:\s*\{[^{}]*/g)?.at(-1) ?? '';
    meter.inputTokens += Number(usage.match(/"prompt_tokens"\s*:\s*(\d+)/)?.[1] ?? 0);
    meter.outputTokens += Number(usage.match(/"completion_tokens"\s*:\s*(\d+)/)?.[1] ?? 0);
  }).catch(() => {}));
}

let client: ConvexHttpClient | undefined;
/** Never throws: a lost metric must not cost the visitor an answer. */
export async function recordMetric(row: MetricRow, meter?: Meter): Promise<void> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const key = process.env.BRIEF_WRITE_KEY;
  if (!url || !key) return;
  try {
    if (meter) await Promise.race([Promise.all(meter.pending), new Promise((resolve) => setTimeout(resolve, 2000))]);
    client ??= new ConvexHttpClient(url);
    await client.mutation(api.metrics.record, {
      key, ...row,
      modelCalls: meter?.modelCalls ?? 0, inputTokens: meter?.inputTokens ?? 0, outputTokens: meter?.outputTokens ?? 0,
    });
  } catch (error) {
    console.error('metric not recorded:', error instanceof Error ? error.message : 'unknown error');
  }
}
