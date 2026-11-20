// 황지 페이퍼트레일: record the spoken lines with ElevenLabs TTS (eleven_multilingual_v2).
//   * the opening story (src/game/intro.js INTRO), told by the heroine 하늘이 (voice 'sena'): calm but alive
//     -> public/sounds/intro_N.mp3
//   * every line each mascot can say (src/game/talk.js linesOf), in that mascot's voice (talk.js VOICES)
//     -> public/voices/<who>/<hash>.mp3, listed in public/voices/index.json
// Each clip is trimmed, evened to about -17 dB RMS (gentle limiter) and saved as 64 kbps mono mp3 (ffmpeg on PATH).
// Raw takes are kept in <rawDir> and reused, so a run can be resumed; delete a raw file to record that line again.
//
//   node --env-file=<.env.local with ELEVENLABS_API_KEY> art-src/taebaek/voices/gen_voices.mjs <rawDir> [intro|mascots]
// The key is only read from process.env and sent as a header; it is never printed or written anywhere.
import { existsSync, mkdirSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { MASCOTS, VOICES, linesOf, spoken, voiceKey } from '../../../src/game/talk.js';
import { INTRO } from '../../../src/game/intro.js';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('ELEVENLABS_API_KEY is not set'); process.exit(2); }
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const RAW = resolve(process.argv[2] || 'voices-raw');
const ONLY = process.argv[3] || 'all';
const HERO_VOICE = 'vJ170fCwESgE1tjW39So'; // sena - friendly, cheerful young Korean voice
const HERO_SET = { stability: 0.35, similarity_boost: 0.8, style: 0.55, use_speaker_boost: true, speed: 0.93 };
const MASCOT_SET = { stability: 0.45, similarity_boost: 0.8, style: 0.4, use_speaker_boost: true, speed: 1.0 };
const CONCURRENCY = 4;

const jobs = [];
if (ONLY !== 'mascots') INTRO.forEach((text, i) => jobs.push({ text, voice: HERO_VOICE, set: HERO_SET, raw: join(RAW, `intro_${i + 1}.mp3`), out: join(ROOT, 'public/sounds', `intro_${i + 1}.mp3`) }));
const index = {};
if (ONLY !== 'intro') {
  for (const id of Object.keys(MASCOTS)) {
    for (const line of linesOf(id)) {
      const key = voiceKey(id, line);
      index[key] = 1;
      jobs.push({ text: spoken(line), voice: VOICES[id].voice, set: MASCOT_SET, raw: join(RAW, key + '.mp3'), out: join(ROOT, 'public/voices', key + '.mp3') });
    }
  }
}

async function record(job) {
  if (existsSync(job.raw)) return 'cached';
  mkdirSync(dirname(job.raw), { recursive: true });
  const body = { text: job.text, model_id: 'eleven_multilingual_v2', language_code: 'ko', voice_settings: job.set };
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${job.voice}?output_format=mp3_44100_128`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { writeFileSync(job.raw, Buffer.from(await r.arrayBuffer())); return 'recorded'; }
    if (r.status === 429 || r.status >= 500) { await new Promise((ok) => setTimeout(ok, 1500 * (attempt + 1))); continue; }
    throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
  }
  throw new Error('gave up after retries');
}

function ffmpeg(args) { return spawnSync('ffmpeg', ['-hide_banner', ...args], { encoding: 'utf8' }); }
function finish(job) {
  mkdirSync(dirname(job.out), { recursive: true });
  const trim = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,asetpts=N/SR/TB';
  const probe = ffmpeg(['-i', job.raw, '-af', `${trim},astats=measure_overall=RMS_level:measure_perchannel=none`, '-f', 'null', '-']);
  const m = /RMS level dB: (-?[\d.]+)/.exec(probe.stderr || '');
  const gain = m ? Math.max(-12, Math.min(12, -17 - Number(m[1]))) : 0;
  const tmp = job.out + '.tmp.mp3';
  const r = ffmpeg(['-loglevel', 'error', '-y', '-i', job.raw, '-af', `${trim},adelay=40:all=1,apad=pad_dur=0.12,volume=${gain.toFixed(2)}dB,alimiter=limit=0.89:attack=3:release=60:level=disabled`, '-ac', '1', '-ar', '44100', '-b:a', '64k', tmp]);
  if (r.status !== 0) throw new Error('ffmpeg: ' + (r.stderr || '').slice(0, 200));
  if (existsSync(job.out)) unlinkSync(job.out);
  renameSync(tmp, job.out);
}

let next = 0; let done = 0; let failed = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++];
    try {
      const how = await record(job);
      finish(job);
      done++;
      if (how === 'recorded') process.stdout.write('.');
    } catch (err) { failed++; console.log(`\nFAILED ${job.out}: ${err.message}`); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
if (ONLY !== 'intro') {
  mkdirSync(join(ROOT, 'public/voices'), { recursive: true });
  writeFileSync(join(ROOT, 'public/voices/index.json'), JSON.stringify(Object.keys(index).sort()) + '\n');
}
console.log(`\n${done} clips ready, ${failed} failed (${jobs.length} lines)`);
if (failed) process.exit(1);
