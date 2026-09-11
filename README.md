# 🏋️ GymQuest — AI Computer Vision Personal Trainer & Gamified Fitness Platform

> **Sustainable, Free & Privacy-First Digital Fitness**  
> Mengubah latihan fisik rumahan menjadi petualangan game interaktif (_Arena Mode_) dan program bimbingan terstruktur berbasis sains olahraga (_Quest Mode_) dengan Computer Vision real-time langsung di browser Anda.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://vercel.com/)
[![MediaPipe Tasks Vision](https://img.shields.io/badge/MediaPipe-Tasks--Vision-007fff?style=flat&logo=google)](https://developers.google.com/mediapipe)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Biomechanics-000000?style=flat&logo=three.js)](https://threejs.org/)
[![SDGs 3 & 10](https://img.shields.io/badge/SDGs-3%20%26%2010%20Aligned-4c8c2b?style=flat)](https://sdgs.un.org/goals)
[![Client--Side Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side%20WASM-success?style=flat)](https://github.com)

---

## 👥 Profil Tim Pengembang

Karya orisinal dikembangkan untuk kompetisi **GAYATAMA 5 Web Technology Competition** oleh **Tim Semoga Kami Beruntung**:

1. **M. Faqih Ridho** — *Ketua Tim*
2. **Ananda Fitri Wibowo** — *Anggota*
3. **Muhammad Ardiansyah Tri Wibowo** — *Anggota*
4. **Muhammad Ziddan Habibi** — *Anggota*

---

## 📑 Daftar Isi

1. [Profil Tim Pengembang](#-profil-tim-pengembang)
2. [Latar Belakang & Identifikasi Masalah](#-latar-belakang--identifikasi-masalah)
3. [Prinsip Inti & Keunggulan](#-prinsip-inti--keunggulan)
4. [Fitur Utama](#-fitur-utama)
   - [Quest Mode (Cockpit Latihan Sains & Biomekanika 3D)](#1-quest-mode--home-workout-engine-programs--workout)
   - [3D Interactive Biomechanics Viewer (Three.js)](#2-3d-interactive-biomechanics-viewer-threejs)
   - [Arena Mode (Gamified Calisthenics & Dragon Ball Push-Up Battle)](#3-arena-mode--gamified-calisthenics-arena)
   - [Computer Vision Engine 100% Client-Side](#4-computer-vision-engine-client-side-kalibrasi--exercise)
   - [Sistem 5 Kasta Liga & Gamifikasi](#5-sistem-5-kasta-liga-mingguan--gamifikasi-leaderboard--progress)
   - [Autentikasi & Keamanan Data Pengguna (Supabase Cloud Sync)](#6-autentikasi--keamanan-data-pengguna-auth)
   - [Procedural Web Audio Engine](#7-procedural-web-audio-engine-audiots)
5. [Deployment ke Vercel & Konfigurasi Cloud](#-deployment-ke-vercel--konfigurasi-cloud)
6. [Menjalankan Proyek Secara Lokal (Instalasi)](#-menjalankan-proyek-secara-lokal)
7. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
8. [Logika Inti & Arsitektur Teknis (Deep-Dive)](#-logika-inti--arsitektur-teknis)
9. [Keselarasan Sustainable Development Goals (SDGs)](#-keselarasan-sustainable-development-goals-sdgs)
10. [Status Pengembangan](#-status-pengembangan)
11. [Tech Stack & Pustaka](#-tech-stack--pustaka)

---

## 🎯 Latar Belakang & Identifikasi Masalah

Kebugaran jasmani adalah pilar kesehatan universal. Namun, masyarakat modern menghadapi dua hambatan kritis dalam membangun kebiasaan berolahraga:

1. **Hambatan Biaya & Aksesibilitas (Financial & Geographic Inequality):** Biaya sewa Personal Trainer (PT) profesional bersertifikat berkisar antara Rp 500.000 – Rp 2.500.000+ per bulan di luar biaya keanggotaan gym. Hal ini menjadikan bimbingan kebugaran yang aman dan terarah sebagai privilese eksklusif bagi kalangan tertentu.
2. **Tingginya Risiko Cedera & Drop-out saat Olahraga Rumahan:** Sebagian besar masyarakat yang mencoba berolahraga mandiri di rumah mengandalkan video YouTube atau tutorial statis tanpa umpan balik (_no real-time feedback_). Studi kedokteran olahraga menunjukkan bahwa **30–40% pegiat olahraga rumahan mengalami cedera muskuloskeletal** akibat kesalahan form/postur gerak (misalnya lutut kolaps pada squat, punggung melengkung saat push-up). Selain itu, ketiadaan sistem reward interaktif menyebabkan angka _drop-out_ mencapai lebih dari 60% dalam bulan pertama.

### Solusi GymQuest

**GymQuest** hadir sebagai **Personal Trainer AI & Platform Kebugaran Tergamifikasi** yang dapat diakses secara cuma-cuma melalui browser web standar. Cukup dengan webcam laptop atau smartphone, GymQuest mendeteksi titik sendi tubuh secara real-time, mengoreksi sudut biomekanik, menghitung repetisi valid, memvisualisasikan anatomi otot dalam 3D, dan membungkus seluruh latihan ke dalam sistem kompetisi 5 Kasta Liga Mingguan yang adiktif.

---

## 🛡️ Prinsip Inti & Keunggulan

- 🔒 **100% Privacy-by-Design (Client-Side WASM):** Seluruh inferensi AI MediaPipe berjalan lokal di browser via WebAssembly dan WebGL. **Video kamera tidak pernah dikirim ke server cloud ataupun disimpan**, menjaga privasi pengguna seutuhnya di ruang privat rumah.
- ⚡ **Zero-Latency & Ultra-Responsive:** Tanpa latency round-trip jaringan, koreksi postur dan respon game berlangsung dalam rentang <16ms (target 60 FPS).
- 💰 **Zero Server GPU Cost:** Beban komputasi didistribusikan ke perangkat pengguna (_edge computing_), memungkinkan platform beroperasi secara berkelanjutan dengan biaya hosting server mendekati nol.
- 🎵 **Zero Asset Audio Footprint:** Seluruh efek suara dan musik latar (BGM) disintesis secara prosedural via Web Audio API tanpa perlu mengunduh file MP3/WAV eksternal.

---

## 🚀 Fitur Utama

### 1. Quest Mode / Home Workout Engine (`/programs` & `/workout`)

Cockpit latihan terstruktur yang memadukan kurikulum sains olahraga berbasis kerangka **ACSM (American College of Sports Medicine)**:

- **Smart Onboarding Assessment:** Evaluasi mandiri tingkat kebugaran (_Pemula_, _Menengah_, _Mahir_) dan target spesifik (_Bina Otot_, _Penurunan Lemak_, _Stamina & Mobilitas_).
- **5 Pre-built Scientific Programs:**
  1. _Full Body Ignition:_ Aktivasi kelompok otot utama tubuh tanpa alat untuk fondasi postur.
  2. _High-Burn Cardio Shred:_ Protokol HIIT pembakar kalori tinggi dan peningkat VO2 max.
  3. _Iron Core & Abs Defense:_ Penguatan dinding perut, pinggul, dan stabilitas lumbal.
  4. _Daily Recovery & Mobility:_ Peregangan lembut untuk pemulihan sendi dan anti-kaku.
  5. _Spartan Full Body Mastery:_ Latihan kekuatan dan daya tahan tingkat lanjut.
- **Custom Workout Builder:** Modal interaktif untuk meracik latihan personal dari katalog gerakan dengan target set, repetisi, atau durasi yang fleksibel.
- **Dual-Mode Workout Runner:**
  - **Mode AI Kamera:** AI Computer Vision mendeteksi gerakan, menghitung repetisi, dan memvalidasi batas ekstensi/fleksi sendi secara otomatis.
  - **Mode Manual / Audio Timer:** Panduan suara dan countdown timer adaptif bagi pengguna di ruangan dengan pencahayaan minim atau tanpa akses kamera.

### 2. 3D Interactive Biomechanics Viewer (Three.js)

Komponen visualisasi biomekanika interaktif yang tertanam langsung di cockpit latihan (`ExerciseVisual3D`):

- **Model Anatomi 3D Dinamis:** Menggambarkan postur tubuh manusia dengan sendi pivot aktif (_shoulder, elbow, hip, knee_).
- **Agonist & Antagonist Muscle Highlighting:** Warna neon tematik menyorot kelompok otot target utama (agonis) dan otot pendukung (sinergis/core) yang aktif saat latihan berlangsung.
- **Real-time Injury Prevention Cues:** Menampilkan peringatan bahaya cedera spesifik gerakan (misalnya indikator bahaya hiperektensi punggung, batas aman sudut lutut terhadap jari kaki).
- **Free-Orbit 3D Controls:** Pengguna dapat memutar, memperbesar (_zoom_), dan menginspeksi sudut gerakan dari sudut pandang 360 derajat.

### 3. Arena Mode / Gamified Calisthenics (`/arena` & `/arena/battle`)

Mengubah repetisi kalistenik membosankan menjadi kontrol permainan interaktif dan pertarungan kompetitif:

- 💥 **Dragon Ball Kamehameha Push-Up Battle (`/arena/battle`):**
  - _Pengendali:_ Gerakan push-up real-time via kamera webcam.
  - _Mekanisme Sensor Kedalaman AI:_ HUD sensor visual melacak persentase kedalaman gerak (0%–100%). Saat tubuh turun mendekat ke lantai (>60%), sistem masuk ke status `⚡ CHARGING KI`. Saat tubuh didorong naik kembali, repetisi push-up dihitung (+1 REP) dan melepaskan tembakan balok energi dahsyat **KAMEHAMEHA!**
  - _Sistem Bot Leveling & Target K.O:_
    - 🟢 **Level Easy:** Target **10 Push-Up** (kecepatan bot: 1 rep / 6 detik, damage 10 HP/rep).
    - 🟡 **Level Medium:** Target **15 Push-Up** (kecepatan bot: 1 rep / 4 detik, damage 7 HP/rep).
    - 🔴 **Level Hard:** Target **20 Push-Up** (kecepatan bot: 1 rep / 3 detik, damage 5 HP/rep).
  - _Kartu Kemenangan & K.O:_ Menampilkan status duel, akurasi repetisi, dan tombol bagikan kemenangan.
- 🦄 **Kuda Poni Terbang (`/arena`):**
  - _Pengendali:_ Gerakan push-up (posisi wajah) atau bicep curl / angkat barbel (ketinggian tangan).
  - _Mekanisme:_ Kontrol ketinggian terbang **kontinu** dengan algoritma _Adaptive Range_ auto-kalibrasi dinamis.
  - _Tantangan:_ Melewati celah vertikal ala Flappy Bird dengan 3 nyawa dan perlindungan sesaat (_invulnerability frame_).
- 🦘 **Kangguru Lari (`/arena`):**
  - _Pengendali:_ Gerakan squat tubuh.
  - _Mekanisme:_ Kontrol **diskrit** berkecepatan meningkat (fase jongkok = menunduk menghindari orb melayang; repetisi naik/lompat = memicu lompatan kinematika melewati kristal runcing di darat).
  - _Tantangan:_ Endless runner berkecepatan dinamis dengan satu nyawa (_classic arcade challenge_).
- 🎯 **Rep-to-Score Integration:** Setiap repetisi valid yang terdeteksi AI rep-counter otomatis memberikan bonus skor tambahan di dalam game.

### 4. Computer Vision Engine Client-Side (`/kalibrasi` & `/exercise`)

- **MediaPipe Pose Landmarker (33 titik landmark 3D):** Berjalan lokal via runtime WebAssembly `vision_wasm_internal`.
- **One Euro Filter Smoothing:** Menstabilkan koordinat landmark dari jitter noise kamera webcam tanpa menimbulkan latensi saat gerakan cepat.
- **Aspect-Ratio Crop Correction:** Algoritma koreksi matematis yang memastikan titik skeleton Bio-Scan HUD tepat menempel di tubuh meskipun video menggunakan CSS `object-cover`.
- **Adaptive Calibration:** Memandu pengguna memosisikan tubuh di frame kamera dengan deteksi 5 area anatomi (kepala, bahu, lengan, pinggul, kaki).

### 5. Sistem 5 Kasta Liga Mingguan & Gamifikasi (`/leaderboard` & `/progress`)

Sistem kompetisi sosial asinkron yang memotivasi konsistensi jangka panjang:

- 🏆 **5 Kasta Liga RPG Tematik:**
  - 🛡️ **Iron Initiate** (Liga Besi Pemula)
  - 🥉 **Bronze Brawler** (Liga Perunggu Petarung)
  - 🥈 **Silver Striker** (Liga Perak Penyerang)
  - 🥇 **Gold Gladiator** (Liga Emas Jawara)
  - 👑 **Titan Colossus** (Liga Titan Puncak)
- ⏳ **Siklus Musim 7 Hari (168 Jam):** Penghitung waktu mundur real-time menuju reset musim dengan evaluasi otomatis.
- ⚔️ **Bracket 11 Kontestan Kompetitif:** Setiap kasta diisi 11 atlet dengan sistem promosi dan degradasi:
  - 🟢 **Zona Promosi (Peringkat 1–3):** Naik ke kasta liga berikutnya di akhir musim.
  - 🟡 **Zona Aman (Peringkat 4–8):** Bertahan di kasta liga saat ini.
  - 🔴 **Zona Degradasi (Peringkat 9–11):** Turun ke kasta liga sebelumnya (kecuali kasta Iron).
- ⚡ **Dynamic EXP Formula:** Perolehan EXP dihitung berdasarkan durasi latihan, total repetisi valid, serta bonus pengganda (_multiplier_) dari streak harian.
- 📊 **Dashboard Progres & Kalender:** Pelacak _Daily Streak_, total waktu olahraga, total repetisi, dan riwayat sesi latihan persisten di browser.

### 6. Autentikasi & Keamanan Data Pengguna (`/auth`)

Sistem akun modern dengan perpaduan **Supabase PostgreSQL Cloud Sync** dan **Offline-First Storage**:

- 🚪 **Halaman Autentikasi Mandiri (`/auth`):**
  - Dilengkapi tombol navigasi **`← Kembali ke Beranda`**, indikator konektivitas cloud (`Supabase Cloud Online`), dan tab transisi halus antara *Masuk (Login)* dan *Daftar Akun Baru*.
- 🔐 **Standar Validasi Kata Sandi Ketat:**
  - **Minimal 8 Karakter** (`length >= 8`)
  - **Minimal 1 Huruf Besar** (`A-Z`)
  - **Minimal 1 Karakter Simbol Khusus** (`!@#$%^&*()_+-=[]{};':"|,.<>/?`~)
  - **Interactive Strength Meter:** Visualizer kekuatan kata sandi real-time (*Lemah*, *Sedang*, *Kuat & Aman ✓*).
  - **Live Requirement Checklist:** Tanda centang hijau otomatis saat pengguna mengetik.
  - **Deteksi Kecocokan Sandi:** Indikator instan `✓ Cocok` / `✕ Tidak Cocok` pada kolom konfirmasi sandi.
- 🛡️ **Arsitektur Keamanan & Privasi Tingkat Lanjut:**
  - **Row Level Security (RLS):** Seluruh tabel (`profiles`, `workout_logs`, `custom_programs`) dilindungi kebijakan RLS ketat. Hanya pemilik akun (`auth.uid() = id`) yang dapat mengakses data latihan pribadinya.
  - **Enkripsi Sandi Bcrypt:** Kredensial pengguna diamankan dengan hash satu arah ber-salt otomatis, tanpa pernah disimpan dalam teks polos.
  - **Privasi Kamera 100% Lokal:** Pemrosesan pose AI MediaPipe berlangsung seutuhnya di memori lokal peramban (WebAssembly/WebGL). Tidak ada satu pun frame video kamera yang dikirim ke server.

### 7. Procedural Web Audio Engine (`audio.ts`)

- 🎵 **Algorithmic Cyberpunk BGM:** Generator bassline 8-step berbasis tangga nada minor dengan distorsi filter lembut untuk membangun atmosfer futuristik.
- 🔔 **Interactive SFX:** Suara lonceng repetisi valid, peringatan visual/audio saat form salah, suara tick countdown, dan fanfare perayaan level-up kasta liga.
- 🔇 **Zero-Network Footprint:** Seluruh audio disintesis real-time menggunakan osilator bawaan browser tanpa unduhan berkas audio tambahan.

---

## 🚀 Deployment ke Vercel & Konfigurasi Cloud

Aplikasi GymQuest telah dioptimasi penuh dan siap dideploy langsung ke **[Vercel](https://vercel.com)**:

### 1. File Konfigurasi Vercel (`vercel.json`)
Konfigurasi [vercel.json](./vercel.json) telah dilengkapi dengan:
- **Framework Preset:** `nextjs`
- **Build Hook Otomatis:** Menjalankan `node scripts/setup-mediapipe.mjs && next build` sehingga model AI MediaPipe Pose Landmarker otomatis disiapkan di server build Vercel.
- **Header Caching Global CDN:**
  ```json
  "source": "/mediapipe/(.*)",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
    { "key": "Access-Control-Allow-Origin", "value": "*" }
  ]
  ```
  Menjamin biner WebAssembly (`.wasm`) dan model AI (`.task`) disimpan pada Vercel Global Edge CDN, mempercepat waktu buka kamera secara instan di peramban pengguna.
- **Kebijakan Keamanan Web:** Mengaktifkan `Permissions-Policy: camera=(self)` agar browser mengizinkan kamera webcam secara aman melalui HTTPS.

### 2. Variabel Lingkungan (Environment Variables)
Saat melakukan import repository di Vercel Dashboard (*Project Settings ➔ Environment Variables*), masukkan variabel berikut:

| Nama Variabel (Key) | Nilai (Value) | Keterangan |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jwqadqblbqxzrmcwhprc.supabase.co` | URL proyek Supabase cloud |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_oRf5oPfjMC0fuVxoQV-zcw_Gyl_-rVL` | Kunci publik akses database terproteksi RLS |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_oRf5oPfjMC0fuVxoQV-zcw_Gyl_-rVL` | Kunci cadangan format publishable resmi Supabase |

---

## 💻 Menjalankan Proyek Secara Lokal

### Prasyarat Sistem

- [Node.js](https://nodejs.org/) v18.18.0 atau versi yang lebih baru
- Browser modern yang mendukung WebAssembly & WebGL (Chrome, Edge, Firefox, Safari)
- Webcam aktif (minimal resolusi 720p untuk akurasi optimal)

### Langkah Instalasi Lokal

1. **Clone repository:**

   ```bash
   git clone https://github.com/MFaqihRidh0/Gym-Quest.git
   cd Gym-Quest
   ```

2. **Siapkan berkas `.env.local`:**
   Salin dari template `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

3. **Pasang dependensi:**

   ```bash
   npm install
   ```

   > ℹ️ **Catatan:** Skrip `postinstall` (`scripts/setup-mediapipe.mjs`) akan secara otomatis mengunduh model AI MediaPipe Pose (`pose_landmarker_lite.task`) dan biner WebAssembly ke folder `public/mediapipe/`.

4. **Jalankan server pengembangan:**

   ```bash
   npm run dev
   ```

5. **Buka di browser:**
   Akses [http://localhost:3000](http://localhost:3000). Berikan izin akses kamera webcam saat diminta di halaman `/kalibrasi`, `/workout`, `/exercise`, `/arena`, atau `/arena/battle`.

### Perintah Penting Lainnya

```bash
npm run build            # Membuat build produksi Next.js (menguji bundle & aset MediaPipe)
npm run start            # Menjalankan server hasil build produksi
npm run lint             # Menjalankan pemeriksaan kualitas kode ESLint
npm run format           # Memformat kode secara otomatis menggunakan Prettier
npm run setup:mediapipe  # Mengunduh ulang aset biner MediaPipe jika diperlukan
```

---

## 📁 Struktur Direktori Proyek

```
gymquest/
├── public/
│   ├── cursors/                 # Kursor barbel kustom (Cyberpunk HUD style)
│   └── mediapipe/               # Model AI & biner WebAssembly lokal (offline-capable)
├── scripts/
│   └── setup-mediapipe.mjs      # Skrip otomatis pengunduh model MediaPipe
├── src/
│   ├── app/                     # Next.js 16 App Router
│   │   ├── page.tsx             # Landing page modern cyberpunk & showcase fitur
│   │   ├── auth/page.tsx        # Halaman mandiri Login & Registrasi dengan checklist validasi sandi
│   │   ├── login/page.tsx       # Rute pengalihan ke /auth?tab=login
│   │   ├── register/page.tsx    # Rute pengalihan ke /auth?tab=register
│   │   ├── arena/page.tsx       # Hub Arena Mode (Kuda Poni, Kangguru, Kamehameha Battle)
│   │   ├── arena/battle/page.tsx# Pertarungan Push-Up Kamehameha Dragon Ball 1v1 vs Bot
│   │   ├── kalibrasi/page.tsx   # Kalibrasi kamera & Bio-Scan skeleton overlay
│   │   ├── exercise/page.tsx    # Pelacak repetisi latihan satuan
│   │   ├── programs/page.tsx    # Katalog program latihan sains & Custom Workout Builder
│   │   ├── workout/page.tsx     # Cockpit latihan dual-mode (AI Camera / Audio Timer)
│   │   ├── leaderboard/page.tsx # Sistem 5 Kasta Liga Mingguan & bracket 11 pemain
│   │   ├── progress/page.tsx    # Dashboard progres latihan, streak, & riwayat
│   │   ├── layout.tsx           # Layout dasar & styling global
│   │   └── globals.css          # Desain sistem Tailwind v4 & tema dark cyberpunk
│   ├── components/              # Komponen UI modular
│   │   ├── AuthModal.tsx        # Modal login/registrasi alternatif
│   │   ├── CameraStage.tsx      # Kontainer video & kanvas Bio-Scan HUD
│   │   ├── ConfidenceBar.tsx    # Visualizer confidence deteksi landmark
│   │   ├── CustomWorkoutModal.tsx# Modal peracik menu latihan kustom
│   │   ├── ExerciseDock.tsx     # Bar navigasi latihan
│   │   ├── ExerciseVisual.tsx   # Wrapper visualisasi gerakan
│   │   ├── ExerciseVisual3D.tsx # Engine anatomi & biomekanika 3D interaktif (Three.js)
│   │   ├── OnboardingModal.tsx  # Assessment kebugaran awal pengguna (ACSM)
│   │   ├── RepCounterDisplay.tsx# HUD pembacaan repetisi & sudut
│   │   ├── StatusDot.tsx        # Indikator status kamera
│   │   ├── UserNavButton.tsx    # Tombol navigasi profil pengguna & sinkronisasi cloud
│   │   └── ui/CyberIcons.tsx    # Ikon vektor cyberpunk orisinal
│   ├── config/
│   │   └── exercise-levels.json # Ambang batas set/rep per tingkat kebugaran
│   ├── lib/
│   │   ├── supabase/client.ts   # Klien Supabase dengan fallback offline cerdas
│   │   └── useCountdown.ts      # Hook timer sesi serbaguna
│   └── modules/
│       ├── auth/syncManager.ts  # Manajemen autentikasi, validasi sandi, & sinkronisasi cloud
│       ├── cv-engine/           # Inti computer vision (MediaPipe, One Euro Filter, draw HUD)
│       ├── rep-counter/         # Perhitungan sudut sendi, state machine, aturan form
│       ├── game-engine/         # Loop mini-game Arena, battle push-up, audio prosedural
│       ├── program-engine/      # Katalog gerakan, program default, local persistence
│       └── gamification/        # Konfigurasi liga RPG, perhitungan EXP, bracket generator
├── .env.example                 # Template variabel lingkungan untuk Vercel/Lokal
├── supabase_schema.sql          # Skema database PostgreSQL, RLS policies, & triggers
├── vercel.json                  # Konfigurasi deployment & CDN edge caching Vercel
├── package.json                 # Dependensi & skrip proyek
├── GymQuest_AI_Coding_Briefing.md # Briefing teknis lengkap & arsitektur proyek
└── GymQuest_UIUX_Briefing.md      # Panduan desain antarmuka Modern Cyberpunk
```

---

## 🔬 Logika Inti & Arsitektur Teknis

Bagian ini merangkum pertimbangan teknis di balik arsitektur GymQuest:

### 1. CV Engine (`src/modules/cv-engine/`)

- **Dual-Pipeline Data Flow:** Koordinat mentah landmark disimpan di dalam `liveLandmarksRef` (diperbarui pada setiap frame render ~60 FPS tanpa melalui React state). Panel HUD React hanya menerima update status yang **di-throttle ke ~12 Hz** (`UI_SYNC_INTERVAL_MS = 80`). Pola ini mencegah re-render React yang tidak perlu dan membebaskan CPU/GPU untuk inferensi MediaPipe.
- **One Euro Filter Smoothing (`smoothing.ts`):** Filter adaptif berbasis frekuensi cutoff dinamis meredam getaran halus (_jitter_) saat tubuh diam, namun secara instan merespon pergerakan cepat tanpa menimbulkan lag visual.
- **Koreksi Crop `object-cover` (`drawBioScan.ts`):** MediaPipe mengembalikan landmark yang dinormalisasi ke dimensi asli kamera (misal 960×540). Saat video ditampilkan dengan gaya CSS `object-cover`, sisi video yang melebihi rasio kontainer akan terpotong. Skrip ini menghitung faktor skala dan offset potongan secara matematis sebelum merender titik skeleton ke kanvas agar overlay selalu presisi di atas tubuh.

### 2. Rep-Counter & Validasi Form (`src/modules/rep-counter/`)

- **2D Joint Vector Dot Product (`angles.ts`):** Sudut sendi dihitung menggunakan perkalian titik (_dot product_) di ruang 2D. Koordinat kedalaman Z MediaPipe sengaja diabaikan karena webcam 2D standar memiliki tingkat derau Z yang tinggi. Sudut sisi kiri dan kanan dirata-ratakan dengan bobot `visibility` landmark agar sisi tubuh yang tertutup tidak merusak kalkulasi.
- **Finite State Machine 3 Tahap (`repCounter.ts`):** Menggunakan siklus status **Naik (`up`) → Turun (`down`) → Naik (`up`)**. Repetisi baru hanya dihitung saat sendi kembali melintasi ambang atas _setelah_ sebelumnya tuntas menyentuh ambang bawah. Hal ini mencegah _double-count_ akibat getaran di sekitar satu garis ambang batas.

### 3. Game Engine Arena & Dragon Ball Battle (`src/modules/game-engine/`)

- **Sensor Gerak Kedalaman AI (Adaptive Depth Sensing):** Mengukur penurunan tubuh atas relatif terhadap jarak kamera. Fase turun memicu penumpukan Ki (`CHARGING`), sedangkan dorongan naik memicu repetisi valid dan tembakan balok energi (`KAMEHAMEHA BLAST`).
- **Kinematika Fisika Lompatan (`kangarooGame.ts`):** Menggunakan rumus fisika dasar $v = \sqrt{2 \cdot g \cdot h}$ untuk menghasilkan tinggi lompatan karakter yang konsisten pada tingkat frame rate perangkat apa pun.
- **Pemisahan Game Loop dari React State:** Seluruh logika game dijalankan melalui objek kelas murni berbasis `requestAnimationFrame`, memastikan game berjalan konstan di 60 FPS tanpa terhambat oleh siklus render React.

### 4. 3D Biomechanics Anatomy Viewer (`ExerciseVisual3D.tsx`)

- **Procedural Three.js Geometries:** Seluruh model anatomi dibuat dari geometri primitif Three.js yang dioptimasi (_capsule, sphere, cylinder_) dengan material khusus bergaya neon futuristik.
- **Agonist Highlighting:** Setiap jenis latihan menandai otot penggerak utama dengan warna cyan/magenta menyala, memberikan pemahaman visual intuitif tentang otot mana yang seharusnya berkontraksi.

### 5. Gamifikasi 5 Liga Mingguan (`src/modules/gamification/`)

- **Local-First Asynchronous Seasons:** Siklus kompetisi 168 jam dikelola secara deterministik. Sistem menghasilkan bracket kompetitor sintetis yang menantang berdasarkan profil EXP pengguna, memberikan sensasi kompetisi liga tanpa ketergantungan wajib pada koneksi server realtime.
- **Anti-Burnout Pacing:** Rumus perolehan EXP memberikan insentif lebih tinggi pada keteraturan (_streak harian_) dibandingkan durasi berlebihan dalam satu hari, mendorong kebiasaan berolahraga yang sehat dan berkelanjutan.

---

## 🌍 Keselarasan Sustainable Development Goals (SDGs)

GymQuest dirancang secara spesifik untuk mendukung agenda **Tujuan Pembangunan Berkelanjutan (SDGs)** Perserikatan Bangsa-Bangsa:

| Logo | Target SDG                                                            | Implementasi Nyata di GymQuest                                                                                                                                                                                                                         |
| ---- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🟢   | **SDG 3: Good Health and Well-being** (Kehidupan Sehat dan Sejahtera) | Mengurangi prevalensi gaya hidup sedenter (_sedentary lifestyle_) dengan menghadirkan sarana olahraga mandiri yang aman, meminimalkan risiko cedera lewat koreksi form AI real-time, serta membangun kebiasaan fisik berkelanjutan melalui gamifikasi. |
| 🔵   | **SDG 10: Reduced Inequalities** (Berkurangnya Kesenjangan)           | Menghilangkan hambatan finansial dan spasial terhadap bimbingan kebugaran berkualitas tinggi. Setiap individu dengan akses gawai ber-webcam dapat menikmati fasilitas personal training gratis tanpa biaya langganan gym mahal.                        |

---

## 📊 Status Pengembangan

Mengacu pada dokumen rencana kerja komprehensif [`GymQuest_AI_Coding_Briefing.md`](./GymQuest_AI_Coding_Briefing.md):

| Fase | Deskripsi Modul | Status |
| :--- | :--- | :--- |
| **Fase 0** | Fondasi Proyek & Konfigurasi Next.js 16 (Turbopack) | ✅ Selesai & Terverifikasi |
| **Fase 1** | Computer Vision Engine (MediaPipe WASM lokal, smoothing, Bio-Scan HUD) | ✅ Selesai & Terverifikasi |
| **Fase 2** | Rep-Counting State Machine & Form Check Biomekanik | ✅ Selesai & Terverifikasi |
| **Fase 3** | Arena Mode (Kuda Poni Terbang & Kangguru Lari) | ✅ Selesai & Terverifikasi |
| **Fase 4** | Onboarding Assessment Kebugaran (Pedoman ACSM) & Kalibrasi AI | ✅ Selesai & Terverifikasi |
| **Fase 5** | Quest Mode Cockpit Latihan & Visualisasi 3D Biomekanika Three.js | ✅ Selesai & Terverifikasi |
| **Fase 6** | Gamifikasi: Streak Tracker, Dashboard Progres & 5 Kasta Liga Mingguan | ✅ Selesai & Terverifikasi |
| **Fase 7** | Data Persistence & Cloud Sync Supabase (PostgreSQL, RLS Policies) | ✅ Selesai & Terverifikasi |
| **Fase 8** | Dragon Ball Kamehameha Push-Up Battle 1v1 vs AI Bot Leveling | ✅ Selesai & Terverifikasi |
| **Fase 9** | Halaman Autentikasi Mandiri (/auth), Validasi Sandi Kuat, & Privasi Data | ✅ Selesai & Terverifikasi |
| **Fase 10**| Deployment Vercel Edge CDN, vercel.json, & GitHub Branch Protection | ✅ Selesai & Terverifikasi |

---

## 🛠️ Tech Stack & Pustaka

| Kategori | Teknologi | Peran / Alasan Pemilihan |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Turbopack) | Arsitektur modern, server-side rendering aman, dan optimasi bundling klien. |
| **Bahasa** | [TypeScript 5](https://www.typescriptlang.org/) | Type safety tinggi untuk koordinat landmark matematika dan state machine. |
| **Library UI** | [React 19](https://react.dev/) | React primitives terkini dengan render performa tinggi. |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Styling responsif utilitas dengan tema Cyberpunk Dark Navy custom. |
| **Computer Vision** | [@mediapipe/tasks-vision](https://developers.google.com/mediapipe) | Deteksi 33 titik landmark tubuh 100% lokal berbasis WebAssembly. |
| **Visualisasi 3D** | [Three.js](https://threejs.org/) | Rendering model anatomi dan biomekanika tubuh interaktif real-time. |
| **Basis Data & Auth** | [Supabase](https://supabase.com/) (PostgreSQL) | Sinkronisasi cloud real-time, Row Level Security (RLS), dan Bcrypt password encryption. |
| **Hosting & CDN** | [Vercel](https://vercel.com/) | Edge deployment cepat dengan optimasi caching aset WebAssembly MediaPipe. |
| **Audio** | [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | Sintesis audio prosedural tanpa aset file audio eksternal (0 KB overhead). |
| **Penyimpanan Lokal** | LocalStorage API | Penyimpanan offline-first untuk profil, streak, EXP, dan riwayat latihan. |

---

## 📄 Lisensi & Hak Cipta

Dibuat dengan dedikasi untuk kompetisi **GAYATAMA 5 International Web Technology Competition** oleh **Tim Semoga Kami Beruntung**:
- **M. Faqih Ridho** (Ketua)
- **Ananda Fitri Wibowo**
- **Muhammad Ardiansyah Tri Wibowo**
- **Muhammad Ziddan Habibi**

Seluruh aset visual game dan logika arsitektur dirancang secara orisinal untuk menghormati etika karya cipta. Modul pihak ketiga (MediaPipe, Three.js, Supabase) tunduk pada lisensi open-source masing-masing (Apache-2.0 / MIT).

