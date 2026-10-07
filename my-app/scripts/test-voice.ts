import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { nextReset, nyDay } from '../convex/voiceDay';
import { clientIp, visitorKey } from '../src/lib/voice/visitor';
import { spokenText } from '../src/lib/voice/live';
import { correctProjectNames } from '../src/lib/voice/names';
import { devUnlimited } from '../src/lib/voice/ledger';
import WebSocket, { WebSocketServer } from 'ws';
import { once } from 'node:events';
import { deliverEvents } from '../src/lib/voice/sideband';
import { TranscriptTimeline } from '../src/lib/voice/transcripts';

test('the allowance day is New York’s and resets at its midnight, across DST', () => {
  const cases: [string, string, string][] = [
    ['2026-10-07T16:00:00Z', '2026-10-07', '2026-10-08T04:00:00.000Z'],
    ['2026-10-08T03:59:59Z', '2026-10-07', '2026-10-08T04:00:00.000Z'],
    ['2026-10-08T04:00:00Z', '2026-10-08', '2026-10-09T04:00:00.000Z'],
    ['2026-11-01T12:00:00Z', '2026-11-01', '2026-11-02T05:00:00.000Z'],
    ['2026-03-08T12:00:00Z', '2026-03-08', '2026-03-09T04:00:00.000Z'],
    ['2026-12-31T23:30:00Z', '2026-12-31', '2027-01-01T05:00:00.000Z'],
  ];
  for (const [at, day, reset] of cases) {
    const t = Date.parse(at);
    assert.equal(nyDay(t), day, at);
    assert.equal(new Date(nextReset(t)).toISOString(), reset, at);
  }
});

const request = (headers: Record<string, string>) => new NextRequest('http://localhost/api/voice', { headers });

test('the visitor is the platform’s client IP, first hop, Vercel’s header first', () => {
  const env = process.env as Record<string, string | undefined>;
  const before = env.NODE_ENV;
  env.NODE_ENV = 'production';
  try {
    assert.equal(clientIp(request({ 'x-vercel-forwarded-for': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' })), '203.0.113.7');
    assert.equal(clientIp(request({ 'x-real-ip': '203.0.113.8', 'x-forwarded-for': '198.51.100.1' })), '203.0.113.8');
    assert.equal(clientIp(request({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' })), '203.0.113.9');
    // The development override does nothing in production.
    assert.equal(clientIp(request({ 'x-voice-test-ip': '1.1.1.1', 'x-forwarded-for': '203.0.113.9' })), '203.0.113.9');
  } finally {
    env.NODE_ENV = before;
  }
});

test('the stored key is a keyed hash, never the address', () => {
  process.env.VOICE_IP_SECRET = 'test-secret-a';
  const a = visitorKey(request({ 'x-forwarded-for': '203.0.113.7' }));
  assert.ok(!a.includes('203'));
  assert.equal(a, visitorKey(request({ 'x-forwarded-for': '203.0.113.7' })));
  assert.notEqual(a, visitorKey(request({ 'x-forwarded-for': '203.0.113.8' })));
  process.env.VOICE_IP_SECRET = 'test-secret-b';
  assert.notEqual(a, visitorKey(request({ 'x-forwarded-for': '203.0.113.7' })));
  delete process.env.VOICE_IP_SECRET;
  assert.throws(() => visitorKey(request({})));
});

test('misheard project names are corrected, ordinary words are not', () => {
  assert.equal(correctProjectNames('What technologies does Ceyl Note use?'), 'What technologies does SelahNote use?');
  assert.equal(correctProjectNames('Tell me about Sela note'), 'Tell me about SelahNote');
  assert.equal(correctProjectNames('Tell me about yarn script.'), 'Tell me about YarnScript.');
  assert.equal(correctProjectNames('what about on tract'), 'what about OnTract');
  assert.equal(correctProjectNames('Has he built sound snag for the Mac?'), 'Has he built SoundSnag for the Mac?');
  assert.equal(correctProjectNames('Does he do contract work?'), 'Does he do contract work?');
  assert.equal(correctProjectNames('Is he a fit for a role that needs Swift and SwiftUI?'), 'Is he a fit for a role that needs Swift and SwiftUI?');
});

test('the development bypass is off in production whatever the env says', () => {
  const env = process.env as Record<string, string | undefined>;
  const before = env.NODE_ENV;
  env.VOICE_DEV_UNLIMITED = '1';
  env.NODE_ENV = 'production';
  assert.equal(devUnlimited(), false);
  env.NODE_ENV = 'development';
  assert.equal(devUnlimited(), true);
  delete env.VOICE_DEV_UNLIMITED;
  assert.equal(devUnlimited(), false);
  env.NODE_ENV = before;
});

test('answers are spoken without Markdown or links', () => {
  assert.equal(spokenText('**SelahNote** is [live](https://apps.apple.com/x).\n- One\n- Two'), 'SelahNote is live. One Two');
});

test('a delegation consumes only transcript fragments at its timeline offset', () => {
  const timeline = new TranscriptTimeline();
  timeline.append('Check the first job.', 100, 500);
  timeline.append(' I will send another.', 1100, 1500);
  assert.equal(timeline.take(600), 'Check the first job.');
  timeline.append('Late old text', 100, 300);
  assert.equal(timeline.take(1600), 'I will send another.');
  assert.equal(timeline.take(1700), '');
});

test('sideband requires the matching append acknowledgment and rejects failures', async (t) => {
  const cases = ['ack', 'error', 'close', 'timeout', 'wrong-ack', 'session-close', 'superseded'] as const;
  for (const mode of cases) {
    await t.test(mode, async () => {
      const server = new WebSocketServer({ port: 0 });
      await once(server, 'listening');
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      let commands = 0;
      server.on('connection', (socket) => socket.on('message', (raw) => {
        commands++;
        const command = JSON.parse(raw.toString());
        if (mode === 'ack') socket.send(JSON.stringify({ type: 'session.commentary.appended', client_event_id: command.event_id }));
        if (mode === 'error') socket.send(JSON.stringify({ type: 'error', client_event_id: command.event_id, error: { message: 'Rejected command' } }));
        if (mode === 'wrong-ack') socket.send(JSON.stringify({ type: 'session.thinking.appended', client_event_id: command.event_id }));
        if (mode === 'session-close') socket.send(JSON.stringify({ type: 'session.closed' }));
        if (mode === 'close') socket.close();
      }));
      try {
        const socket = new WebSocket(`ws://127.0.0.1:${address.port}`);
        const result = deliverEvents(socket, [{ type: mode === 'session-close' ? 'session.close' : 'session.commentary.append', content: 'Test', delegation_id: null }], 150, mode === 'superseded' ? async () => false : undefined);
        if (mode === 'ack' || mode === 'session-close' || mode === 'superseded') await result;
        else await assert.rejects(result, mode === 'error' ? /Rejected command/ : mode === 'close' ? /closed before/ : /timed out/);
        if (mode === 'superseded') assert.equal(commands, 0);
      } finally {
        for (const socket of server.clients) socket.terminate();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  }
});
