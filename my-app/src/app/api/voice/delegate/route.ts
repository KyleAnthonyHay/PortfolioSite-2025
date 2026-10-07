import { NextRequest } from 'next/server';
import { POST as submitTask } from '../../tasks/route';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** Keep the existing voice endpoint while routing handoffs into persistent tasks. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  return submitTask(new NextRequest(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify({ ...body, voice: true, requestId: body.requestId ?? body.delegationId }) }));
}
