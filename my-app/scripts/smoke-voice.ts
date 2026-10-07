/** Paid WebRTC audio capture using the existing key; no Convex writes or email. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:http';
import { createLiveSession, sendToSession } from '../src/lib/voice/live';

async function main() {
  assert.ok(process.argv.includes('--live-ai'), 'Pass --live-ai to authorize paid provider calls');
  const flag = (name: string) => process.argv[process.argv.indexOf(name) + 1];
  const microphone = flag('--microphone-wav');
  const output = flag('--output-dir');
  assert.ok(microphone && output && process.env.PLAYWRIGHT_MODULE, 'Supply --microphone-wav, --output-dir and PLAYWRIGHT_MODULE');
  await fs.mkdir(output, { recursive: true });
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
  const server = createServer((_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>Portfolio voice transport test</title>'); });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${microphone}`, '--autoplay-policy=no-user-gesture-required'] });
  let provider: string | undefined;
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${address.port}`);
    const offer = await page.evaluate(async () => {
      const pc = new RTCPeerConnection();
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const state = { pc, mic, chunks: [] as Blob[], events: [] as unknown[], recorder: undefined as MediaRecorder | undefined, playback: [] as string[] };
      (window as unknown as { test: typeof state }).test = state;
      for (const track of mic.getTracks()) pc.addTrack(track, mic);
      pc.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);
        const audio = new Audio();
        audio.autoplay = true;
        audio.srcObject = stream;
        for (const type of ['playing', 'waiting', 'stalled', 'pause']) audio.addEventListener(type, () => state.playback.push(type));
        void audio.play();
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        state.recorder = recorder;
        recorder.ondataavailable = (event) => state.chunks.push(event.data);
        recorder.start(1000);
      };
      const dc = pc.createDataChannel('oai-events');
      dc.onmessage = (event) => { try { state.events.push(JSON.parse(event.data)); } catch {} };
      await pc.setLocalDescription(await pc.createOffer());
      if (pc.iceGatheringState !== 'complete') await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('ICE gathering timeout')), 10000);
        pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(timer); resolve(); } });
      });
      return pc.localDescription!.sdp;
    });
    const session = await createLiveSession(offer, []);
    provider = session.providerSessionId;
    await page.evaluate(async (sdp: string) => {
      const state = (window as unknown as { test: { pc: RTCPeerConnection; mic: MediaStream } }).test;
      await state.pc.setRemoteDescription({ type: 'answer', sdp });
      // Keep the established media stream but silence the fixture after one utterance.
      setTimeout(() => state.mic.getTracks().forEach((track) => { track.enabled = false; }), 8500);
    }, session.sdp);
    console.log(JSON.stringify({ stage: 'connected', model: process.env.VOICE_LIVE_MODEL ?? 'gpt-live-1' }));
    const capture = await page.evaluate(async () => {
      const state = (window as unknown as { test: { pc: RTCPeerConnection; mic: MediaStream; recorder?: MediaRecorder; chunks: Blob[]; events: { type?: string; delta?: string }[]; playback: string[] } }).test;
      const samples: unknown[] = [];
      for (let i = 0; i < 7; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const stats = await state.pc.getStats();
        samples.push([...stats.values()].filter((r) => ['inbound-rtp', 'outbound-rtp', 'codec', 'remote-outbound-rtp', 'candidate-pair'].includes(r.type)));
      }
      if (!state.recorder) throw new Error('No remote audio track received');
      await new Promise<void>((resolve) => { state.recorder!.onstop = () => resolve(); state.recorder!.stop(); });
      const blob = new Blob(state.chunks, { type: 'audio/webm' });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      state.mic.getTracks().forEach((track) => track.stop());
      return { audio: btoa(binary), samples, events: state.events, playback: state.playback, connection: state.pc.connectionState };
    });
    const file = path.join(output, 'assistant.webm');
    await fs.writeFile(file, Buffer.from(capture.audio, 'base64'));
    const report = { samples: capture.samples, events: capture.events, playback: capture.playback, connection: capture.connection };
    await fs.writeFile(path.join(output, 'transport.json'), JSON.stringify(report, null, 2));
    const transcript = capture.events.filter((event: { type?: string }) => event.type === 'session.output_transcript.delta').map((event: { delta?: string }) => event.delta ?? '').join('');
    assert.ok(transcript.trim(), 'No spoken assistant transcript');
    assert.equal(capture.connection, 'connected');
    console.log(JSON.stringify({ passed: true, audioFile: file, transcript, playback: capture.playback, realConvexWrites: 0, realEmailSends: 0 }));
  } finally {
    if (provider) await sendToSession(provider, [{ type: 'session.close' }], 8000).catch((error) => console.warn('Session cleanup:', error.message));
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
