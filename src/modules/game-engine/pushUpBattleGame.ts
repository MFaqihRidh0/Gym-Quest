import { soundEngine } from './audio';

export interface FighterState {
  name: string;
  avatar: string;
  color: string;
  glowColor: string;
  auraColor: string;
  maxHp: number;
  hp: number;
  reps: number;
  combo: number;
  lastRepTime: number;
  action: 'idle' | 'charging' | 'kamehameha' | 'hit';
  actionTimer: number;
  kiEnergy: number; // 0 to 100
  x: number;
  y: number;
}

export interface KamehamehaBeam {
  id: string;
  attacker: 'p1' | 'p2';
  startX: number;
  startY: number;
  targetX: number;
  progress: number; // 0 to 1
  thickness: number;
  color: string;
  glowColor: string;
  power: number;
  life: number;
  maxLife: number;
}

export interface AttackParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  isSparks?: boolean;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
}

export class PushUpBattleGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private lastTime = 0;

  // Fighters
  public player1: FighterState;
  public player2: FighterState;

  // Kamehameha Beams
  private activeBeams: KamehamehaBeam[] = [];

  // Effects
  private particles: AttackParticle[] = [];
  private floatingTexts: FloatingText[] = [];
  private screenShake = 0;
  private animPhase = 0;

  // Match State
  public matchDuration = 60; // 60 seconds
  public timeRemaining = 60;
  public targetReps = 15; // 10 untuk Easy, 15 untuk Medium, 20 untuk Hard
  public isGameOver = false;
  public winner: 'p1' | 'p2' | 'draw' | null = null;

  // Callbacks
  public onGameOver?: (winner: 'p1' | 'p2' | 'draw', p1Reps: number, p2Reps: number) => void;

  constructor(canvas: HTMLCanvasElement, p1Name = 'Player 1', p2Name = 'Player 2', targetReps = 15) {
    this.canvas = canvas;
    this.targetReps = targetReps;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Cannot get 2D context');
    this.ctx = context;

    this.player1 = {
      name: p1Name,
      avatar: '⚡',
      color: '#00e5ff',
      glowColor: 'rgba(0, 229, 255, 0.8)',
      auraColor: 'rgba(0, 229, 255, 0.45)',
      maxHp: 100,
      hp: 100,
      reps: 0,
      combo: 0,
      lastRepTime: 0,
      action: 'idle',
      actionTimer: 0,
      kiEnergy: 20,
      x: 160,
      y: 250,
    };

    this.player2 = {
      name: p2Name,
      avatar: '🔥',
      color: '#ff007a',
      glowColor: 'rgba(255, 0, 122, 0.8)',
      auraColor: 'rgba(255, 0, 122, 0.45)',
      maxHp: 100,
      hp: 100,
      reps: 0,
      combo: 0,
      lastRepTime: 0,
      action: 'idle',
      actionTimer: 0,
      kiEnergy: 20,
      x: 640,
      y: 250,
    };
  }

  public start() {
    this.isGameOver = false;
    this.winner = null;
    this.timeRemaining = this.matchDuration;
    this.player1.hp = this.player1.maxHp;
    this.player2.hp = this.player2.maxHp;
    this.player1.reps = 0;
    this.player2.reps = 0;
    this.player1.kiEnergy = 30;
    this.player2.kiEnergy = 30;
    this.activeBeams = [];
    this.particles = [];
    this.floatingTexts = [];
    this.lastTime = performance.now();
    soundEngine.playCountdownTick();
    this.loop(this.lastTime);
  }

  public stop() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  /**
   * Memicu charging Ki saat push-up posisi bawah (kontraksi)
   */
  public triggerKiCharge(fighterKey: 'p1' | 'p2') {
    if (this.isGameOver) return;
    const fighter = fighterKey === 'p1' ? this.player1 : this.player2;
    fighter.action = 'charging';
    fighter.actionTimer = 20;
    fighter.kiEnergy = Math.min(100, fighter.kiEnergy + 8);

    // Spawn suction particles converging on fighter's hands
    const handX = fighter.x + (fighterKey === 'p1' ? 25 : -25);
    const handY = fighter.y - 5;
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 60 + 40;
      this.particles.push({
        x: handX + Math.cos(angle) * dist,
        y: handY + Math.sin(angle) * dist,
        vx: -Math.cos(angle) * 3,
        vy: -Math.sin(angle) * 3,
        color: '#ffffff',
        size: Math.random() * 3 + 2,
        life: 1,
        maxLife: 20,
      });
    }
  }

  /**
   * Memicu tembakan gelombang energi KAMEHAMEHA saat 1 repetisi push-up selesai
   */
  public triggerRepAttack(attacker: 'p1' | 'p2') {
    if (this.isGameOver) return;

    const now = performance.now();
    const isP1 = attacker === 'p1';
    const active = isP1 ? this.player1 : this.player2;
    const target = isP1 ? this.player2 : this.player1;

    active.reps += 1;

    // Combo multiplier jika push-up dilakukan cepat (< 3.5 detik)
    if (now - active.lastRepTime < 3500) {
      active.combo += 1;
    } else {
      active.combo = 1;
    }
    active.lastRepTime = now;

    // Hitung damage dan lifesteal/penambahan darah sendiri saat menyerang
    const baseDamage = 8;
    const comboBonus = Math.min(Math.round(active.combo * 1.5), 6);
    const totalDamage = baseDamage + comboBonus;

    // Tambah darah sendiri (+4 s.d. +8 HP) agar duel lebih tahan lama dan seru saling tarik-ulur
    const healAmount = Math.min(Math.round(4 + active.combo * 1.2), 8);
    active.hp = Math.min(active.maxHp, active.hp + healAmount);

    // Set animation states
    active.action = 'kamehameha';
    active.actionTimer = 35;
    active.kiEnergy = Math.min(100, active.kiEnergy + 25);

    target.action = 'hit';
    target.actionTimer = 30;
    target.hp = Math.max(0, target.hp - totalDamage);

    // Audio & Screen Shake
    soundEngine.playHit();
    this.screenShake = 16 + Math.min(active.combo * 2, 12);

    // Create Kamehameha Beam
    const startX = active.x + (isP1 ? 30 : -30);
    const startY = active.y - 10;
    const targetX = target.x + (isP1 ? -15 : 15);

    const beamThickness = 28 + Math.min(active.combo * 6, 32);

    this.activeBeams.push({
      id: `beam-${Date.now()}-${Math.random()}`,
      attacker,
      startX,
      startY,
      targetX,
      progress: 0,
      thickness: beamThickness,
      color: active.color,
      glowColor: active.glowColor,
      power: totalDamage,
      life: 1,
      maxLife: 30, // frames
    });

    // Spawn floating damage text, anime shout & floating HEAL text
    let shoutWord = '';
    if (isP1) {
      if (active.combo >= 4) shoutWord = '>>> x10 KAIO-KEN KAMEHAMEHA! <<<';
      else if (active.combo >= 2) shoutWord = '>> SUPER KAMEHAMEHA! <<';
      else shoutWord = '> KA-ME-HA-ME-HA! <';
    } else {
      if (active.combo >= 4) shoutWord = '>>> MAXIMUM FINAL FLASH! <<<';
      else if (active.combo >= 2) shoutWord = '>> SUPER FINAL FLASH! <<';
      else shoutWord = '> GALICK GUN! <';
    }

    this.spawnFloatingText(shoutWord, active.x, active.y - 85, '#ffffff', 22);
    this.spawnFloatingText(`+${healAmount} HP`, active.x, active.y - 110, '#34d399', 24);
    this.spawnFloatingText(`-${totalDamage} HP`, target.x, target.y - 65, target.color, 26);

    if (active.combo > 1) {
      this.spawnFloatingText(`COMBO x${active.combo}!`, active.x, active.y - 135, active.color, 20);
    }

    // Spawn massive burst particles & shockwave
    const dir = isP1 ? 1 : -1;
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: target.x,
        y: target.y - 10 + (Math.random() * 60 - 30),
        vx: dir * (Math.random() * 10 + 4) + (Math.random() * 6 - 3),
        vy: Math.random() * 14 - 7,
        color: Math.random() < 0.4 ? '#ffffff' : active.color,
        size: Math.random() * 7 + 3,
        life: 1,
        maxLife: Math.random() * 25 + 15,
        isSparks: true,
      });
    }

    // Check Knockout (KO): Hanya terjadi jika HP salah satu pemain habis total (0)
    if (target.hp <= 0) {
      target.hp = 0;
      this.endGame(isP1 ? 'p1' : 'p2');
    }
  }

  private spawnFloatingText(text: string, x: number, y: number, color: string, size: number) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      size,
      life: 1.0,
    });
  }

  private endGame(winner: 'p1' | 'p2' | 'draw') {
    this.isGameOver = true;
    this.winner = winner;
    soundEngine.playLevelUp();
    if (this.onGameOver) {
      this.onGameOver(winner, this.player1.reps, this.player2.reps);
    }
  }

  private loop = (now: number) => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.animPhase += dt * 6;

    if (!this.isGameOver) {
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
      if (this.timeRemaining <= 0) {
        if (this.player1.hp > this.player2.hp) {
          this.endGame('p1');
        } else if (this.player2.hp > this.player1.hp) {
          this.endGame('p2');
        } else {
          this.endGame('draw');
        }
      }
    }

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.86;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    // Fighter actions decay
    if (this.player1.actionTimer > 0) {
      this.player1.actionTimer--;
      if (this.player1.actionTimer === 0) this.player1.action = 'idle';
    }
    if (this.player2.actionTimer > 0) {
      this.player2.actionTimer--;
      if (this.player2.actionTimer === 0) this.player2.action = 'idle';
    }

    // Update active Kamehameha beams
    for (let i = this.activeBeams.length - 1; i >= 0; i--) {
      const beam = this.activeBeams[i];
      beam.progress = Math.min(1, beam.progress + 0.14);
      beam.life -= 1 / beam.maxLife;

      // Spawn lightning sparks along beam
      if (Math.random() < 0.6) {
        const currentX = beam.startX + (beam.targetX - beam.startX) * beam.progress * Math.random();
        this.particles.push({
          x: currentX,
          y: beam.startY + (Math.random() * 20 - 10),
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 6 - 3,
          color: '#ffffff',
          size: Math.random() * 4 + 2,
          life: 1,
          maxLife: 10,
          isSparks: true,
        });
      }

      if (beam.life <= 0) {
        this.activeBeams.splice(i, 1);
      }
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.3;
      ft.life -= 0.024;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.save();

    // Screen shake
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Clear background (Cyberpunk Tenkaichi Budokai Arena)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#040714');
    bgGrad.addColorStop(0.5, '#0a1233');
    bgGrad.addColorStop(1, '#03050c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Floor Platform
    const floorY = 310;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, floorY, w - 80, 50);

    // Platform Neon Rim
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, floorY, w - 80, 50);

    // Floor Perspective Lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
    for (let x = 60; x < w - 60; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x, floorY + 50);
      ctx.stroke();
    }

    // 2. Draw Active Kamehameha Beams & Beam Clash
    this.renderKamehamehaBeams();

    // 3. Draw Particles & Sparks
    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.isSparks ? 12 : 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * Math.max(0, p.life), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // 4. Draw Fighters with Super Saiyan Ki Aura
    this.drawFighter(this.player1, true);
    this.drawFighter(this.player2, false);

    // 5. Draw HUD (HP Bars & Match Timer)
    this.drawHud();

    // 6. Draw Floating Texts
    this.floatingTexts.forEach((ft) => {
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.font = `bold ${ft.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.globalAlpha = 1.0;
    });
    ctx.shadowBlur = 0;

    // 7. Game Over Screen
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = 'center';
      ctx.font = 'bold 52px sans-serif';
      ctx.shadowBlur = 30;

      if (this.winner === 'p1') {
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.fillText('⚡ PLAYER 1 KAMEHAMEHA K.O.! 🏆', w / 2, h / 2 - 20);
      } else if (this.winner === 'p2') {
        ctx.fillStyle = '#ff007a';
        ctx.shadowColor = '#ff007a';
        ctx.fillText('🔥 PLAYER 2 KAMEHAMEHA K.O.! 🏆', w / 2, h / 2 - 20);
      } else {
        ctx.fillStyle = '#ffd600';
        ctx.shadowColor = '#ffd600';
        ctx.fillText('⚡ BENTURAN IMBANG (DRAW)! ⚡', w / 2, h / 2 - 20);
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(
        `Skor Repetisi Push-up: ${this.player1.reps} vs ${this.player2.reps}`,
        w / 2,
        h / 2 + 35,
      );
    }

    ctx.restore();
  }

  /**
   * Menggambar gelombang energi KAMEHAMEHA spektakuler ala Dragon Ball
   */
  private renderKamehamehaBeams() {
    const ctx = this.ctx;

    // Periksa apakah terjadi BEAM CLASH (kedua pemain sama-sama menembakkan laser!)
    const p1Beam = this.activeBeams.find((b) => b.attacker === 'p1');
    const p2Beam = this.activeBeams.find((b) => b.attacker === 'p2');

    const isBeamClash = Boolean(p1Beam && p2Beam);
    const clashX = this.canvas.width / 2 + (this.player1.reps - this.player2.reps) * 15;

    this.activeBeams.forEach((beam) => {
      ctx.save();

      const dir = beam.attacker === 'p1' ? 1 : -1;
      const targetX = isBeamClash ? clashX : beam.targetX;
      const currentX = beam.startX + (targetX - beam.startX) * beam.progress;
      const beamLength = currentX - beam.startX;

      // Outer Ki Flare Cylinder
      const outerGrad = ctx.createLinearGradient(0, beam.startY - beam.thickness, 0, beam.startY + beam.thickness);
      outerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      outerGrad.addColorStop(0.3, beam.glowColor);
      outerGrad.addColorStop(0.5, '#ffffff');
      outerGrad.addColorStop(0.7, beam.glowColor);
      outerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.shadowColor = beam.color;
      ctx.shadowBlur = 35;
      ctx.fillStyle = outerGrad;
      ctx.fillRect(beam.startX, beam.startY - beam.thickness / 2, beamLength, beam.thickness);

      // Inner White-Hot Plasma Core
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(beam.startX, beam.startY - beam.thickness / 5, beamLength, beam.thickness / 2.5);

      // Double-Helix Spiral Energy Ribbons (Pusaran Ki ala Anime)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const waveCount = 20;
      for (let step = 0; step < waveCount; step++) {
        const wx = beam.startX + (beamLength / waveCount) * step;
        const wy = beam.startY + Math.sin(this.animPhase * 3 + step * 0.8) * (beam.thickness * 0.45);
        if (step === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Giant Kamehameha Leading Sphere (Kepala Gelombang)
      ctx.shadowBlur = 45;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(currentX, beam.startY, beam.thickness * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // Outer Ring Shockwave
      ctx.strokeStyle = beam.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(currentX, beam.startY, beam.thickness * 1.25, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });

    // Jika terjadi Beam Clash: Gambar bola tabrakan energi dahsyat di tengah
    if (isBeamClash) {
      ctx.save();
      const clashY = 240;

      // Clash Sphere Flash
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 50;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(clashX, clashY, 45 + Math.sin(this.animPhase * 8) * 8, 0, Math.PI * 2);
      ctx.fill();

      // Expanding Shockwave Rings
      ctx.strokeStyle = '#ffd600';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(clashX, clashY, 65 + Math.cos(this.animPhase * 6) * 10, 0, Math.PI * 2);
      ctx.stroke();

      // Floating Clash Text
      ctx.fillStyle = '#ffd600';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ BEAM CLASH! ⚡', clashX, clashY - 60);

      ctx.restore();
    }
  }

  /**
   * Menggambar petarung dengan efek Super Saiyan Ki Aura menyala-nyala
   */
  private drawFighter(fighter: FighterState, isP1: boolean) {
    const ctx = this.ctx;
    const x = fighter.x;
    const y = fighter.y;
    const dir = isP1 ? 1 : -1;

    ctx.save();
    ctx.translate(x, y);

    // Floor Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 55, 42, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. SUPER SAIYAN KI AURA (Flames of Energy)
    ctx.save();
    const auraPulse = Math.sin(this.animPhase * 4) * 6;
    const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 65 + auraPulse);
    auraGrad.addColorStop(0, fighter.color);
    auraGrad.addColorStop(0.6, fighter.auraColor);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -5, 60 + auraPulse, 0, Math.PI * 2);
    ctx.fill();

    // Electric Lightning Sparks around aura
    if (fighter.action === 'kamehameha' || fighter.action === 'charging') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let s = 0; s < 3; s++) {
        const lx1 = (Math.random() - 0.5) * 60;
        const ly1 = (Math.random() - 0.5) * 60;
        const lx2 = lx1 + (Math.random() - 0.5) * 25;
        const ly2 = ly1 + (Math.random() - 0.5) * 25;
        ctx.beginPath();
        ctx.moveTo(lx1, ly1);
        ctx.lineTo(lx2, ly2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Body Animation Offset based on action
    let bodyOffset = 0;
    let armPose: 'idle' | 'cupped' | 'thrust' = 'idle';

    if (fighter.action === 'kamehameha') {
      armPose = 'thrust';
      bodyOffset = dir * 16;
    } else if (fighter.action === 'charging') {
      armPose = 'cupped';
      bodyOffset = -dir * 12;
    } else if (fighter.action === 'hit') {
      bodyOffset = -dir * 22;
    }

    ctx.translate(bodyOffset, 0);

    // 2. CHARACTER BODY (Dragon Ball Warrior Silhouette)
    // Gi Pants (Navy/Dark slate)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, 25, 12, 28);
    ctx.fillRect(4, 25, 12, 28);

    // Boots
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-18, 48, 14, 8);
    ctx.fillRect(4, 48, 14, 8);

    // Torso / Warrior Gi
    ctx.fillStyle = fighter.color;
    ctx.shadowColor = fighter.glowColor;
    ctx.shadowBlur = fighter.action === 'kamehameha' ? 30 : 15;
    ctx.fillRect(-20, -25, 40, 52);

    // Belt Sash
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-22, 18, 44, 8);

    // Head
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-15, -55, 30, 26);

    // Spiky Super Saiyan Hair!
    ctx.fillStyle = fighter.color;
    ctx.beginPath();
    ctx.moveTo(-20, -50);
    ctx.lineTo(-30, -75);
    ctx.lineTo(-12, -60);
    ctx.lineTo(0, -85);
    ctx.lineTo(12, -60);
    ctx.lineTo(30, -75);
    ctx.lineTo(20, -50);
    ctx.closePath();
    ctx.fill();

    // Glowing Eyes / Visor
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(dir * 4 - 3, -46, 12, 6);

    // 3. ARMS & KAMEHAMEHA STANCE
    if (armPose === 'thrust') {
      // Thrusting both arms forward launching beam!
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dir * 18, -16, 28 * dir, 14);
      ctx.fillRect(dir * 18, -2, 28 * dir, 14);
    } else if (armPose === 'cupped') {
      // Cupping hands at hip gathering Ki ball
      ctx.fillStyle = fighter.color;
      ctx.fillRect(-dir * 18, 5, 20 * dir, 14);

      // Ki Gathering Orb between hands
      const chargePulse = Math.sin(this.animPhase * 8) * 4;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-dir * 24, 12, 12 + chargePulse, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Idle arms
      ctx.fillStyle = fighter.color;
      ctx.fillRect(-16, -15, 10, 28);
      ctx.fillRect(6, -15, 10, 28);
    }

    // Fighter Name Pill
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(fighter.name, 0, -92);

    ctx.restore();
  }

  private drawHud() {
    const ctx = this.ctx;
    const w = this.canvas.width;

    // 1. P1 HP & Ki Bar (Top Left)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(25, 20, 260, 22);
    const p1HpW = Math.max(0, (this.player1.hp / this.player1.maxHp) * 256);
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(27, 22, p1HpW, 18);
    ctx.shadowBlur = 0;

    // P1 Ki Gauge (Small bar underneath)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(25, 45, 180, 8);
    ctx.fillStyle = '#ffd600';
    ctx.fillRect(27, 47, (this.player1.kiEnergy / 100) * 176, 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.player1.name} (HP: ${Math.round(this.player1.hp)})`, 27, 16);
    ctx.fillText(`PUSH-UP: ${this.player1.reps} REPS`, 27, 68);

    // 2. P2 HP & Ki Bar (Top Right)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(w - 285, 20, 260, 22);
    const p2HpW = Math.max(0, (this.player2.hp / this.player2.maxHp) * 256);
    ctx.fillStyle = '#ff007a';
    ctx.shadowColor = '#ff007a';
    ctx.shadowBlur = 12;
    ctx.fillRect(w - 29 - p2HpW, 22, p2HpW, 18);
    ctx.shadowBlur = 0;

    // P2 Ki Gauge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(w - 205, 45, 180, 8);
    ctx.fillStyle = '#ffd600';
    ctx.fillRect(w - 27 - (this.player2.kiEnergy / 100) * 176, 47, (this.player2.kiEnergy / 100) * 176, 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.player2.name} (HP: ${Math.round(this.player2.hp)})`, w - 27, 16);
    ctx.fillText(`PUSH-UP: ${this.player2.reps} REPS`, w - 27, 68);

    // 3. Center Match Timer & Endurance Mode
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(w / 2 - 45, 10, 90, 42, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.timeRemaining <= 10 ? '#ff007a' : '#ffd600';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(this.timeRemaining)}s`, w / 2, 38);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`SURVIVAL DUEL (60S)`, w / 2, 68);
  }
}
