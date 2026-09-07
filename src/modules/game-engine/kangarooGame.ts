import { soundEngine } from './audio';

const KANGAROO_X_RATIO = 0.22;
const KANGAROO_SIZE = 58;

const START_SPEED = 240; // px/detik
const MAX_SPEED = 360;
const SPEED_RAMP_PER_SECOND = 2.0;
const MIN_SPAWN_GAP_SECONDS = 3.4; // Jeda bersih ~2 detik antar rintangan trapesium
const MAX_SPAWN_GAP_SECONDS = 4.6;

const MAGENTA = '255, 61, 154';
const CYAN = '0, 229, 255';
const YELLOW = '255, 214, 0';
const RED = '255, 61, 90';
const INVULNERABLE_SECONDS = 1.5;

interface TrapezoidObstacle {
  x: number;
  width: number; // lebar total alas (260 - 350px)
  topWidth: number; // lebar puncak datar (170 - 240px)
  height: number; // tinggi trapesium (~0.22 * canvas height)
  passed: boolean;
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

export interface KangarooGameState {
  score: number;
  lives: number;
  gameOver: boolean;
}

export class KangarooGame {
  private width = 0;
  private height = 0;

  // Posisi lompat/melayang dikendalikan langsung oleh tangan angkat barbel
  private airborneY = 0; // px di atas tanah
  private targetAirborneY = 0;
  private grounded = true;
  private handElevation = 0; // 0 (tangan di bawah) s.d. 1 (tangan di atas mengangkat barbel)

  private obstacles: TrapezoidObstacle[] = [];
  private timeSinceSpawn = 0;
  private nextSpawnGap = 2.4;
  private elapsed = 0;
  private runPhase = 0;
  private invulnerable = 0;

  // Efek visual
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

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.72,
        speed: 25 + Math.random() * 45,
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }
  }

  reset() {
    this.airborneY = 0;
    this.targetAirborneY = 0;
    this.grounded = true;
    this.handElevation = 0;
    this.obstacles = [];
    this.timeSinceSpawn = 0;
    this.nextSpawnGap = 3.8; // Jeda awal sebelum rintangan pertama muncul
    this.elapsed = 0;
    this.runPhase = 0;
    this.invulnerable = 0;
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.screenShake = 0;
    this.sparks = [];
    this.floatingTexts = [];
  }

  private currentSpeed() {
    return Math.min(START_SPEED + this.elapsed * SPEED_RAMP_PER_SECOND, MAX_SPEED);
  }

  private spawnObstacle() {
    // Rintangan trapesium agak panjang agar user menahan angkatan barbel di atas
    const width = 270 + Math.random() * 70; // 270 s.d. 340px
    const topWidth = width * (0.62 + Math.random() * 0.1); // 170 s.d. 240px
    const obsHeight = this.height * 0.155; // Tinggi rintangan diturunkan (~15.5% kanvas) agar lebih nyaman dilompati

    this.obstacles.push({
      x: this.width + 40,
      width,
      topWidth,
      height: obsHeight,
      passed: false,
    });

    const progress = Math.min(this.elapsed / 45, 1);
    this.nextSpawnGap =
      MAX_SPAWN_GAP_SECONDS - (MAX_SPAWN_GAP_SECONDS - MIN_SPAWN_GAP_SECONDS) * progress;
  }

  private triggerHit(x: number, y: number) {
    this.lives -= 1;
    this.invulnerable = INVULNERABLE_SECONDS;
    this.screenShake = 0.4;
    soundEngine.playHit();

    // Buat percikan hantaman
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 220;
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

  addRepBonus() {
    this.score += 15;
    const groundY = this.height * 0.90;
    const kx = this.width * KANGAROO_X_RATIO;
    this.floatingTexts.push({
      text: '+15 REP BARBEL!',
      x: kx + 20,
      y: groundY - this.airborneY - KANGAROO_SIZE - 20,
      life: 0,
      color: `rgb(${YELLOW})`,
    });
  }

  /**
   * @param control Nilai 0 (tangan di bawah) s.d. 1 (tangan diangkat tinggi mengangkat barbel).
   */
  update(dt: number, control: number | null): KangarooGameState {
    if (this.gameOver || this.width === 0) {
      return { score: this.score, lives: this.lives, gameOver: this.gameOver };
    }

    this.elapsed += dt;
    this.runPhase += dt * 7.5;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.screenShake = Math.max(0, this.screenShake - dt);

    const speed = this.currentSpeed();
    this.gridOffset = (this.gridOffset + dt * speed) % 40;

    // Kendali angkat barbel: tangan naik -> kangguru melompat & melayang
    if (control !== null) {
      this.handElevation += (control - this.handElevation) * Math.min(1, dt * 8);
    }
    const maxJumpHeight = this.height * 0.38;
    this.targetAirborneY = this.handElevation * maxJumpHeight;

    // Kejar target ketinggian dengan transisi mulus dan responsif
    this.airborneY += (this.targetAirborneY - this.airborneY) * Math.min(1, dt * 7.2);
    this.grounded = this.airborneY < 8;

    // Update stars
    for (const star of this.stars) {
      star.x -= star.speed * dt;
      if (star.x < 0) {
        star.x = this.width + 10;
        star.y = Math.random() * this.height * 0.72;
      }
    }

    // Update sparks
    for (const spark of this.sparks) {
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.life += dt;
    }
    this.sparks = this.sparks.filter((s) => s.life < s.maxLife);

    // Update floating texts
    for (const ft of this.floatingTexts) {
      ft.y -= dt * 32;
      ft.life += dt;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life < 0.9);

    // Spawn rintangan
    this.timeSinceSpawn += dt;
    if (this.timeSinceSpawn >= this.nextSpawnGap) {
      this.timeSinceSpawn = 0;
      this.spawnObstacle();
    }

    const groundY = this.height * 0.90;
    const kangarooX = this.width * KANGAROO_X_RATIO;
    const kangarooFeetY = this.airborneY; // tinggi kaki kangguru dari tanah

    // Deteksi tumbukan dengan trapesium
    for (const obstacle of this.obstacles) {
      obstacle.x -= speed * dt;

      const ox = obstacle.x;
      const w = obstacle.width;
      const topW = obstacle.topWidth;
      const h = obstacle.height;
      const ramp = (w - topW) / 2;

      // Cek apakah kangguru berada di area horizontal trapesium
      const footLeft = kangarooX - 18;
      const footRight = kangarooX + 18;
      const overlapsX = footRight > ox && footLeft < ox + w;

      if (overlapsX) {
        // Hitung ketinggian permukaan trapesium tepat di bawah kaki kangguru
        let surfaceHeight = 0;
        if (kangarooX < ox + ramp) {
          surfaceHeight = Math.max(0, ((kangarooX - ox) / ramp) * h);
        } else if (kangarooX <= ox + w - ramp) {
          surfaceHeight = h;
        } else {
          surfaceHeight = Math.max(0, ((ox + w - kangarooX) / ramp) * h);
        }

        // Jika kaki kangguru lebih rendah dari permukaan trapesium -> tabrakan!
        if (kangarooFeetY < surfaceHeight + 8 && this.invulnerable <= 0) {
          const hitY = groundY - kangarooFeetY - KANGAROO_SIZE * 0.4;
          this.triggerHit(kangarooX, hitY);
        }
      }

      // Berhasil melompati rintangan trapesium secara penuh
      if (!obstacle.passed && obstacle.x + obstacle.width < kangarooX) {
        obstacle.passed = true;
        this.score += 10;
        soundEngine.playPoint();
        this.floatingTexts.push({
          text: '+10 LEWAT!',
          x: kangarooX + 20,
          y: groundY - this.airborneY - KANGAROO_SIZE - 10,
          life: 0,
          color: `rgb(${CYAN})`,
        });
      }
    }

    this.obstacles = this.obstacles.filter((obstacle) => obstacle.x > -obstacle.width - 20);

    return { score: this.score, lives: this.lives, gameOver: this.gameOver };
  }

  private drawCyberpunkBackground(ctx: CanvasRenderingContext2D, groundY: number) {
    // Langit cyberpunk
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#060714');
    skyGrad.addColorStop(0.65, '#0e1232');
    skyGrad.addColorStop(0.9, '#220e36');
    skyGrad.addColorStop(1, '#0c081e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, groundY);

    // Bintang
    for (const star of this.stars) {
      ctx.fillStyle = `rgba(232, 236, 255, ${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // Siluet kota cyberpunk
    ctx.fillStyle = 'rgba(12, 16, 38, 0.92)';
    ctx.strokeStyle = `rgba(${MAGENTA}, 0.25)`;
    ctx.lineWidth = 1;

    const bWidths = [50, 40, 75, 55, 35, 65, 80, 45, 60];
    const bHeights = [70, 120, 90, 135, 80, 110, 145, 95, 75];
    let bx = 0;
    let idx = 0;
    while (bx < this.width) {
      const bw = bWidths[idx % bWidths.length];
      const bh = bHeights[idx % bHeights.length];
      ctx.fillRect(bx, groundY - bh, bw, bh);
      ctx.strokeRect(bx, groundY - bh, bw, bh);

      ctx.fillStyle = idx % 2 === 0 ? `rgba(${MAGENTA}, 0.35)` : `rgba(${CYAN}, 0.35)`;
      for (let wy = groundY - bh + 14; wy < groundY - 10; wy += 18) {
        ctx.fillRect(bx + 6, wy, 4, 6);
        ctx.fillRect(bx + bw - 10, wy, 4, 6);
      }
      ctx.fillStyle = 'rgba(12, 16, 38, 0.92)';

      bx += bw + 6;
      idx++;
    }

    // Horizon line
    ctx.strokeStyle = `rgba(${CYAN}, 0.8)`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `rgba(${CYAN}, 0.9)`;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Lantai grid
    const floorH = this.height - groundY;
    ctx.fillStyle = 'rgba(6, 7, 18, 0.96)';
    ctx.fillRect(0, groundY, this.width, floorH);

    ctx.strokeStyle = `rgba(${MAGENTA}, 0.35)`;
    ctx.lineWidth = 1;
    for (let gy = groundY; gy < this.height; gy += 14) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(this.width, gy);
      ctx.stroke();
    }
    for (let gx = -40 + this.gridOffset; gx < this.width + 40; gx += 35) {
      ctx.beginPath();
      ctx.moveTo(gx, groundY);
      ctx.lineTo(gx - 25, this.height);
      ctx.stroke();
    }
  }

  private drawTrapezoid(ctx: CanvasRenderingContext2D, obstacle: TrapezoidObstacle, groundY: number) {
    const { x, width, topWidth, height } = obstacle;
    const ramp = (width - topWidth) / 2;
    const topY = groundY - height;

    ctx.save();
    ctx.shadowColor = `rgba(${MAGENTA}, 0.8)`;
    ctx.shadowBlur = 14;

    // 1. Gradasi badan trapesium
    const trapGrad = ctx.createLinearGradient(x, topY, x, groundY);
    trapGrad.addColorStop(0, 'rgba(45, 12, 54, 0.95)');
    trapGrad.addColorStop(1, 'rgba(14, 8, 26, 0.95)');
    ctx.fillStyle = trapGrad;

    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x + ramp, topY);
    ctx.lineTo(x + width - ramp, topY);
    ctx.lineTo(x + width, groundY);
    ctx.closePath();
    ctx.fill();

    // 2. Garis tepi neon bercahaya
    ctx.strokeStyle = `rgba(${MAGENTA}, 0.95)`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Garis puncak platform datar (Cyan menyala terang)
    ctx.strokeStyle = `rgba(${CYAN}, 0.95)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + ramp, topY);
    ctx.lineTo(x + width - ramp, topY);
    ctx.stroke();

    // 3. Pola garis hazard chevron pada badan trapesium
    ctx.strokeStyle = 'rgba(255, 61, 154, 0.35)';
    ctx.lineWidth = 2;
    for (let hx = x + 20; hx < x + width - 20; hx += 28) {
      ctx.beginPath();
      ctx.moveTo(hx, groundY);
      ctx.lineTo(hx + 18, topY + 6);
      ctx.stroke();
    }

    // 4. Label teks petunjuk di tengah rintangan: ▲ TAHAN BARBEL DI ATAS ▲
    ctx.fillStyle = `rgba(${YELLOW}, 0.9)`;
    ctx.font = 'bold 11px var(--font-mono)';
    ctx.textAlign = 'center';
    ctx.fillText('▲ TAHAN BARBEL DI ATAS ▲', x + width / 2, topY + height * 0.58);
    ctx.textAlign = 'start';

    ctx.restore();
  }

  private drawKangaroo(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
    let isHitFlashing = false;
    let alpha = 1;

    if (this.invulnerable > 0) {
      const step = Math.floor(this.invulnerable * 14) % 3;
      if (step === 0) alpha = 0.2;
      else if (step === 1) {
        isHitFlashing = true;
        alpha = 1;
      } else alpha = 0.65;
    }

    const y = groundY - this.airborneY;
    const bodyColor = isHitFlashing ? `rgb(${RED})` : `rgba(${MAGENTA}, 0.95)`;
    const bodyDark = isHitFlashing ? `rgb(190, 20, 45)` : `rgba(180, 20, 95, 0.95)`;
    const cyberColor = isHitFlashing ? 'rgb(255, 255, 255)' : `rgba(${CYAN}, 0.95)`;

    const hop = this.grounded ? Math.sin(this.runPhase) * 4 : 0;
    const isJumping = !this.grounded;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y + hop);

    ctx.shadowColor = isHitFlashing ? `rgba(${RED}, 0.9)` : `rgba(${MAGENTA}, 0.75)`;
    ctx.shadowBlur = isHitFlashing ? 24 : 14;

    // 1. Ekor Panjang Kangguru (Balance Tail)
    const tailWave = isJumping ? -0.2 : Math.sin(this.runPhase * 0.8) * 0.15;
    ctx.save();
    ctx.translate(-KANGAROO_SIZE * 0.25, -KANGAROO_SIZE * 0.22);
    ctx.rotate(tailWave);
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(-KANGAROO_SIZE * 0.35, KANGAROO_SIZE * 0.12, KANGAROO_SIZE * 0.32, 6, -0.35, 0, Math.PI * 2);
    ctx.fill();
    // Ujung ekor neon cyan
    ctx.fillStyle = cyberColor;
    ctx.beginPath();
    ctx.arc(-KANGAROO_SIZE * 0.65, KANGAROO_SIZE * 0.22, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Kaki Belakang Kuat (Hind Legs)
    ctx.save();
    const legBend = isJumping ? 0.35 : Math.sin(this.runPhase) * 0.4;
    ctx.translate(0, -KANGAROO_SIZE * 0.25);
    ctx.rotate(legBend);

    // Paha berotot
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.ellipse(-KANGAROO_SIZE * 0.08, KANGAROO_SIZE * 0.1, KANGAROO_SIZE * 0.16, KANGAROO_SIZE * 0.12, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Betis & Kaki Panjang Melompat
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-KANGAROO_SIZE * 0.05, KANGAROO_SIZE * 0.14, 8, KANGAROO_SIZE * 0.22, 3);
    ctx.fill();

    // Telapak Kaki Kangguru
    ctx.fillStyle = cyberColor;
    ctx.fillRect(-KANGAROO_SIZE * 0.06, KANGAROO_SIZE * 0.32, KANGAROO_SIZE * 0.26, 6);
    ctx.restore();

    // 3. Badan & Kantong Kangguru
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -KANGAROO_SIZE * 0.38, KANGAROO_SIZE * 0.24, KANGAROO_SIZE * 0.32, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Kantong dengan Cyber Battery Core
    ctx.fillStyle = 'rgba(20, 10, 35, 0.85)';
    ctx.beginPath();
    ctx.arc(KANGAROO_SIZE * 0.08, -KANGAROO_SIZE * 0.32, 10, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = cyberColor;
    ctx.fillRect(KANGAROO_SIZE * 0.04, -KANGAROO_SIZE * 0.35, 8, 4);

    // 4. Leher & Kepala Kangguru
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(KANGAROO_SIZE * 0.12, -KANGAROO_SIZE * 0.62, KANGAROO_SIZE * 0.14, KANGAROO_SIZE * 0.18, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Moncong / Hidung
    ctx.beginPath();
    ctx.ellipse(KANGAROO_SIZE * 0.26, -KANGAROO_SIZE * 0.68, KANGAROO_SIZE * 0.12, KANGAROO_SIZE * 0.09, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#110518';
    ctx.beginPath();
    ctx.arc(KANGAROO_SIZE * 0.34, -KANGAROO_SIZE * 0.69, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Mata Visor Cyber
    ctx.fillStyle = cyberColor;
    ctx.beginPath();
    ctx.roundRect(KANGAROO_SIZE * 0.18, -KANGAROO_SIZE * 0.74, 8, 5, 2);
    ctx.fill();

    // Telinga Kangguru Panjang yang Lentur (Perky Ears)
    const earFlutter = Math.sin(this.runPhase * 1.5) * 0.1;
    ctx.save();
    ctx.translate(KANGAROO_SIZE * 0.06, -KANGAROO_SIZE * 0.75);
    ctx.rotate(-0.25 + earFlutter);
    ctx.fillStyle = bodyColor;
    // Telinga kiri & kanan
    ctx.beginPath();
    ctx.ellipse(0, -KANGAROO_SIZE * 0.2, 5, KANGAROO_SIZE * 0.18, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cyberColor;
    ctx.beginPath();
    ctx.ellipse(KANGAROO_SIZE * 0.08, -KANGAROO_SIZE * 0.18, 4, KANGAROO_SIZE * 0.16, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. ANIMASI BARBEL (Angkat Barbel)
    // Saat di bawah: barbel dipegang di dada (front rack)
    // Saat melompat/tangan naik: barbel DIANGKAT TINGGI KE ATAS KEPALA (overhead press)
    const liftProgress = Math.min(Math.max(this.airborneY / (this.height * 0.32), 0), 1);
    const barbellY = -KANGAROO_SIZE * 0.45 - liftProgress * (KANGAROO_SIZE * 0.55);
    const barbellX = KANGAROO_SIZE * 0.12;

    // Lengan kangguru memegang barbel
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(KANGAROO_SIZE * 0.04, -KANGAROO_SIZE * 0.45); // bahu
    ctx.lineTo(barbellX, barbellY); // telapak tangan ke barbel
    ctx.stroke();

    // Gagang Besi Barbel (Barbell Shaft)
    ctx.strokeStyle = '#d8e4f0';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(barbellX - 22, barbellY);
    ctx.lineTo(barbellX + 22, barbellY);
    ctx.stroke();

    // Piringan Beban Barbel (Cyber Weight Plates) di Kiri & Kanan
    const drawPlate = (px: number) => {
      // Plat beban heksagonal / cakram neon
      ctx.fillStyle = isJumping ? `rgb(${CYAN})` : `rgb(${MAGENTA})`;
      ctx.shadowColor = isJumping ? `rgba(${CYAN}, 0.95)` : `rgba(${MAGENTA}, 0.8)`;
      ctx.shadowBlur = isJumping ? 16 : 8;
      ctx.fillRect(px - 4, barbellY - 14, 8, 28);

      // Plat luar lebih kecil
      ctx.fillStyle = `rgb(${YELLOW})`;
      ctx.fillRect(px - (px > barbellX ? 1 : 7), barbellY - 10, 6, 20);
    };

    drawPlate(barbellX - 20);
    drawPlate(barbellX + 20);

    // Efek kilau energi jika sedang diangkat overhead
    if (isJumping && liftProgress > 0.6) {
      ctx.fillStyle = '#ffffff';
      const sparkCount = 3;
      for (let s = 0; s < sparkCount; s++) {
        const sx = barbellX + (Math.random() - 0.5) * 44;
        const sy = barbellY + (Math.random() - 0.5) * 16;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.width === 0) return;

    ctx.save();

    // Screen Shake saat kena hantaman
    if (this.screenShake > 0) {
      const intensity = (this.screenShake / 0.4) * 10;
      const shakeX = (Math.random() - 0.5) * intensity;
      const shakeY = (Math.random() - 0.5) * intensity;
      ctx.translate(shakeX, shakeY);
    }

    const groundY = this.height * 0.90;

    // 1. Background Cyberpunk
    this.drawCyberpunkBackground(ctx, groundY);

    // 2. Rintangan Trapesium Panjang
    for (const obstacle of this.obstacles) {
      this.drawTrapezoid(ctx, obstacle, groundY);
    }

    // 3. Karakter Kangguru & Barbel
    this.drawKangaroo(ctx, this.width * KANGAROO_X_RATIO, groundY);

    // 4. Percikan Hantaman
    for (const spark of this.sparks) {
      const progress = spark.life / spark.maxLife;
      ctx.fillStyle = spark.color.startsWith('rgb') ? spark.color : `rgba(${spark.color}, ${1 - progress})`;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, 2.5 * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Floating texts
    ctx.font = 'bold 15px var(--font-mono)';
    for (const ft of this.floatingTexts) {
      const alpha = 1 - ft.life / 0.9;
      ctx.fillStyle = ft.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
  }
}
