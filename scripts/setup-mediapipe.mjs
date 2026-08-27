import { copyFile, mkdir, readdir, access } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';

const WASM_SRC = 'node_modules/@mediapipe/tasks-vision/wasm';
const WASM_DEST = 'public/mediapipe/wasm';
const MODEL_DEST = 'public/mediapipe/models/pose_landmarker_lite.task';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

await mkdir(WASM_DEST, { recursive: true });
for (const file of await readdir(WASM_SRC)) {
  await copyFile(path.join(WASM_SRC, file), path.join(WASM_DEST, file));
}
console.log(`Runtime WASM disalin ke ${WASM_DEST}`);

if (await exists(MODEL_DEST)) {
  console.log('Model pose landmarker sudah ada, lewati unduhan.');
} else {
  await mkdir(path.dirname(MODEL_DEST), { recursive: true });
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`Gagal mengunduh model: ${res.status} ${res.statusText}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(MODEL_DEST));
  console.log(`Model diunduh ke ${MODEL_DEST}`);
}
