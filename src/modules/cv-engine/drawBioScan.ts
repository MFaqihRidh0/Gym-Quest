import { KEY_JOINTS, POSE_CONNECTIONS } from './landmarks';
import type { PoseLandmarks } from './types';

const CYAN = '0, 229, 255';
const AMBER = '255, 182, 39';
const RED = '255, 61, 90';
const VISIBILITY_THRESHOLD = 0.5;

export interface BioScanOptions {
  /** Ukuran tampil kanvas dalam CSS pixel (bukan pixel fisik). */
  width: number;
  height: number;
  /** Resolusi asli frame kamera — dipakai untuk mengoreksi crop `object-cover`. */
  sourceWidth: number;
  sourceHeight: number;
  /** Video kamera depan ditampilkan mirror, jadi overlay ikut dibalik. */
  mirrored?: boolean;
  pulsePhase?: number;
  /**
   * Flag form exercise (bukan status kalibrasi). `false` mewarnai seluruh
   * skeleton merah sebagai indikator visual form salah; `true`/`undefined`
   * memakai skema warna deteksi biasa (cyan/amber).
   */
  formOk?: boolean;
}

export function drawBioScan(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarks | null,
  options: BioScanOptions,
) {
  const {
    width,
    height,
    sourceWidth,
    sourceHeight,
    mirrored = true,
    pulsePhase = 0,
    formOk,
  } = options;
  const skeletonColor = formOk === false ? RED : CYAN;

  ctx.clearRect(0, 0, width, height);
  if (!landmarks || sourceWidth <= 0 || sourceHeight <= 0) return;

  /**
   * `object-cover` menskalakan video sampai menutupi container lalu memotong
   * sisa lebar/tingginya secara simetris. Landmark bersifat normal terhadap
   * frame asli, jadi tanpa koreksi ini overlay akan meleset dari tubuh setiap
   * kali rasio container berbeda dari rasio kamera.
   */
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const offsetX = (sourceWidth * scale - width) / 2;
  const offsetY = (sourceHeight * scale - height) / 2;

  const toX = (x: number) => (mirrored ? 1 - x : x) * sourceWidth * scale - offsetX;
  const toY = (y: number) => y * sourceHeight * scale - offsetY;

  ctx.lineCap = 'round';

  for (const [from, to] of POSE_CONNECTIONS) {
    const a = landmarks[from];
    const b = landmarks[to];
    if (!a || !b) continue;
    if (a.visibility < VISIBILITY_THRESHOLD || b.visibility < VISIBILITY_THRESHOLD) continue;

    const ax = toX(a.x);
    const ay = toY(a.y);
    const bx = toX(b.x);
    const by = toY(b.y);

    const gradient = ctx.createLinearGradient(ax, ay, bx, by);
    gradient.addColorStop(0, `rgba(${skeletonColor}, 0.85)`);
    gradient.addColorStop(1, `rgba(${skeletonColor}, 0.25)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.shadowColor = `rgba(${skeletonColor}, 0.55)`;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  const pulse = 1 + 0.08 * Math.sin(pulsePhase);

  for (const index of KEY_JOINTS) {
    const point = landmarks[index];
    if (!point) continue;

    const detected = point.visibility >= VISIBILITY_THRESHOLD;
    const color = detected ? skeletonColor : AMBER;
    const radius = (detected ? 6 : 5) * (detected ? pulse : 1);
    const x = toX(point.x);
    const y = toY(point.y);

    ctx.shadowColor = `rgba(${color}, 0.7)`;
    ctx.shadowBlur = detected ? 16 : 10;
    ctx.fillStyle = `rgba(${color}, ${detected ? 0.95 : 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(${color}, 0.9)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}
