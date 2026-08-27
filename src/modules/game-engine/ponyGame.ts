const OBSTACLE_WIDTH = 64;
const OBSTACLE_GAP_HEIGHT_RATIO = 0.32;
const OBSTACLE_SPEED = 180; // px/detik
const OBSTACLE_INTERVAL = 1.7; // detik antar rintangan
const PONY_SIZE = 44;
const PONY_X_RATIO = 0.22;
const LERP_SPEED = 10; // seberapa cepat kuda mengejar posisi target
const INVULNERABLE_SECONDS = 1.2;

interface Obstacle {
  x: number;
  gapCenter: number; // 0..1 relatif tinggi kanvas
  passed: boolean;
}

export interface PonyGameState {
  score: number;
  lives: number;
  gameOver: boolean;
}

const MAGENTA = '255, 61, 154';
const CYAN = '0, 229, 255';

export class PonyGame {
  private width = 0;
  private height = 0;
  private ponyY = 0.5;
  private ponyDrawY = 0.5;
  private obstacles: Obstacle[] = [];
  private timeSinceSpawn = 0;
  private invulnerable = 0;
  private bobPhase = 0;

  score = 0;
  lives = 3;
  gameOver = false;

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  reset() {
    this.obstacles = [];
    this.timeSinceSpawn = 0;
    this.invulnerable = 0;
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.ponyY = 0.5;
    this.ponyDrawY = 0.5;
  }

  private spawnObstacle() {
    const margin = OBSTACLE_GAP_HEIGHT_RATIO / 2 + 0.1;
    const gapCenter = margin + Math.random() * (1 - margin * 2);
    this.obstacles.push({ x: this.width + OBSTACLE_WIDTH, gapCenter, passed: false });
  }

  /** @param control posisi target 0 (bawah) - 1 (atas), null jika tubuh tak terdeteksi. */
  update(dt: number, control: number | null): PonyGameState {
    if (this.gameOver || this.width === 0) {
      return { score: this.score, lives: this.lives, gameOver: this.gameOver };
    }

    this.bobPhase += dt * 4;
    if (control !== null) this.ponyY = control;
    this.ponyDrawY += (this.ponyY - this.ponyDrawY) * Math.min(1, dt * LERP_SPEED);
    this.invulnerable = Math.max(0, this.invulnerable - dt);

    this.timeSinceSpawn += dt;
    if (this.timeSinceSpawn >= OBSTACLE_INTERVAL) {
      this.timeSinceSpawn = 0;
      this.spawnObstacle();
    }

    const ponyX = this.width * PONY_X_RATIO;
    const ponyScreenY = (1 - this.ponyDrawY) * this.height;
    const gapHeightPx = this.height * OBSTACLE_GAP_HEIGHT_RATIO;

    for (const obstacle of this.obstacles) {
      obstacle.x -= OBSTACLE_SPEED * dt;

      const gapCenterPx = obstacle.gapCenter * this.height;
      const overlapsX =
        ponyX + PONY_SIZE / 2 > obstacle.x && ponyX - PONY_SIZE / 2 < obstacle.x + OBSTACLE_WIDTH;
      const withinGap =
        ponyScreenY - PONY_SIZE / 2 > gapCenterPx - gapHeightPx / 2 &&
        ponyScreenY + PONY_SIZE / 2 < gapCenterPx + gapHeightPx / 2;

      if (overlapsX && !withinGap && this.invulnerable <= 0) {
        this.lives -= 1;
        this.invulnerable = INVULNERABLE_SECONDS;
        if (this.lives <= 0) this.gameOver = true;
      }

      if (!obstacle.passed && obstacle.x + OBSTACLE_WIDTH < ponyX) {
        obstacle.passed = true;
        this.score += 1;
      }
    }

    this.obstacles = this.obstacles.filter((obstacle) => obstacle.x > -OBSTACLE_WIDTH);

    return { score: this.score, lives: this.lives, gameOver: this.gameOver };
  }

  private drawPony(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const flicker = this.invulnerable > 0 && Math.floor(this.invulnerable * 10) % 2 === 0;
    const alpha = flicker ? 0.35 : 1;
    const bob = Math.sin(this.bobPhase) * 3;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y + bob);
    ctx.shadowColor = `rgba(${MAGENTA}, 0.6)`;
    ctx.shadowBlur = 18;
    ctx.fillStyle = `rgba(${MAGENTA}, 0.9)`;

    // Badan
    ctx.beginPath();
    ctx.ellipse(0, 4, PONY_SIZE * 0.5, PONY_SIZE * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kepala
    ctx.beginPath();
    ctx.ellipse(
      PONY_SIZE * 0.38,
      -PONY_SIZE * 0.16,
      PONY_SIZE * 0.24,
      PONY_SIZE * 0.2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Telinga
    ctx.beginPath();
    ctx.moveTo(PONY_SIZE * 0.3, -PONY_SIZE * 0.32);
    ctx.lineTo(PONY_SIZE * 0.38, -PONY_SIZE * 0.48);
    ctx.lineTo(PONY_SIZE * 0.46, -PONY_SIZE * 0.3);
    ctx.closePath();
    ctx.fill();

    // Surai
    ctx.fillStyle = `rgba(${CYAN}, 0.85)`;
    ctx.beginPath();
    ctx.ellipse(
      PONY_SIZE * 0.1,
      -PONY_SIZE * 0.22,
      PONY_SIZE * 0.22,
      PONY_SIZE * 0.12,
      -0.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Kaki
    ctx.fillStyle = `rgba(${MAGENTA}, 0.9)`;
    for (const legX of [-PONY_SIZE * 0.28, -PONY_SIZE * 0.05, PONY_SIZE * 0.18]) {
      ctx.fillRect(legX, PONY_SIZE * 0.24, 5, PONY_SIZE * 0.26);
    }

    // Ekor
    ctx.fillStyle = `rgba(${CYAN}, 0.85)`;
    ctx.beginPath();
    ctx.ellipse(-PONY_SIZE * 0.46, 0, PONY_SIZE * 0.14, PONY_SIZE * 0.22, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
    if (this.width === 0) return;

    const gapHeightPx = this.height * OBSTACLE_GAP_HEIGHT_RATIO;

    for (const obstacle of this.obstacles) {
      const gapCenterPx = obstacle.gapCenter * this.height;
      const topHeight = gapCenterPx - gapHeightPx / 2;
      const bottomY = gapCenterPx + gapHeightPx / 2;

      ctx.fillStyle = `rgba(${MAGENTA}, 0.22)`;
      ctx.strokeStyle = `rgba(${MAGENTA}, 0.9)`;
      ctx.lineWidth = 2;
      ctx.shadowColor = `rgba(${MAGENTA}, 0.5)`;
      ctx.shadowBlur = 10;

      ctx.fillRect(obstacle.x, 0, OBSTACLE_WIDTH, topHeight);
      ctx.strokeRect(obstacle.x, 0, OBSTACLE_WIDTH, topHeight);

      ctx.fillRect(obstacle.x, bottomY, OBSTACLE_WIDTH, this.height - bottomY);
      ctx.strokeRect(obstacle.x, bottomY, OBSTACLE_WIDTH, this.height - bottomY);
    }
    ctx.shadowBlur = 0;

    const ponyX = this.width * PONY_X_RATIO;
    const ponyScreenY = (1 - this.ponyDrawY) * this.height;
    this.drawPony(ctx, ponyX, ponyScreenY);
  }
}
