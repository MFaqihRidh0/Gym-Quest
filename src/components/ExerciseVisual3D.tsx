'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ExerciseItem } from '@/modules/program-engine/types';
import { useLanguage, type SupportedLanguage } from '@/modules/i18n';
import { IconTarget } from '@/components/ui/CyberIcons';

interface ExerciseVisual3DProps {
  visualKey: ExerciseItem['visualKey'];
  className?: string;
  isAnimated?: boolean;
  showControls?: boolean;
  onAnimationRep?: () => void;
}

const CYAN_HEX = 0x00e5ff;
const MAGENTA_HEX = 0xff3d9a;
const YELLOW_HEX = 0xffd700;
const WHITE_HEX = 0xffffff;

type CameraPreset = 'front' | 'isometric' | 'side';

interface GuidanceCue {
  tip: string;
  muscles: string;
}

const GUIDANCE_TRANSLATIONS: Record<ExerciseItem['visualKey'], Record<SupportedLanguage, GuidanceCue>> = {
  squat: {
    id: {
      tip: 'Tampak samping: Jaga dada tegak & dorong panggul ke belakang. Jangan biarkan lutut tertekuk melebihi ujung jari kaki.',
      muscles: 'Quadriceps & Gluteus (Paha & Bokong)',
    },
    en: {
      tip: 'Side view: Keep chest upright & hinge hips backward. Do not allow knees to track excessively past toes.',
      muscles: 'Quadriceps & Glutes',
    },
  },
  push_up: {
    id: {
      tip: 'Tampak samping: Punggung, pinggang, dan tumit harus membentuk 1 garis lurus. Siku menekuk 45°-90°.',
      muscles: 'Pectoralis & Triceps (Dada & Lengan Belakang)',
    },
    en: {
      tip: 'Side view: Spine, hips, and heels form a rigid straight line. Bend elbows between 45°-90°.',
      muscles: 'Pectorals & Triceps',
    },
  },
  plank: {
    id: {
      tip: 'Tampak samping: Kencangkan otot perut (core) & hindari panggul melorot ke bawah.',
      muscles: 'Core Abdominals (Otot Inti Perut)',
    },
    en: {
      tip: 'Side view: Brace core abdominals tightly & prevent hips from sagging downward.',
      muscles: 'Core Abdominals',
    },
  },
  jumping_jacks: {
    id: {
      tip: 'Tampak depan: Mendaratlah dengan telapak kaki lentur untuk menyerap benturan pada lutut.',
      muscles: 'Calves & Deltoids (Betis & Bahu)',
    },
    en: {
      tip: 'Front view: Land softly on the balls of your feet to absorb impact on your knees.',
      muscles: 'Calves & Deltoids',
    },
  },
  lunges: {
    id: {
      tip: 'Tampak samping: Sudut kedua lutut 90° di titik terendah. Lutut depan sejajar di atas pergelangan kaki.',
      muscles: 'Quads & Hamstrings (Paha Depan & Belakang)',
    },
    en: {
      tip: 'Side view: Both knees at 90° at lowest depth. Front knee tracks directly over ankle.',
      muscles: 'Quadriceps & Hamstrings',
    },
  },
  arm_raise: {
    id: {
      tip: 'Tampak depan: Dorong beban lurus ke atas kepala tanpa melengkungkan punggung bagian bawah.',
      muscles: 'Anterior Deltoids & Trapezius (Bahu Atas)',
    },
    en: {
      tip: 'Front view: Press vertically overhead without arching the lower back.',
      muscles: 'Anterior Deltoids & Trapezius',
    },
  },
  sit_up: {
    id: {
      tip: 'Gunakan kekuatan kontraksi perut, bukan menarik leher dengan tangan.',
      muscles: 'Rectus Abdominis (Perut Depan)',
    },
    en: {
      tip: 'Initiate motion through abdominal contraction, never pull on your neck.',
      muscles: 'Rectus Abdominis',
    },
  },
  high_knees: {
    id: {
      tip: 'Angkat lutut setinggi pinggang secara ritmis dengan mendarat menggunakan bantalan kaki.',
      muscles: 'Hip Flexors & Calves (Fleksor Pinggul & Betis)',
    },
    en: {
      tip: 'Drive knees up to waist height rhythmically while springing on balls of feet.',
      muscles: 'Hip Flexors & Calves',
    },
  },
  mountain_climbers: {
    id: {
      tip: 'Pertahankan postur push-up yang stabil saat memompa lutut ke arah dada.',
      muscles: 'Core, Shoulders & Hip Flexors',
    },
    en: {
      tip: 'Maintain a rigid push-up plank posture while alternating knee drives toward chest.',
      muscles: 'Core, Shoulders & Hip Flexors',
    },
  },
  cobra_stretch: {
    id: {
      tip: 'Regangkan tulang belakang secara lembut tanpa memaksakan kompresi pinggang.',
      muscles: 'Abdominal & Spine Extensors (Otot Perut & Tulang Belakang)',
    },
    en: {
      tip: 'Gently elongate the anterior chain and spine without compressing lumbar vertebrae.',
      muscles: 'Abdominal & Spine Extensors',
    },
  },
  child_pose: {
    id: {
      tip: 'Panjangkan tulang belakang dan bernapaslah perlahan untuk merelaksasikan otot punggung.',
      muscles: 'Latissimus & Lower Back Stretch (Punggung Bawah)',
    },
    en: {
      tip: 'Elongate the entire spine and breathe deeply to relax lower back muscles.',
      muscles: 'Latissimus & Lower Back',
    },
  },
};

export function ExerciseVisual3D({
  visualKey,
  className = 'w-full h-full',
  isAnimated = true,
  showControls = true,
  onAnimationRep,
}: ExerciseVisual3DProps) {
  const { language } = useLanguage();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPreset>('isometric');

  const onAnimationRepRef = useRef(onAnimationRep);
  useEffect(() => {
    onAnimationRepRef.current = onAnimationRep;
  }, [onAnimationRep]);
  const repPeakReachedRef = useRef(false);

  const guidance = GUIDANCE_TRANSLATIONS[visualKey]?.[language] || { tip: '', muscles: '' };
  const formGuidanceTip = guidance.tip;
  const activeMuscleGroup = guidance.muscles;

  // Target camera spherical angles for smooth interpolation
  const cameraTarget = useRef({
    theta: Math.PI / 4.5, // Azimuth angle (~40 deg isometric)
    phi: 0.35,            // Elevation angle
    radius: 4.6,
  });

  const cameraCurrent = useRef({
    theta: Math.PI / 4.5,
    phi: 0.35,
    radius: 4.6,
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, theta: 0, phi: 0 });

  const setCameraPreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    if (preset === 'front') {
      cameraTarget.current.theta = 0;
      cameraTarget.current.phi = 0.15;
      cameraTarget.current.radius = 4.4;
    } else if (preset === 'side') {
      cameraTarget.current.theta = Math.PI / 2;
      cameraTarget.current.phi = 0.12;
      cameraTarget.current.radius = 4.5;
    } else {
      cameraTarget.current.theta = Math.PI / 4.2;
      cameraTarget.current.phi = 0.35;
      cameraTarget.current.radius = 4.6;
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1435, 0.07);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 50);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x080f28, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. LIGHTING
    const ambientLight = new THREE.AmbientLight(0x202b55, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(WHITE_HEX, 2.2);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLightCyan = new THREE.PointLight(CYAN_HEX, 3.5, 12);
    rimLightCyan.position.set(-3, 3, -3);
    scene.add(rimLightCyan);

    const rimLightMagenta = new THREE.PointLight(MAGENTA_HEX, 3.0, 10);
    rimLightMagenta.position.set(3, 1.5, -2);
    scene.add(rimLightMagenta);

    // 3. CYBER GRID FLOOR (Dark navy and cyan grid)
    const grid = new THREE.GridHelper(10, 20, CYAN_HEX, 0x1a2c62);
    grid.position.y = -1.2;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.38;
    scene.add(grid);

    // Ground Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.19;
    scene.add(shadowMesh);

    // 4. SHARED MATERIALS
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x070b19,
      emissive: CYAN_HEX,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8,
    });

    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x101633,
      emissive: CYAN_HEX,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.7,
    });

    const limbMat = new THREE.MeshStandardMaterial({
      color: 0x161c3b,
      emissive: MAGENTA_HEX,
      emissiveIntensity: 0.3,
      roughness: 0.35,
      metalness: 0.6,
    });

    const activeMuscleMat = new THREE.MeshStandardMaterial({
      color: 0x221330,
      emissive: MAGENTA_HEX,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
    });

    const visorMat = new THREE.MeshBasicMaterial({
      color: CYAN_HEX,
    });

    // 5. BUILD HIERARCHICAL 3D ATHLETIC MANNEQUIN RIG
    const mannequin = new THREE.Group();
    scene.add(mannequin);

    // Helper to create capsule limb segment
    function createCapsule(radius: number, length: number, material: THREE.Material) {
      const geo = new THREE.CapsuleGeometry(radius, length, 8, 16);
      return new THREE.Mesh(geo, material);
    }

    function createJoint(radius = 0.075) {
      const geo = new THREE.SphereGeometry(radius, 16, 16);
      return new THREE.Mesh(geo, jointMat);
    }

    // Root / Pelvis
    const pelvis = new THREE.Group();
    pelvis.position.y = 0;
    mannequin.add(pelvis);

    const pelvisMesh = createCapsule(0.14, 0.12, torsoMat);
    pelvisMesh.rotation.z = Math.PI / 2;
    pelvis.add(pelvisMesh);

    // Spine & Torso
    const spine = new THREE.Group();
    spine.position.y = 0.16;
    pelvis.add(spine);

    const torsoMesh = createCapsule(0.16, 0.28, torsoMat);
    torsoMesh.position.y = 0.17;
    spine.add(torsoMesh);

    // Chest & Shoulders
    const chest = new THREE.Group();
    chest.position.y = 0.35;
    spine.add(chest);

    const shoulderBar = createCapsule(0.08, 0.48, torsoMat);
    shoulderBar.rotation.z = Math.PI / 2;
    shoulderBar.position.y = 0.04;
    chest.add(shoulderBar);

    // Head with Cyber Visor
    const neck = new THREE.Group();
    neck.position.y = 0.15;
    chest.add(neck);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), torsoMat);
    headMesh.position.y = 0.12;
    neck.add(headMesh);

    const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.055, 0.13), visorMat);
    visorMesh.position.set(0, 0.12, 0.085);
    neck.add(visorMesh);

    // --- ARMS ---
    // Left Arm (Flared outward to clear torso)
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.34, 0.04, 0);
    chest.add(leftShoulder);
    leftShoulder.add(createJoint(0.075));

    const leftUpperArmMesh = createCapsule(0.065, 0.21, limbMat);
    leftUpperArmMesh.position.y = -0.17;
    leftShoulder.add(leftUpperArmMesh);

    const leftElbow = new THREE.Group();
    leftElbow.position.y = -0.34;
    leftShoulder.add(leftElbow);
    leftElbow.add(createJoint(0.06));

    const leftForearmMesh = createCapsule(0.055, 0.19, limbMat);
    leftForearmMesh.position.y = -0.15;
    leftElbow.add(leftForearmMesh);

    const leftHand = new THREE.Group();
    leftHand.position.y = -0.30;
    leftElbow.add(leftHand);
    leftHand.add(createJoint(0.05));

    // Right Arm (Flared outward to clear torso)
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.34, 0.04, 0);
    chest.add(rightShoulder);
    rightShoulder.add(createJoint(0.075));

    const rightUpperArmMesh = createCapsule(0.065, 0.21, limbMat);
    rightUpperArmMesh.position.y = -0.17;
    rightShoulder.add(rightUpperArmMesh);

    const rightElbow = new THREE.Group();
    rightElbow.position.y = -0.34;
    rightShoulder.add(rightElbow);
    rightElbow.add(createJoint(0.06));

    const rightForearmMesh = createCapsule(0.055, 0.19, limbMat);
    rightForearmMesh.position.y = -0.15;
    rightElbow.add(rightForearmMesh);

    const rightHand = new THREE.Group();
    rightHand.position.y = -0.30;
    rightElbow.add(rightHand);
    rightHand.add(createJoint(0.05));

    // --- LEGS ---
    // Left Leg
    const leftHip = new THREE.Group();
    leftHip.position.set(-0.18, -0.06, 0);
    pelvis.add(leftHip);
    leftHip.add(createJoint(0.08));

    const leftThighMesh = createCapsule(0.078, 0.28, limbMat);
    leftThighMesh.position.y = -0.22;
    leftHip.add(leftThighMesh);

    const leftKnee = new THREE.Group();
    leftKnee.position.y = -0.44;
    leftHip.add(leftKnee);
    leftKnee.add(createJoint(0.072));

    const leftShinMesh = createCapsule(0.068, 0.28, limbMat);
    leftShinMesh.position.y = -0.21;
    leftKnee.add(leftShinMesh);

    const leftFoot = new THREE.Group();
    leftFoot.position.set(0, -0.42, 0.06);
    leftKnee.add(leftFoot);
    const leftFootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.065, 0.20), limbMat);
    leftFoot.add(leftFootMesh);

    // Right Leg
    const rightHip = new THREE.Group();
    rightHip.position.set(0.18, -0.06, 0);
    pelvis.add(rightHip);
    rightHip.add(createJoint(0.08));

    const rightThighMesh = createCapsule(0.078, 0.28, limbMat);
    rightThighMesh.position.y = -0.22;
    rightHip.add(rightThighMesh);

    const rightKnee = new THREE.Group();
    rightKnee.position.y = -0.44;
    rightHip.add(rightKnee);
    rightKnee.add(createJoint(0.072));

    const rightShinMesh = createCapsule(0.068, 0.28, limbMat);
    rightShinMesh.position.y = -0.21;
    rightKnee.add(rightShinMesh);

    const rightFoot = new THREE.Group();
    rightFoot.position.set(0, -0.42, 0.06);
    rightKnee.add(rightFoot);
    const rightFootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.065, 0.20), limbMat);
    rightFoot.add(rightFootMesh);

    // Professional Olympic Barbell for arm_raise (gagang panjang, piringan di sisi luar tangan)
    const barbell = new THREE.Group();
    // 1. Batang baja / gagang utama (panjang 1.85, diameter 0.044)
    const barMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 1.85, 24),
      new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        metalness: 0.95,
        roughness: 0.15,
      })
    );
    barMesh.rotation.z = Math.PI / 2;
    barbell.add(barMesh);

    // 2. Collar rings pembatas gagang dan piringan beban
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x999999,
      metalness: 0.9,
      roughness: 0.2,
    });
    const leftCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.025, 24), collarMat);
    leftCollar.rotation.z = Math.PI / 2;
    leftCollar.position.x = -0.70;
    barbell.add(leftCollar);

    const rightCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.025, 24), collarMat);
    rightCollar.rotation.z = Math.PI / 2;
    rightCollar.position.x = 0.70;
    barbell.add(rightCollar);

    // 3. Piringan beban magenta futuristik di luar batas pegangan tangan
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x221330,
      emissive: MAGENTA_HEX,
      emissiveIntensity: 0.85,
      metalness: 0.4,
      roughness: 0.3,
    });
    const leftPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 28), plateMat);
    leftPlate.rotation.z = Math.PI / 2;
    leftPlate.position.x = -0.78;
    barbell.add(leftPlate);

    const rightPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 28), plateMat);
    rightPlate.rotation.z = Math.PI / 2;
    rightPlate.position.x = 0.78;
    barbell.add(rightPlate);

    // Cyan glowing rim rings on plates
    const rimMat = new THREE.MeshStandardMaterial({
      color: CYAN_HEX,
      emissive: CYAN_HEX,
      emissiveIntensity: 0.7,
    });
    const leftRim = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.015, 28), rimMat);
    leftRim.rotation.z = Math.PI / 2;
    leftRim.position.x = -0.78;
    barbell.add(leftRim);

    const rightRim = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.015, 28), rimMat);
    rightRim.rotation.z = Math.PI / 2;
    rightRim.position.x = 0.78;
    barbell.add(rightRim);

    barbell.visible = visualKey === 'arm_raise';
    mannequin.add(barbell);

    // Spine Alignment Guide Laser Line
    const laserMat = new THREE.LineDashedMaterial({
      color: CYAN_HEX,
      dashSize: 0.1,
      gapSize: 0.05,
      linewidth: 2,
    });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -1.2),
      new THREE.Vector3(0, 0, 1.2),
    ]);
    const postureLaser = new THREE.Line(laserGeo, laserMat);
    postureLaser.computeLineDistances();
    postureLaser.visible = false;
    scene.add(postureLaser);

    // 6. DRAG TO ORBIT EVENT HANDLERS
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        theta: cameraTarget.current.theta,
        phi: cameraTarget.current.phi,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      cameraTarget.current.theta = dragStartRef.current.theta - dx * 0.008;
      cameraTarget.current.phi = THREE.MathUtils.clamp(
        dragStartRef.current.phi + dy * 0.006,
        -0.15,
        1.1
      );
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          theta: cameraTarget.current.theta,
          phi: cameraTarget.current.phi,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      cameraTarget.current.theta = dragStartRef.current.theta - dx * 0.01;
      cameraTarget.current.phi = THREE.MathUtils.clamp(
        dragStartRef.current.phi + dy * 0.008,
        -0.15,
        1.1
      );
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 8. RESIZE HANDLER
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 9. ANIMATION LOOP & BIOMECHANICAL KINEMATICS
    let rafId = 0;
    const startTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const t = isAnimated ? (now - startTime) / 1000 : 0.8;

      // Smooth camera interpolation (lerp)
      cameraCurrent.current.theta = THREE.MathUtils.lerp(
        cameraCurrent.current.theta,
        cameraTarget.current.theta,
        0.08
      );
      cameraCurrent.current.phi = THREE.MathUtils.lerp(
        cameraCurrent.current.phi,
        cameraTarget.current.phi,
        0.08
      );
      cameraCurrent.current.radius = THREE.MathUtils.lerp(
        cameraCurrent.current.radius,
        cameraTarget.current.radius,
        0.08
      );

      const rad = cameraCurrent.current.radius;
      const phi = cameraCurrent.current.phi;
      const theta = cameraCurrent.current.theta;

      camera.position.x = rad * Math.cos(phi) * Math.sin(theta);
      camera.position.y = rad * Math.sin(phi);
      camera.position.z = rad * Math.cos(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);

      // Reset transforms
      mannequin.position.set(0, 0, 0);
      mannequin.rotation.set(0, 0, 0);
      pelvis.position.set(0, 0, 0);
      pelvis.rotation.set(0, 0, 0);
      spine.rotation.set(0, 0, 0);
      chest.rotation.set(0, 0, 0);
      neck.rotation.set(0, 0, 0);

      leftShoulder.rotation.set(0, 0, 0);
      leftElbow.rotation.set(0, 0, 0);
      rightShoulder.rotation.set(0, 0, 0);
      rightElbow.rotation.set(0, 0, 0);

      leftHip.rotation.set(0, 0, 0);
      leftKnee.rotation.set(0, 0, 0);
      leftFoot.rotation.set(0, 0, 0);
      rightHip.rotation.set(0, 0, 0);
      rightKnee.rotation.set(0, 0, 0);
      rightFoot.rotation.set(0, 0, 0);

      leftThighMesh.material = limbMat;
      rightThighMesh.material = limbMat;
      leftShinMesh.material = limbMat;
      rightShinMesh.material = limbMat;
      torsoMesh.material = torsoMat;
      leftUpperArmMesh.material = limbMat;
      rightUpperArmMesh.material = limbMat;

      shadowMesh.scale.set(1, 1, 1);
      (shadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.45;
      postureLaser.visible = false;
      barbell.visible = false;

      // KINEMATIC SOLVERS PER EXERCISE (COLLISION-FREE BIOMECHANICS)
      switch (visualKey) {
        case 'squat': {
          const speed = 2.2;
          const depth = (Math.sin(t * speed) + 1) / 2; // 0 = stand, 1 = deep squat

          // Mannequin drops and hips push back (hip hinge)
          pelvis.position.y = -depth * 0.50;
          pelvis.position.z = -depth * 0.26;

          // Torso stays relatively upright
          spine.rotation.x = depth * 0.22;

          // Legs track outward in natural squat stance (clears torso)
          leftHip.rotation.z = -0.30 - depth * 0.12;
          rightHip.rotation.z = 0.30 + depth * 0.12;
          leftHip.rotation.y = -0.18;
          rightHip.rotation.y = 0.18;

          leftHip.rotation.x = -depth * 1.35;
          rightHip.rotation.x = -depth * 1.35;

          leftKnee.rotation.x = depth * 1.82;
          rightKnee.rotation.x = depth * 1.82;

          leftFoot.rotation.x = -depth * 0.48;
          rightFoot.rotation.x = -depth * 0.48;

          // Arms reach forward for balance, flared outward to clear torso
          leftShoulder.rotation.x = -depth * 1.22;
          rightShoulder.rotation.x = -depth * 1.22;
          leftShoulder.rotation.z = -0.26;
          rightShoulder.rotation.z = 0.26;
          leftElbow.rotation.x = -0.12;
          rightElbow.rotation.x = -0.12;

          // Active muscle highlight (Quads & Glutes)
          if (depth > 0.45) {
            leftThighMesh.material = activeMuscleMat;
            rightThighMesh.material = activeMuscleMat;
          }
          break;
        }

        case 'push_up': {
          const speed = 2.2;
          const depth = (Math.sin(t * speed) + 1) / 2; // 0 = bawah (dada dekat lantai), 1 = atas (lengan lurus)

          // Sudut inklinasi tubuh berporos di ujung jari kaki yang menapak tanah
          // Di bawah (depth = 0), badan hampir horizontal (phi = 0.08 rad)
          // Di atas (depth = 1), dada terangkat oleh lengan lurus (phi = 0.32 rad)
          const phi = 0.08 + depth * 0.24;
          mannequin.rotation.x = Math.PI / 2 - phi;

          // Titik tumpu ujung jari kaki selalu terkunci paten di lantai (y = -1.18, z = -0.85)
          const toeFloorY = -1.18;
          const toeZ = -0.85;
          const legLength = 0.92; // Jarak dari pelvis ke telapak kaki

          // Pelvis bergerak memutar (pivot) di atas jari kaki yang menapak tanah tanpa terangkat
          mannequin.position.y = toeFloorY + legLength * Math.sin(phi);
          mannequin.position.z = toeZ + legLength * Math.cos(phi);

          // Kaki lurus, pergelangan kaki fleksi sehingga jari kaki menapak kokoh di lantai grid
          leftHip.rotation.z = -0.10;
          rightHip.rotation.z = 0.10;
          leftFoot.rotation.x = -0.65 + phi;
          rightFoot.rotation.x = -0.65 + phi;

          // Lengan & Siku:
          // flare = 1 saat di bawah (siku menekuk 90° ke arah luar 45° dari tubuh)
          // flare = 0 saat di atas (lengan tegak lurus menopang tubuh di lantai)
          const flare = 1 - depth;

          // Lengan Kiri (siku menekuk keluar 45°)
          leftShoulder.rotation.x = -1.45 + flare * 0.55;
          leftShoulder.rotation.z = -0.30 - flare * 0.40;
          leftShoulder.rotation.y = -flare * 0.25;

          leftElbow.rotation.x = -flare * 0.95;
          leftElbow.rotation.z = flare * 0.70;

          // Lengan Kanan (siku menekuk keluar 45°)
          rightShoulder.rotation.x = -1.45 + flare * 0.55;
          rightShoulder.rotation.z = 0.30 + flare * 0.40;
          rightShoulder.rotation.y = flare * 0.25;

          rightElbow.rotation.x = -flare * 0.95;
          rightElbow.rotation.z = -flare * 0.70;

          // Bayangan tanah tepat di bawah tubuh menapak lantai
          shadowMesh.position.set(0, -1.19, -0.15);
          shadowMesh.scale.set(1.0, 1.6, 1);

          // Straight spine guide laser
          postureLaser.visible = true;
          postureLaser.rotation.x = Math.PI / 2 - phi;
          postureLaser.position.set(0, mannequin.position.y + 0.15, mannequin.position.z);

          if (depth < 0.5) {
            torsoMesh.material = activeMuscleMat;
            leftUpperArmMesh.material = activeMuscleMat;
            rightUpperArmMesh.material = activeMuscleMat;
          }
          break;
        }

        case 'plank': {
          const breath = Math.sin(t * 2.5) * 0.015;
          const phi = 0.04; // Garis plank lurus sejajar lantai
          mannequin.rotation.x = Math.PI / 2 - phi;

          // Tinggi tubuh pas ditopang siku & lengan bawah di lantai (y = -1.18)
          mannequin.position.y = -0.84 + breath;
          mannequin.position.z = 0.12;

          // Mata dan kepala menghadap ke bawah/depan lantai
          neck.rotation.x = -0.40;

          // Lengan atas tegak lurus turun ke lantai menopang bahu
          leftShoulder.rotation.z = -0.12;
          rightShoulder.rotation.z = 0.12;
          leftShoulder.rotation.x = -1.52;
          rightShoulder.rotation.x = -1.52;
          leftShoulder.rotation.y = 0;
          rightShoulder.rotation.y = 0;

          // Lengan bawah (forearm) menghadap LURUS KE DEPAN menapak lantai (bukan ke dalam tubuh)
          leftElbow.rotation.x = -1.48;
          rightElbow.rotation.x = -1.48;
          leftElbow.rotation.z = 0.10;
          rightElbow.rotation.z = -0.10;

          // Kaki lurus, jari kaki fleksi menapak kokoh di lantai
          leftHip.rotation.z = -0.08;
          rightHip.rotation.z = 0.08;
          leftFoot.rotation.x = -0.82;
          rightFoot.rotation.x = -0.82;

          shadowMesh.position.set(0, -1.19, -0.05);
          shadowMesh.scale.set(1.0, 1.7, 1);

          postureLaser.visible = true;
          postureLaser.rotation.x = Math.PI / 2 - phi;
          postureLaser.position.set(0, mannequin.position.y + 0.15, mannequin.position.z);
          torsoMesh.material = activeMuscleMat;
          break;
        }

        case 'jumping_jacks': {
          const speed = 4.2;
          const cycle = Math.sin(t * speed);
          const open = (cycle + 1) / 2; // 0 = closed, 1 = open
          const hop = Math.abs(Math.sin(t * speed)) * 0.22;

          mannequin.position.y = hop;
          shadowMesh.scale.set(1 - hop * 1.5, 1 - hop * 1.5, 1);
          (shadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.45 - hop;

          // Legs jump outward with correct abduction signs (negative = left, positive = right)
          const legSpread = open * 0.45;
          leftHip.rotation.z = -0.08 - legSpread;
          rightHip.rotation.z = 0.08 + legSpread;

          // Slight landing shock absorption
          leftKnee.rotation.x = hop > 0.05 ? 0.2 : 0;
          rightKnee.rotation.x = hop > 0.05 ? 0.2 : 0;

          // Arms sweep up to wide V in coronal plane with safe clearance
          leftShoulder.rotation.z = -0.18 - open * 2.35;
          rightShoulder.rotation.z = 0.18 + open * 2.35;
          leftShoulder.rotation.x = -0.08;
          rightShoulder.rotation.x = -0.08;
          leftElbow.rotation.z = -open * 0.15;
          rightElbow.rotation.z = open * 0.15;
          break;
        }

        case 'lunges': {
          const speed = 2.2;
          const step = (Math.sin(t * speed) + 1) / 2; // 0 = stand, 1 = deep lunge

          pelvis.position.y = -step * 0.42;
          pelvis.position.z = -step * 0.05;

          // Legs on separate parallel tracks (lateral clearance prevents knee collision)
          leftHip.rotation.z = -0.15;
          rightHip.rotation.z = 0.15;

          // Front leg (Left) steps forward and bends 90 deg
          leftHip.rotation.x = -step * 1.35;
          leftKnee.rotation.x = step * 1.48;
          leftFoot.rotation.x = -step * 0.25;

          // Back leg (Right) extends back and knee drops
          rightHip.rotation.x = step * 0.78;
          rightKnee.rotation.x = step * 1.38;
          rightFoot.rotation.x = step * 0.45;

          // Tangan lurus ke depan untuk menjaga postur tubuh tegak & seimbang (counterbalance)
          leftShoulder.rotation.x = -1.42;
          rightShoulder.rotation.x = -1.42;
          leftShoulder.rotation.z = -0.12;
          rightShoulder.rotation.z = 0.12;
          leftShoulder.rotation.y = 0;
          rightShoulder.rotation.y = 0;

          leftElbow.rotation.set(0, 0, 0);
          rightElbow.rotation.set(0, 0, 0);

          if (step > 0.5) {
            leftThighMesh.material = activeMuscleMat;
            rightThighMesh.material = activeMuscleMat;
          }
          break;
        }

        case 'arm_raise': {
          const speed = 2.4;
          const phase = Math.sin(t * speed);
          const lift = (phase + 1) / 2; // 0 = chest/clavicle rack position, 1 = full overhead lockout

          // Standing legs stable
          leftHip.rotation.z = -0.16;
          rightHip.rotation.z = 0.16;

          // Biomekanik presisi Overhead Barbell Press:
          // Siku menekuk ke samping (lateral flare di bidang skapula):
          // - Pada lift = 0 (posisi bawah/dada): Siku membuka ke samping (~85°), siku ditekuk ~90° ke atas
          //   membentuk pose W-rack sehingga lengan bawah tegak lurus menopang barbel di depan dada/klavikula.
          // - Pada lift = 1 (posisi atas/overhead lockout): Lengan mendorong lurus ke atas kepala, siku melurus penuh.
          const shoulderZ = -1.48 - lift * 1.25; // -1.48 (siku ke samping) -> -2.73 (lurus ke atas kepala)
          leftShoulder.rotation.z = shoulderZ;
          rightShoulder.rotation.z = -shoulderZ;

          // Condong ke depan di bidang skapula sehingga barbel turun tepat di depan dada (z ~0.26)
          // bebas dari tabrakan/penetrasi torso/leher, dan naik lurus tepat di atas kepala (overhead lockout)
          leftShoulder.rotation.x = -0.56 * (1 - lift) - 0.03 * lift;
          rightShoulder.rotation.x = -0.56 * (1 - lift) - 0.03 * lift;

          leftShoulder.rotation.y = 0.22 * (1 - lift);
          rightShoulder.rotation.y = -0.22 * (1 - lift);

          // Siku menekuk ke samping-atas (W-rack) pada posisi bawah, dan melurus (0) saat di atas kepala
          leftElbow.rotation.z = -1.42 * (1 - lift);
          rightElbow.rotation.z = 1.42 * (1 - lift);

          leftElbow.rotation.x = 0.36 * (1 - lift);
          rightElbow.rotation.x = 0.36 * (1 - lift);
          leftElbow.rotation.y = 0;
          rightElbow.rotation.y = 0;

          // Update matriks dunia manekin agar koordinat tangan sinkron secara instan
          mannequin.updateMatrixWorld(true);

          // Kunci posisi barbel tepat pada titik telapak tangan, dengan proteksi clearance agar selalu di depan badan
          const lHandPos = new THREE.Vector3();
          const rHandPos = new THREE.Vector3();
          leftHand.getWorldPosition(lHandPos);
          rightHand.getWorldPosition(rHandPos);
          mannequin.worldToLocal(lHandPos);
          mannequin.worldToLocal(rHandPos);

          const midHandZ = (lHandPos.z + rHandPos.z) * 0.5;
          // Clearance aman di depan dada: pada lift = 0 (bawah) z >= 0.26 (di depan dada z=0.16), pada lift = 1 (atas) z ~0.04
          const safeForwardZ = Math.max(midHandZ, 0.26 * (1 - lift) + 0.04 * lift);

          barbell.visible = true;
          barbell.position.set(
            (lHandPos.x + rHandPos.x) * 0.5,
            (lHandPos.y + rHandPos.y) * 0.5,
            safeForwardZ
          );

          // Deteksi siklus repetisi animasi untuk Auto-Pacing (Atas -> Kembali ke Dada = 1 Repetisi)
          if (lift > 0.88) {
            repPeakReachedRef.current = true;
          } else if (lift < 0.14 && repPeakReachedRef.current) {
            repPeakReachedRef.current = false;
            onAnimationRepRef.current?.();
          }

          if (lift > 0.5) {
            leftUpperArmMesh.material = activeMuscleMat;
            rightUpperArmMesh.material = activeMuscleMat;
          }
          break;
        }

        case 'sit_up': {
          const speed = 2.0;
          const curl = (Math.sin(t * speed) + 1) / 2; // 0 = flat, 1 = curled

          // Supine position (back on floor, chest facing UP)
          mannequin.rotation.x = -Math.PI / 2;
          mannequin.position.y = -1.04;
          mannequin.position.z = 0.1;

          // Bent knees with hip separation
          leftHip.rotation.z = -0.22;
          rightHip.rotation.z = 0.22;
          leftHip.rotation.x = 1.15;
          rightHip.rotation.x = 1.15;
          leftKnee.rotation.x = -1.45;
          rightKnee.rotation.x = -1.45;
          leftFoot.rotation.x = 0.3;
          rightFoot.rotation.x = 0.3;

          // Arms crossed across upper chest (safe crunch pose)
          leftShoulder.rotation.z = -0.45;
          leftShoulder.rotation.x = -0.55;
          rightShoulder.rotation.z = 0.45;
          rightShoulder.rotation.x = -0.55;

          leftElbow.rotation.y = 1.15;
          leftElbow.rotation.x = 0.25;
          rightElbow.rotation.y = -1.15;
          rightElbow.rotation.x = 0.25;

          // Torso curls up with comfortable clearance from knees
          spine.rotation.x = curl * 0.68;

          if (curl > 0.45) {
            torsoMesh.material = activeMuscleMat;
          }
          break;
        }

        case 'high_knees': {
          const speed = 7.2;
          const cycle = Math.sin(t * speed);
          const bounce = Math.abs(cycle) * 0.10;

          mannequin.position.y = bounce;
          spine.rotation.x = 0.08; // Athletic forward posture

          // Legs track straight in parallel sagittal lanes (no unnatural wide splay)
          leftHip.rotation.z = -0.04;
          rightHip.rotation.z = 0.04;

          // Alternating high knee drive with vertical shin and ball-of-foot spring
          if (cycle > 0) {
            // Left leg drives high to waist
            leftHip.rotation.x = -cycle * 1.55;
            leftKnee.rotation.x = cycle * 1.55;
            leftFoot.rotation.x = -cycle * 0.25;

            // Right leg extends to support & spring
            rightHip.rotation.x = 0.05;
            rightKnee.rotation.x = 0.05;
            rightFoot.rotation.x = cycle * 0.25;

            // Reciprocal runner arm swing: Left knee UP -> Left arm BACK, Right arm FORWARD
            leftShoulder.rotation.x = cycle * 0.65;
            rightShoulder.rotation.x = -cycle * 0.75;
          } else {
            // Right leg drives high to waist
            const negCycle = -cycle;
            rightHip.rotation.x = -negCycle * 1.55;
            rightKnee.rotation.x = negCycle * 1.55;
            rightFoot.rotation.x = -negCycle * 0.25;

            // Left leg extends to support & spring
            leftHip.rotation.x = 0.05;
            leftKnee.rotation.x = 0.05;
            leftFoot.rotation.x = negCycle * 0.25;

            // Reciprocal runner arm swing: Right knee UP -> Right arm BACK, Left arm FORWARD
            leftShoulder.rotation.x = -negCycle * 0.75;
            rightShoulder.rotation.x = negCycle * 0.65;
          }

          // Arms: Athletic 90° forward runner's bend (NEGATIVE X brings forearm forward!), held slightly clear of torso
          leftShoulder.rotation.z = -0.22;
          rightShoulder.rotation.z = 0.22;
          leftElbow.rotation.x = -1.52;
          rightElbow.rotation.x = -1.52;

          // Active target muscles: Hip flexors, quadriceps & calves
          leftThighMesh.material = activeMuscleMat;
          rightThighMesh.material = activeMuscleMat;
          leftShinMesh.material = activeMuscleMat;
          rightShinMesh.material = activeMuscleMat;
          break;
        }

        case 'mountain_climbers': {
          const speed = 6.2;
          const cycle = Math.sin(t * speed);

          mannequin.rotation.x = Math.PI / 2;
          mannequin.position.y = -0.78;
          mannequin.position.z = 0.15;

          // Hands planted shoulder-width
          leftShoulder.rotation.z = -0.48;
          rightShoulder.rotation.z = 0.48;
          leftShoulder.rotation.x = -1.25;
          rightShoulder.rotation.x = -1.25;
          leftElbow.rotation.x = 0.25;
          rightElbow.rotation.x = 0.25;

          // Alternating knee drive down center lane
          const p = (cycle + 1) / 2;
          leftHip.rotation.z = -0.06;
          rightHip.rotation.z = 0.06;
          leftHip.rotation.x = -p * 1.35;
          leftKnee.rotation.x = p * 1.48;
          rightHip.rotation.x = -(1 - p) * 1.35;
          rightKnee.rotation.x = (1 - p) * 1.48;

          torsoMesh.material = activeMuscleMat;
          break;
        }

        case 'cobra_stretch': {
          const breath = (Math.sin(t * 2.0) + 1) / 2;
          mannequin.rotation.x = Math.PI / 2;
          mannequin.position.y = -1.02;
          mannequin.position.z = 0.1;

          // Legs extended back
          leftHip.rotation.z = -0.12;
          rightHip.rotation.z = 0.12;

          // Hands pushing ground
          leftShoulder.rotation.z = -0.42;
          rightShoulder.rotation.z = 0.42;
          leftShoulder.rotation.x = -1.35;
          rightShoulder.rotation.x = -1.35;
          leftElbow.rotation.x = 0.15;
          rightElbow.rotation.x = 0.15;

          // Upper spine arches back gracefully
          spine.rotation.x = -0.38 - breath * 0.28;
          chest.rotation.x = -0.22;
          neck.rotation.x = -0.20;
          break;
        }

        case 'child_pose': {
          mannequin.position.y = -0.98;
          pelvis.position.z = -0.25;

          // Deep hip flexion with wide knees (traditional balasana stance)
          leftHip.rotation.z = -0.38;
          rightHip.rotation.z = 0.38;
          leftHip.rotation.x = -1.65;
          rightHip.rotation.x = -1.65;
          leftKnee.rotation.x = 2.15;
          rightKnee.rotation.x = 2.15;

          // Torso resting comfortably between thighs
          spine.rotation.x = 0.65;

          // Arms extended long forward on floor
          leftShoulder.rotation.z = -0.22;
          rightShoulder.rotation.z = 0.22;
          leftShoulder.rotation.x = -1.45;
          rightShoulder.rotation.x = -1.45;
          leftElbow.rotation.x = -0.05;
          rightElbow.rotation.x = -0.05;
          break;
        }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    // CLEANUP
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [visualKey, isAnimated]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#0e1942] via-[#09122c] to-[#060c20] border border-cyan/30 select-none shadow-[0_0_50px_rgba(9,18,48,0.7)] ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

      {/* Cyberpunk HUD Corners */}
      <div className="pointer-events-none absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan/80" />
      <div className="pointer-events-none absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan/80" />
      <div className="pointer-events-none absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-magenta/80" />
      <div className="pointer-events-none absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-magenta/80" />

      {/* TOP CONTROLS & CAMERA PRESETS */}
      {showControls && (
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-auto z-10">
          {/* Active 3D Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0b1433]/85 border border-cyan/40 text-[10px] font-mono text-cyan backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
            <span className="font-bold">3D BIOMECHANIC</span>
            <span className="text-white/40">|</span>
            <span className="hidden sm:inline text-muted">
              {language === 'en' ? 'Drag to rotate 360°' : 'Geser untuk memutar 360°'}
            </span>
          </div>

          {/* Preset Angle Buttons */}
          <div className="flex items-center gap-1 bg-[#0b1433]/85 border border-white/15 rounded-lg p-1 backdrop-blur-sm">
            <button
              onClick={() => setCameraPreset('front')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                activePreset === 'front'
                  ? 'bg-cyan text-void font-bold shadow-[var(--glow-cyan)]'
                  : 'text-muted hover:text-white'
              }`}
              title={
                language === 'en'
                  ? 'Front View (Check symmetry & stance)'
                  : 'Tampak Depan (Cek simetri & bukaan kaki)'
              }
            >
              {language === 'en' ? '0° Front' : '0° Depan'}
            </button>
            <button
              onClick={() => setCameraPreset('isometric')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                activePreset === 'isometric'
                  ? 'bg-cyan text-void font-bold shadow-[var(--glow-cyan)]'
                  : 'text-muted hover:text-white'
              }`}
              title={
                language === 'en'
                  ? 'Isometric Angled View'
                  : 'Tampak Serong Isometrik'
              }
            >
              {language === 'en' ? '45° Angled' : '45° Serong'}
            </button>
            <button
              onClick={() => setCameraPreset('side')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                activePreset === 'side'
                  ? 'bg-cyan text-void font-bold shadow-[var(--glow-cyan)]'
                  : 'text-muted hover:text-white'
              }`}
              title={
                language === 'en'
                  ? 'Side View (Check spinal alignment & depth)'
                  : 'Tampak Samping (Cek kelurusan punggung & kedalaman)'
              }
            >
              {language === 'en' ? '90° Side' : '90° Samping'}
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM BIOMECHANICAL CUE HUD */}
      {showControls && (
        <div className="absolute bottom-3 inset-x-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none z-10">
          {/* Form Guidance Pill */}
          {formGuidanceTip && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b1433]/90 border border-cyan/35 text-[11px] text-white/95 backdrop-blur-md max-w-xl">
              <IconTarget size={14} className="text-cyan shrink-0" />
              <span className="leading-snug">{formGuidanceTip}</span>
            </div>
          )}

          {/* Target Muscle Highlight Pill */}
          {activeMuscleGroup && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1435]/90 border border-magenta/50 text-[10px] font-mono text-magenta backdrop-blur-md shrink-0">
              <span className="w-2 h-2 rounded-full bg-magenta animate-ping" />
              <span>
                {language === 'en' ? 'Active Muscles:' : 'Otot Aktif:'}{' '}
                <strong>{activeMuscleGroup}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
