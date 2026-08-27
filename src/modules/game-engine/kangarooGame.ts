const KANGAROO_X_RATIO = 0.18;
const STAND_HEIGHT_RATIO = 0.16;
const DUCK_HEIGHT_RATIO = STAND_HEIGHT_RATIO * 0.45;
const GROUND_OBSTACLE_HEIGHT_RATIO = 0.14;
const AIR_OBSTACLE_LOW_RATIO = STAND_HEIGHT_RATIO * 0.6;
const AIR_OBSTACLE_BAND_RATIO = 0.12;

const JUMP_HEIGHT_RATIO = 0.32; // seberapa tinggi lompatan relatif tinggi kanvas
const GRAVITY_RATIO = 3.6; // percepatan jatuh, dikalikan tinggi kanvas per detik^2

const START_SPEED = 260; // px/detik
const MAX_SPEED = 620;
const SPEED_RAMP_PER_SECOND = 6; // percepatan dunia seiring waktu bertahan, seperti game dino
const MIN_SPAWN_GAP_SECONDS = 0.9;
const MAX_SPAWN_GAP_SECONDS = 1.8;
const SCORE_PER_SECOND = 8; // skor jarak tempuh, seperti game dino

interface Obstacle {
  x: number;
  type: 'ground' | 'air';
  passed: boolean;
}

export interface KangarooGameState {
  score: number;
  gameOver: boolean;
}

const MAGENTA = '255, 61, 154';
const CYAN = '0, 229, 255';

export class KangarooGame {
  private width = 0;
  private height = 0;

  private airborneY = 0; // tinggi kaki di atas tanah, dalam px
  private velocityY = 0;
  private grounded = true;
  private ducking = false;

  private obstacles: Obstacle[] = [];
  private timeSinceSpawn = 0;
  private nextSpawnGap = MIN_SPAWN_GAP_SECONDS;
  private elapsed = 0;
  private runPhase = 0;

  score = 0;
  gameOver = false;

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  reset() {
    this.airborneY = 0;
    this.velocityY = 0;
    this.grounded = true;
    this.ducking = false;
    this.obstacles = [];
    this.timeSinceSpawn = 0;
    this.nextSpawnGap = MIN_SPAWN_GAP_SECONDS;
    this.elapsed = 0;
    this.score = 0;
    this.gameOver = false;
  }

  private currentSpeed() {
    return Math.min(START_SPEED + this.elapsed * SPEED_RAMP_PER_SECOND, MAX_SPEED);
  }

  private spawnObstacle() {
    const type: Obstacle['type'] = Math.random() < 0.65 ? 'ground' : 'air';
    this.obstacles.push({ x: this.width + 40, type, passed: false });
    const progress = Math.min(this.elapsed / 40, 1);
    this.nextSpawnGap =
      MAX_SPAWN_GAP_SECONDS - (MAX_SPAWN_GAP_SECONDS - MIN_SPAWN_GAP_SECONDS) * progress;
  }

  /**
   * @param jumpTriggered dipicu sesaat setelah satu repetisi squat selesai (fase turun -> naik).
   * @param ducking true selama user berada di posisi jongkok (fase 'down').
   */
  update(dt: number, jumpTriggered: boolean, ducking: boolean): KangarooGameState {
    if (this.gameOver || this.width === 0) {
      return { score: this.score, gameOver: this.gameOver };
    }

    this.elapsed += dt;
    this.runPhase += dt * 8;
    this.score += dt * SCORE_PER_SECOND;

    if (jumpTriggered && this.grounded) {
      const jumpVelocity = Math.sqrt(
        2 * GRAVITY_RATIO * this.height * (JUMP_HEIGHT_RATIO * this.height),
      );
      this.velocityY = jumpVelocity;
      this.grounded = false;
    }

    if (!this.grounded) {
      this.velocityY -= GRAVITY_RATIO * this.height * dt;
      this.airborneY += this.velocityY * dt;
      if (this.airborneY <= 0) {
        this.airborneY = 0;
        this.velocityY = 0;
        this.grounded = true;
      }
    }

    this.ducking = ducking && this.grounded;

    const speed = this.currentSpeed();
    this.timeSinceSpawn += dt;
    if (this.timeSinceSpawn >= this.nextSpawnGap) {
      this.timeSinceSpawn = 0;
      this.spawnObstacle();
    }

    const kangarooX = this.width * KANGAROO_X_RATIO;
    const bodyHeight = (this.ducking ? DUCK_HEIGHT_RATIO : STAND_HEIGHT_RATIO) * this.height;
    const bodyBottom = this.airborneY;
    const bodyTop = bodyBottom + bodyHeight;
    const obstacleWidth = 26;

    const groundTop = GROUND_OBSTACLE_HEIGHT_RATIO * this.height;
    const airLow = AIR_OBSTACLE_LOW_RATIO * this.height;
    const airHigh = airLow + AIR_OBSTACLE_BAND_RATIO * this.height;

    for (const obstacle of this.obstacles) {
      obstacle.x -= speed * dt;

      const overlapsX =
        kangarooX + this.width * 0.02 > obstacle.x &&
        kangarooX - this.width * 0.02 < obstacle.x + obstacleWidth;

      if (overlapsX) {
        const collided =
          obstacle.type === 'ground'
            ? bodyBottom < groundTop
            : bodyBottom < airHigh && bodyTop > airLow;
        if (collided) this.gameOver = true;
      }

      if (!obstacle.passed && obstacle.x + obstacleWidth < kangarooX) {
        obstacle.passed = true;
        this.score += 5;
      }
    }

    this.obstacles = this.obstacles.filter((obstacle) => obstacle.x > -obstacleWidth);

    return { score: this.score, gameOver: this.gameOver };
  }

  private drawKangaroo(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
    const bodyHeight = (this.ducking ? DUCK_HEIGHT_RATIO : STAND_HEIGHT_RATIO) * this.height;
    const y = groundY - this.airborneY - bodyHeight;
    const legKick = this.grounded ? Math.sin(this.runPhase) * 4 : 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = `rgba(${MAGENTA}, 0.6)`;
    ctx.shadowBlur = 16;
    ctx.fillStyle = `rgba(${MAGENTA}, 0.9)`;

    const w = bodyHeight * 0.9;
    const h = bodyHeight;

    // Badan
    ctx.beginPath();
    ctx.ellipse(0, h * 0.55, w * 0.32, h * 0.42, this.ducking ? 0.35 : 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Kepala
    ctx.beginPath();
    ctx.ellipse(w * 0.32, h * (this.ducking ? 0.55 : 0.22), w * 0.2, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Telinga
    ctx.beginPath();
    ctx.moveTo(w * 0.28, h * (this.ducking ? 0.42 : 0.08));
    ctx.lineTo(w * 0.36, h * (this.ducking ? 0.24 : -0.1));
    ctx.lineTo(w * 0.44, h * (this.ducking ? 0.4 : 0.06));
    ctx.closePath();
    ctx.fill();

    // Ekor
    ctx.fillStyle = `rgba(${CYAN}, 0.85)`;
    ctx.beginPath();
    ctx.ellipse(-w * 0.4, h * 0.72, w * 0.12, h * 0.32, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Kaki belakang (kuat, khas kangguru)
    ctx.fillStyle = `rgba(${MAGENTA}, 0.9)`;
    ctx.beginPath();
    ctx.ellipse(w * 0.05 + legKick, h, w * 0.22, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
    if (this.width === 0) return;

    const groundY = this.height * 0.92;

    // Garis tanah
    ctx.strokeStyle = `rgba(${CYAN}, 0.35)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.width, groundY);
    ctx.stroke();

    const groundTop = GROUND_OBSTACLE_HEIGHT_RATIO * this.height;
    const airLow = AIR_OBSTACLE_LOW_RATIO * this.height;
    const airHigh = airLow + AIR_OBSTACLE_BAND_RATIO * this.height;
    const obstacleWidth = 26;

    for (const obstacle of this.obstacles) {
      ctx.shadowColor = `rgba(${MAGENTA}, 0.5)`;
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(${MAGENTA}, 0.85)`;
      ctx.strokeStyle = `rgba(${MAGENTA}, 0.9)`;
      ctx.lineWidth = 2;

      if (obstacle.type === 'ground') {
        // Kristal runcing di tanah
        ctx.beginPath();
        ctx.moveTo(obstacle.x, groundY);
        ctx.lineTo(obstacle.x + obstacleWidth / 2, groundY - groundTop);
        ctx.lineTo(obstacle.x + obstacleWidth, groundY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Orb melayang
        const cy = groundY - (airLow + airHigh) / 2;
        ctx.beginPath();
        ctx.ellipse(
          obstacle.x + obstacleWidth / 2,
          cy,
          obstacleWidth / 2,
          (airHigh - airLow) / 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;

    this.drawKangaroo(ctx, this.width * KANGAROO_X_RATIO, groundY);
  }
}
