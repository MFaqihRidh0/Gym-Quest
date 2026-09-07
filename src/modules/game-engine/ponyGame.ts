import { soundEngine } from './audio';

const OBSTACLE_WIDTH = 58;
const OBSTACLE_GAP_HEIGHT_RATIO = 0.40; // Celah lebih lapang agar adil dan nyaman dilewati saat push-up
const OBSTACLE_SPEED = 270; // px/detik — Melaju stabil & energik
const OBSTACLE_INTERVAL = 1.35; // detik antar rintangan — ritme pas dengan tempo push-up
const PONY_SIZE = 46;
const PONY_X_RATIO = 0.22;
const LERP_SPEED = 4.2; // Halus mengejar posisi push-up tanpa sentakan mendadak
const INVULNERABLE_SECONDS = 1.4;

interface Obstacle {
  x: number;
  gapCenter: number; // 0..1 relatif tinggi kanvas
  passed: boolean;
  isDown: boolean; // true = celah bawah (posisi turun), false = celah atas (posisi naik)
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface FloatingText {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
}

export interface PonyGameState {
  score: number;
  lives: number;
  gameOver: boolean;
}

const MAGENTA = '255, 61, 154';
const CYAN = '0, 229, 255';
const RED = '255, 61, 90';

export class PonyGame {
  private width = 0;
  private height = 0;
  private ponyY = 0.5;
  private ponyDrawY = 0.5;
  private obstacles: Obstacle[] = [];
  private timeSinceSpawn = 0;
  private invulnerable = 0;
  private bobPhase = 0;

  // Efek visual hantaman & latar
  private screenShake = 0;
  private sparks: Spark[] = [];
  private floatingTexts: FloatingText[] = [];
  private stars: Star[] = [];
  private gridOffset = 0;

  score = 0;
  lives = 3;
  gameOver = false;

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    if (this.stars.length === 0 && width > 0) {
      this.initStars();
    }
  }

  /**
   * Menghitung posisi Y visual kuda poni di layar.
   * Dipetakan ke safe flight corridor (24% s.d. 74% tinggi kanvas)
   * agar sejajar pas dengan celah rintangan atas (~0.28) dan bawah (~0.72)
   * serta mencegah kuda poni menabrak atap kanvas (0%) saat naik atau menabrak lantai (100%) saat turun.
   */
  private getPonyScreenY(): number {
    const minScreenY = this.height * 0.24; // Posisi puncak push-up (pas tengah celah atas)
    const maxScreenY = this.height * 0.74; // Posisi dasar push-up (pas tengah celah bawah)
    return maxScreenY - this.ponyDrawY * (maxScreenY - minScreenY);
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.75,
        speed: 20 + Math.random() * 40,
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }
  }

  reset() {
    this.obstacles = [];
    this.spawnStep = 0;
    this.timeSinceSpawn = 0;
    this.invulnerable = 0;
    this.screenShake = 0;
    this.sparks = [];
    this.floatingTexts = [];
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.ponyY = 0.5;
    this.ponyDrawY = 0.5;
  }

  private spawnStep = 0;

  private spawnObstacle() {
    this.spawnStep++;
    // Pola ritmik bergantian push-up:
    // Step ganjil = celah di BAWAH (~0.72) -> user turun/dada ke bawah
    // Step genap = celah di ATAS (~0.28) -> user dorong naik/ekstensi
    const isDown = this.spawnStep % 2 === 1;
    const baseCenter = isDown ? 0.72 : 0.28;
    const jitter = (Math.random() - 0.5) * 0.06;
    const gapCenter = Math.min(Math.max(baseCenter + jitter, 0.20), 0.80);

    this.obstacles.push({
      x: this.width + OBSTACLE_WIDTH,
      gapCenter,
      passed: false,
      isDown,
    });
  }

  private triggerHit(x: number, y: number) {
    this.lives -= 1;
    this.invulnerable = INVULNERABLE_SECONDS;
    this.screenShake = 0.35; // Bergetar selama 350ms
    soundEngine.playHit();

    // Buat partikel percikan benturan
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 240;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
        color: Math.random() > 0.4 ? RED : '255, 255, 255',
      });
    }

    // Teks melayang "-1 NYAWA"
    this.floatingTexts.push({
      text: '-1 NYAWA!',
      x,
      y: y - 25,
      life: 0,
      color: `rgb(${RED})`,
    });

    if (this.lives <= 0) {
      this.gameOver = true;
      soundEngine.playGameOver();
    }
  }

  /** @param control posisi target 0 (bawah) - 1 (atas), null jika tubuh tak terdeteksi. */
  update(dt: number, control: number | null): PonyGameState {
    if (this.gameOver || this.width === 0) {
      return { score: this.score, lives: this.lives, gameOver: this.gameOver };
    }

    this.bobPhase += dt * 3.5;
    if (control !== null) this.ponyY = control;
    this.ponyDrawY += (this.ponyY - this.ponyDrawY) * Math.min(1, dt * LERP_SPEED);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.screenShake = Math.max(0, this.screenShake - dt);
    this.gridOffset = (this.gridOffset + dt * 140) % 40;

    // Update bintang background
    for (const star of this.stars) {
      star.x -= star.speed * dt;
      if (star.x < 0) {
        star.x = this.width + 10;
        star.y = Math.random() * this.height * 0.75;
      }
    }

    // Update partikel benturan
    for (const spark of this.sparks) {
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.life += dt;
    }
    this.sparks = this.sparks.filter((s) => s.life < s.maxLife);

    // Update floating texts
    for (const ft of this.floatingTexts) {
      ft.y -= dt * 35;
      ft.life += dt;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life < 0.9);

    this.timeSinceSpawn += dt;
    if (this.timeSinceSpawn >= OBSTACLE_INTERVAL) {
      this.timeSinceSpawn = 0;
      this.spawnObstacle();
    }

    const ponyX = this.width * PONY_X_RATIO;
    const ponyScreenY = this.getPonyScreenY();
    const gapHeightPx = this.height * OBSTACLE_GAP_HEIGHT_RATIO;

    for (const obstacle of this.obstacles) {
      obstacle.x -= OBSTACLE_SPEED * dt;

      const gapCenterPx = obstacle.gapCenter * this.height;
      const overlapsX =
        ponyX + PONY_SIZE * 0.40 > obstacle.x && ponyX - PONY_SIZE * 0.40 < obstacle.x + OBSTACLE_WIDTH;
      const withinGap =
        ponyScreenY - PONY_SIZE * 0.36 > gapCenterPx - gapHeightPx / 2 &&
        ponyScreenY + PONY_SIZE * 0.36 < gapCenterPx + gapHeightPx / 2;

      if (overlapsX && !withinGap && this.invulnerable <= 0) {
        this.triggerHit(ponyX, ponyScreenY);
      }

      if (!obstacle.passed && obstacle.x + OBSTACLE_WIDTH < ponyX) {
        obstacle.passed = true;
        this.score += 1;
        soundEngine.playPoint();
        this.floatingTexts.push({
          text: '+1',
          x: ponyX + 20,
          y: ponyScreenY - 15,
          life: 0,
          color: `rgb(${CYAN})`,
        });
      }
    }

    this.obstacles = this.obstacles.filter((obstacle) => obstacle.x > -OBSTACLE_WIDTH);

    return { score: this.score, lives: this.lives, gameOver: this.gameOver };
  }

  private drawCyberpunkBackground(ctx: CanvasRenderingContext2D) {
    // 1. Langit gradasi cyberpunk gelap pekat
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGradient.addColorStop(0, '#060712');
    skyGradient.addColorStop(0.65, '#0c102b');
    skyGradient.addColorStop(0.85, '#1e1136');
    skyGradient.addColorStop(1, '#090a18');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Bintang berkelap-kelip
    for (const star of this.stars) {
      ctx.fillStyle = `rgba(232, 236, 255, ${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // 3. Siluet gedung kota cyberpunk di kejauhan
    const cityBaseY = this.height * 0.82;
    ctx.fillStyle = 'rgba(14, 18, 44, 0.9)';
    ctx.strokeStyle = `rgba(${CYAN}, 0.25)`;
    ctx.lineWidth = 1;

    const buildingWidths = [45, 60, 35, 70, 50, 40, 65, 55, 45, 80, 50];
    const buildingHeights = [65, 110, 85, 140, 95, 75, 125, 90, 70, 150, 80];
    let bx = 0;
    let bIdx = 0;

    while (bx < this.width) {
      const bw = buildingWidths[bIdx % buildingWidths.length];
      const bh = buildingHeights[bIdx % buildingHeights.length];
      ctx.fillRect(bx, cityBaseY - bh, bw, bh);
      ctx.strokeRect(bx, cityBaseY - bh, bw, bh);

      // Lampu jendela neon
      ctx.fillStyle = bIdx % 2 === 0 ? `rgba(${CYAN}, 0.35)` : `rgba(${MAGENTA}, 0.35)`;
      for (let wy = cityBaseY - bh + 12; wy < cityBaseY - 10; wy += 18) {
        ctx.fillRect(bx + 8, wy, 4, 6);
        ctx.fillRect(bx + bw - 12, wy, 4, 6);
      }
      ctx.fillStyle = 'rgba(14, 18, 44, 0.9)';

      bx += bw + 6;
      bIdx++;
    }

    // 4. Horizon glowing line
    ctx.strokeStyle = `rgba(${MAGENTA}, 0.6)`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `rgba(${MAGENTA}, 0.8)`;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, cityBaseY);
    ctx.lineTo(this.width, cityBaseY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 5. Grid cyberpunk perspektif di lantai
    const floorHeight = this.height - cityBaseY;
    ctx.fillStyle = 'rgba(7, 8, 20, 0.95)';
    ctx.fillRect(0, cityBaseY, this.width, floorHeight);

    ctx.strokeStyle = `rgba(${CYAN}, 0.22)`;
    ctx.lineWidth = 1;
    // Garis horizontal lantai yang bergerak
    for (let gy = cityBaseY; gy < this.height; gy += 16) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(this.width, gy);
      ctx.stroke();
    }
    // Garis vertikal lantai bergerak
    for (let gx = -40 + this.gridOffset; gx < this.width + 40; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, cityBaseY);
      ctx.lineTo(gx - 30, this.height);
      ctx.stroke();
    }
  }

  private drawPony(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Animasi kedip saat invulnerable: kedip merah/putih cepat seperti hantaman
    let isHitFlashing = false;
    let alpha = 1;

    if (this.invulnerable > 0) {
      const step = Math.floor(this.invulnerable * 14) % 3;
      if (step === 0) {
        alpha = 0.2;
      } else if (step === 1) {
        isHitFlashing = true; // Flash merah/putih
        alpha = 1;
      } else {
        alpha = 0.65;
      }
    }

    const bob = Math.sin(this.bobPhase) * 3.5;
    const bodyColor = isHitFlashing ? `rgb(${RED})` : `rgba(${MAGENTA}, 0.95)`;
    const bodyDark = isHitFlashing ? `rgb(200, 30, 50)` : `rgba(180, 20, 95, 0.95)`;
    const maneColor = isHitFlashing ? 'rgb(255, 255, 255)' : `rgba(${CYAN}, 0.95)`;
    const hoofColor = isHitFlashing ? 'rgb(255, 255, 255)' : '#ffd700';

    // Kemiringan badan sesuai arah naik/turun (flight pitch)
    const pitch = Math.max(-0.22, Math.min(0.22, (this.ponyDrawY - this.ponyY) * 0.45));
    const gallop = this.bobPhase * 3.2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y + bob);
    ctx.rotate(pitch);

    ctx.shadowColor = isHitFlashing ? `rgba(${RED}, 0.9)` : `rgba(${MAGENTA}, 0.75)`;
    ctx.shadowBlur = isHitFlashing ? 26 : 16;

    // 1. Ekor Bergelombang (Flowing Cyber Tail)
    ctx.save();
    ctx.translate(-PONY_SIZE * 0.44, -2);
    ctx.fillStyle = maneColor;
    for (let t = 0; t < 3; t++) {
      const wave = Math.sin(gallop + t * 0.7) * 5;
      ctx.beginPath();
      ctx.ellipse(-PONY_SIZE * 0.2 - t * 4, wave + t * 3, PONY_SIZE * 0.18, 4, -0.2 + wave * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Kaki Belakang (Hind Legs) dengan sendi & kuku emas berlari
    const drawLeg = (baseX: number, baseY: number, angle1: number, angle2: number, isHind: boolean) => {
      ctx.save();
      ctx.translate(baseX, baseY);
      ctx.rotate(angle1);
      ctx.fillStyle = isHind ? bodyDark : bodyColor;

      // Paha
      ctx.beginPath();
      ctx.roundRect(-3, 0, 6, PONY_SIZE * 0.22, 3);
      ctx.fill();

      // Betis & Kuku
      ctx.translate(0, PONY_SIZE * 0.2);
      ctx.rotate(angle2);
      ctx.beginPath();
      ctx.roundRect(-2.5, 0, 5, PONY_SIZE * 0.18, 2);
      ctx.fill();

      // Kuku emas
      ctx.fillStyle = hoofColor;
      ctx.fillRect(-3, PONY_SIZE * 0.18 - 2, 6, 4);
      ctx.restore();
    };

    // Kaki belakang kiri & kanan (fase berlawanan)
    const hindSwing1 = Math.sin(gallop) * 0.45 + 0.2;
    const hindSwing2 = Math.sin(gallop + 0.8) * 0.45 + 0.2;
    drawLeg(-PONY_SIZE * 0.28, PONY_SIZE * 0.16, hindSwing1, 0.4, true);
    drawLeg(-PONY_SIZE * 0.22, PONY_SIZE * 0.16, hindSwing2, 0.3, true);

    // 3. Badan Kuda Poni
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 2, PONY_SIZE * 0.48, PONY_SIZE * 0.3, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Jet Thruster di belakang badan
    ctx.fillStyle = 'rgba(40, 50, 80, 0.9)';
    ctx.fillRect(-PONY_SIZE * 0.48, -4, 6, 8);
    // Api plasma dari thruster
    const flameLen = 6 + Math.random() * 8;
    ctx.fillStyle = `rgba(${CYAN}, ${0.6 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(-PONY_SIZE * 0.48, -3);
    ctx.lineTo(-PONY_SIZE * 0.48 - flameLen, 0);
    ctx.lineTo(-PONY_SIZE * 0.48, 3);
    ctx.closePath();
    ctx.fill();

    // 4. Kaki Depan (Front Legs) berlari
    const frontSwing1 = Math.sin(gallop + Math.PI) * 0.5 - 0.2;
    const frontSwing2 = Math.sin(gallop + Math.PI + 0.8) * 0.5 - 0.2;
    drawLeg(PONY_SIZE * 0.18, PONY_SIZE * 0.18, frontSwing1, -0.3, false);
    drawLeg(PONY_SIZE * 0.26, PONY_SIZE * 0.18, frontSwing2, -0.4, false);

    // 5. Leher & Kepala Kuda Poni
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(PONY_SIZE * 0.28, -PONY_SIZE * 0.12, PONY_SIZE * 0.18, PONY_SIZE * 0.24, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Moncong / Kepala
    ctx.beginPath();
    ctx.ellipse(PONY_SIZE * 0.42, -PONY_SIZE * 0.18, PONY_SIZE * 0.22, PONY_SIZE * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Telinga Cyber
    ctx.beginPath();
    ctx.moveTo(PONY_SIZE * 0.32, -PONY_SIZE * 0.3);
    ctx.lineTo(PONY_SIZE * 0.38, -PONY_SIZE * 0.5);
    ctx.lineTo(PONY_SIZE * 0.46, -PONY_SIZE * 0.3);
    ctx.closePath();
    ctx.fill();

    // Tanduk Alicorn Bercahaya (Glowing Cyber Horn)
    ctx.save();
    ctx.strokeStyle = `rgba(${CYAN}, 0.95)`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = `rgba(${CYAN}, 0.95)`;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(PONY_SIZE * 0.44, -PONY_SIZE * 0.32);
    ctx.lineTo(PONY_SIZE * 0.62, -PONY_SIZE * 0.52);
    ctx.stroke();
    // Kilau bintang di ujung tanduk
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(PONY_SIZE * 0.62, -PONY_SIZE * 0.52, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Mata Cyber Visor / Cute Eye
    ctx.fillStyle = '#060714';
    ctx.beginPath();
    ctx.ellipse(PONY_SIZE * 0.42, -PONY_SIZE * 0.2, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgb(${CYAN})`;
    ctx.beginPath();
    ctx.arc(PONY_SIZE * 0.43, -PONY_SIZE * 0.2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(PONY_SIZE * 0.44, -PONY_SIZE * 0.22, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Surai Neon Berayun di Angin (Animated Mane)
    ctx.fillStyle = maneColor;
    for (let m = 0; m < 4; m++) {
      const maneWave = Math.sin(gallop * 1.2 + m * 0.8) * 3;
      ctx.beginPath();
      ctx.ellipse(
        PONY_SIZE * 0.08 + m * 5,
        -PONY_SIZE * 0.26 + maneWave * 0.5,
        PONY_SIZE * 0.14,
        PONY_SIZE * 0.09,
        -0.5 + maneWave * 0.04,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // 7. Sayap Pegasus Cyber (Flapping Cyber Wings)
    const wingFlap = Math.sin(this.bobPhase * 3.5);
    ctx.save();
    ctx.translate(PONY_SIZE * 0.02, -PONY_SIZE * 0.08);
    ctx.rotate(-0.3 + wingFlap * 0.35); // Kepakan sayap dinamis

    // Sayap Utama
    ctx.fillStyle = `rgba(${CYAN}, 0.9)`;
    ctx.shadowColor = `rgba(${CYAN}, 0.95)`;
    ctx.shadowBlur = 12;

    // 3 Bilah Bulu Energi Sayap
    for (let f = 0; f < 3; f++) {
      ctx.beginPath();
      ctx.ellipse(
        -f * 4,
        -PONY_SIZE * (0.28 + f * 0.1),
        4.5,
        PONY_SIZE * (0.22 + f * 0.06),
        0.2 - f * 0.15,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.width === 0) return;

    ctx.save();

    // Efek getar layar saat kena hantaman (Screen Shake)
    if (this.screenShake > 0) {
      const intensity = (this.screenShake / 0.35) * 9;
      const shakeX = (Math.random() - 0.5) * intensity;
      const shakeY = (Math.random() - 0.5) * intensity;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Render Background Cyberpunk
    this.drawCyberpunkBackground(ctx);

    const gapHeightPx = this.height * OBSTACLE_GAP_HEIGHT_RATIO;

    // 2. Render Rintangan Laser Cyberpunk
    for (const obstacle of this.obstacles) {
      const gapCenterPx = obstacle.gapCenter * this.height;
      const topHeight = gapCenterPx - gapHeightPx / 2;
      const bottomY = gapCenterPx + gapHeightPx / 2;

      // Batang laser atas
      const topGrad = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + OBSTACLE_WIDTH, 0);
      topGrad.addColorStop(0, `rgba(${MAGENTA}, 0.25)`);
      topGrad.addColorStop(0.5, `rgba(${MAGENTA}, 0.6)`);
      topGrad.addColorStop(1, `rgba(${MAGENTA}, 0.25)`);

      ctx.fillStyle = topGrad;
      ctx.strokeStyle = `rgba(${MAGENTA}, 0.95)`;
      ctx.lineWidth = 2;
      ctx.shadowColor = `rgba(${MAGENTA}, 0.7)`;
      ctx.shadowBlur = 12;

      ctx.fillRect(obstacle.x, 0, OBSTACLE_WIDTH, topHeight);
      ctx.strokeRect(obstacle.x, 0, OBSTACLE_WIDTH, topHeight);

      // Node laser ujung
      ctx.fillStyle = `rgba(${CYAN}, 0.95)`;
      ctx.fillRect(obstacle.x - 2, topHeight - 8, OBSTACLE_WIDTH + 4, 8);

      // Batang laser bawah
      ctx.fillStyle = topGrad;
      ctx.fillRect(obstacle.x, bottomY, OBSTACLE_WIDTH, this.height - bottomY);
      ctx.strokeRect(obstacle.x, bottomY, OBSTACLE_WIDTH, this.height - bottomY);

      // Node laser ujung bawah
      ctx.fillStyle = `rgba(${CYAN}, 0.95)`;
      ctx.fillRect(obstacle.x - 2, bottomY, OBSTACLE_WIDTH + 4, 8);

      // Cue teks visual di tengah celah untuk memandu push-up
      ctx.fillStyle = obstacle.isDown ? `rgba(${CYAN}, 0.8)` : `rgba(${MAGENTA}, 0.8)`;
      ctx.font = 'bold 11px var(--font-mono)';
      ctx.textAlign = 'center';
      ctx.fillText(
        obstacle.isDown ? '▼ TURUN' : '▲ NAIK',
        obstacle.x + OBSTACLE_WIDTH / 2,
        gapCenterPx + 4,
      );
      ctx.textAlign = 'start';
    }
    ctx.shadowBlur = 0;

    // 3. Render Karakter Kuda Poni
    const ponyX = this.width * PONY_X_RATIO;
    const ponyScreenY = this.getPonyScreenY();
    this.drawPony(ctx, ponyX, ponyScreenY);

    // 4. Render Percikan Partikel Hantaman
    for (const spark of this.sparks) {
      const progress = spark.life / spark.maxLife;
      const alpha = 1 - progress;
      ctx.fillStyle = spark.color.startsWith('rgb') ? spark.color : `rgba(${spark.color}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, 2.5 * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Render Floating Texts
    ctx.font = 'bold 16px var(--font-mono)';
    for (const ft of this.floatingTexts) {
      const alpha = 1 - ft.life / 0.9;
      ctx.fillStyle = ft.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
  }
}
