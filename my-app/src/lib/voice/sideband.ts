import { randomUUID } from 'node:crypto';
import type WebSocket from 'ws';

/** Success requires the documented acknowledgment for every outgoing command. */
export function deliverEvents(socket: WebSocket, events: Record<string, unknown>[], timeoutMs = 6_000, beforeSend?: () => Promise<boolean>): Promise<void> {
  const stamped: (Record<string, unknown> & { event_id: string })[] = events.map((event) => ({ ...event, event_id: `srv-${randomUUID()}` }));
  const pending = new Map(stamped.map((event) => [event.event_id, String(event.type).replace(/\.append$/, '.appended')]));
  const closing = stamped.some((event) => event.type === 'session.close');
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Keep the error listener during shutdown, including a failed handshake.
      try { socket.close(); } catch { socket.terminate(); }
      if (error) reject(error); else resolve();
    };
    const timer = setTimeout(() => finish(new Error('Voice command acknowledgment timed out')), timeoutMs);
    socket.on('open', async () => {
      try {
        // A newer request can arrive while the sideband handshake is in flight.
        if (beforeSend && !await beforeSend()) return finish();
        if (settled) return;
        for (const event of stamped) socket.send(JSON.stringify(event), (error) => { if (error) finish(error); });
      } catch (error) { finish(error instanceof Error ? error : new Error('Voice command validation failed')); }
    });
    socket.on('message', (raw) => {
      let event: { type?: string; client_event_id?: string; error?: { message?: string } };
      try { event = JSON.parse(raw.toString()); } catch { return; }
      if (event.type === 'error' || event.type?.endsWith('.error')) {
        if (!event.client_event_id || pending.has(event.client_event_id)) finish(new Error(event.error?.message ?? 'Voice provider rejected the command'));
        return;
      }
      if (event.type === 'session.closed') {
        if (closing) { for (const [id, type] of pending) if (type === 'session.close') pending.delete(id); }
        else return finish(new Error('Voice session closed before acknowledgment'));
      }
      if (event.client_event_id && pending.get(event.client_event_id) === event.type) pending.delete(event.client_event_id);
      if (pending.size === 0) finish();
    });
    socket.on('unexpected-response', (_request, response) => {
      response.resume();
      // A provider that already removed the session has fulfilled a close command.
      if (closing && stamped.length === 1 && [404, 410].includes(response.statusCode ?? 0)) finish();
      else finish(new Error(`Voice sideband refused (${response.statusCode})`));
    });
    socket.on('error', (error) => finish(error));
    socket.on('close', () => finish(new Error('Voice sideband closed before acknowledgment')));
  });
}
