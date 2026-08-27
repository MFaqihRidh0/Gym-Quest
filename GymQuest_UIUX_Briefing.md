# GymQuest — Briefing UI/UX Redesign (Modern Cyberpunk Minimalist)

> Dokumen ini melengkapi `GymQuest_AI_Coding_Briefing.md`. Gunakan ini sebagai acuan **desain ulang** untuk semua halaman yang sudah dibangun (Landing, Onboarding, Kalibrasi/Demo, Exercise Tracker, Arena) — bukan cuma untuk fitur baru.

---

## 1. Analisis Masalah dari Implementasi Saat Ini

Berdasarkan review screenshot yang ada, ini masalah konkret yang perlu diperbaiki, diurutkan dari paling berdampak:

1. **Ruang kosong masif** — di halaman `/demo`, `/exercise`, dan `/arena`, feed kamera dan game canvas dijejalkan ke kotak kecil pojok kiri atas, sementara 60–70% layar jadi area hitam kosong. Ini masalah layout paling serius karena membuat produk terasa belum jadi, padahal secara fungsi CV engine-nya sudah jalan.
2. **Bahasa tidak konsisten** — landing page versi Indonesia (nav: Kalibrasi/Demo/Arena/Exercise) dan versi Inggris (nav: Community/Arena/Calibration) muncul berdampingan dengan isi campur aduk (hero Inggris, card Indonesia). Perlu satu sistem bahasa yang jelas, bukan tempelan.
3. **Panel data terasa seperti debug console, bukan produk** — "STATUS KALIBRASI", "INFO ENGINE", "INPUT DATA" ditampilkan sebagai daftar teks polos dengan ✓/✗ karakter mentah. Untuk produk yang jualan "computer vision canggih", ini seharusnya terasa seperti HUD, bukan `console.log`.
4. **Ilustrasi onboarding tidak nyambung** — ilustrasi flat-style di modal "Welcome to GymQuest" (orang di ruang tamu, gaya undraw/stock illustration) bertabrakan dengan estetika dark-tech di halaman lain. Terasa seperti ditempel dari template lain.
5. **Ikon tidak konsisten** — campuran emoji (🕹️ 🌍 🔒) dan tidak ada sistem ikon yang seragam.
6. **Kartu & tombol generik** — kotak gelap bersudut tajam dengan border tipis polos, tanpa depth, tanpa sinyal visual "aktif/tidak aktif" yang jelas antar card (Coming Soon vs Active hanya beda lewat teks label kecil).
7. **Palet warna adalah pola paling umum di desain buatan AI**: latar nyaris-hitam + satu aksen cyan. Ini bukan salah, tapi belum jadi *pilihan* — baru default.

---

## 2. Arah Desain: Modern Cyberpunk Minimalist

Filosofi intinya: **restraint (minimalist) diterapkan ke bahasa visual neon/HUD (cyberpunk)** — bukan "neon di mana-mana", tapi neon dan glow dipakai presisi di tempat yang punya makna (status aktif, data live, elemen signature), sementara struktur layout, spacing, dan kartu tetap bersih dan tenang.

**Risiko estetika yang diambil (dan alasannya):** alih-alih menyembunyikan skeleton pose-tracking di panel debug kecil, jadikan **skeleton overlay itu sendiri sebagai elemen visual utama** di seluruh produk — dirender sebagai HUD bio-scan yang bercahaya, bukan titik-titik ungu polos seperti sekarang. Ini teknologi paling khas dari produk ini, jadi seharusnya jadi bagian paling menarik secara visual juga, bukan cuma fungsional.

**Dua warna neon, bukan satu** — cyan untuk identitas CV/tracking (Kalibrasi, Demo, Exercise), magenta untuk identitas Arena/game. Ini menciptakan duotone cyberpunk klasik sekaligus membantu user membedakan "mode belajar/latihan serius" vs "mode main game" hanya lewat warna dominan di layar.

---

## 3. Design Token System

Pakai token ini secara konsisten di semua komponen — jangan hardcode hex di tempat lain.

```css
:root {
  /* Warna dasar */
  --bg-void: #0A0B14;        /* latar halaman utama — biru-hitam pekat, bukan hitam murni */
  --bg-panel: #12162B;       /* permukaan card/panel */
  --accent-cyan: #00E5FF;    /* identitas CV Engine / tracking / Quest Mode */
  --accent-magenta: #FF3D9A; /* identitas Arena Mode / game */
  --accent-amber: #FFB627;   /* peringatan, status kalibrasi belum lengkap */
  --text-primary: #E8ECFF;   /* teks utama — putih dengan tint biru dingin */
  --text-muted: #7B84A8;     /* teks sekunder/caption */

  /* Glow (dipakai selektif, hanya untuk state aktif/live) */
  --glow-cyan: 0 0 24px rgba(0, 229, 255, 0.35);
  --glow-magenta: 0 0 24px rgba(255, 61, 154, 0.35);
  --glow-amber: 0 0 20px rgba(255, 182, 39, 0.35);

  /* Tipografi */
  --font-display: 'Space Grotesk', sans-serif;   /* judul, angka besar (rep counter) */
  --font-body: 'Plus Jakarta Sans', sans-serif;  /* paragraf, label, navigasi */
  --font-mono: 'JetBrains Mono', monospace;      /* SEMUA data live: FPS, confidence%, reps, timestamp */

  /* Motion */
  --dur-fast: 120ms;
  --dur-base: 240ms;
  --dur-slow: 480ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Kenapa 3 font, bukan 1–2?** Pembagian ini punya makna, bukan dekorasi: Display = suara brand (judul, angka rep besar), Body = konten manusiawi (deskripsi, instruksi), Mono = "suara mesin" (semua angka telemetry: FPS, confidence, sudut sendi). Pemisahan ini justru memperkuat kepercayaan user ke akurasi sistem — data mentah terasa seperti pembacaan sensor sungguhan, bukan teks biasa.

**Bentuk & sudut:** jangan pakai rounded-corner besar di mana-mana (kesan "SaaS ramah" generik). Gunakan radius kecil (4px) untuk elemen umum, dan **potongan sudut diagonal** (`clip-path`) untuk panel/tombol utama sebagai signature shape:

```css
.clip-corner {
  clip-path: polygon(
    14px 0, 100% 0, 100% calc(100% - 14px),
    calc(100% - 14px) 100%, 0 100%, 0 14px
  );
}

.glass-panel {
  background: rgba(18, 22, 43, 0.72);
  backdrop-filter: blur(14px) saturate(140%);
  border: 1px solid rgba(0, 229, 255, 0.22);
}
```

---

## 4. Signature Element: "Bio-Scan HUD"

Ini elemen yang akan dikenali sebagai identitas visual GymQuest — dipakai konsisten di halaman Kalibrasi, Demo, Exercise, dan Arena:

- **Joint node**: titik sendi dirender sebagai lingkaran kecil bercahaya (glow cyan), bukan titik ungu flat seperti sekarang. Pulsing halus (scale 1 → 1.08 → 1, 2 detik loop) saat terdeteksi valid.
- **Connector line**: garis antar-sendi dengan gradient tipis cyan→transparan, glow lembut.
- **Corner bracket frame**: 4 siku sudut (seperti viewfinder kamera/AR) mengelilingi area deteksi tubuh — menggantikan border kotak polos di video feed.
- **Scan sweep**: saat proses kalibrasi berlangsung, satu garis horizontal tipis menyapu dari atas ke bawah frame video (durasi ~1.5 detik, loop), memberi kesan "sedang memindai tubuh" — bukan cuma menunggu status berubah.
- **Status warna**: sendi terdeteksi = cyan; sendi tidak terdeteksi = amber pulsing di lokasi perkiraan (bukan cuma teks "Pinggul ✗" di sidebar — tunjukkan langsung di posisi yang relevan pada frame).

---

## 5. Redesign Layout per Halaman

### Landing Page

Hero jangan cuma teks + tombol — tampilkan **preview mini Bio-Scan HUD yang aktif/animasi** sebagai bagian dari hero itu sendiri, supaya pengunjung langsung melihat "ini beneran computer vision" sebelum klik apapun.

```
┌──────────────────────────────────────────────────┐
│ ⛨ GYMQUEST      Kalibrasi  Demo  Arena  Quest  EN▾│  ← nav, glass, sticky
├──────────────────────────────────────────────────┤
│  ◉ CV ENGINE: ACTIVE                    (mono)    │
│                                                     │
│  OLAHRAGA DI RUMAH TERASA SEPERTI MAIN GAME        │  ← display font, besar
│                                                     │
│  [ preview Bio-Scan HUD mini — animasi loop ]      │  ← signature element di hero
│                                                     │
│  [ Mulai Kalibrasi ▸ ]   [ Lihat Demo ]            │  ← primary clip-corner, secondary outline
├──────────────────────────────────────────────────┤
│ [CV Engine·cyan]  [Arena Mode·magenta]  [Quest·cyan]│ ← 3 card, warna sesuai identitas mode
├──────────────────────────────────────────────────┤
│ [Privasi Total]              [SDG 3 & 10]          │
└──────────────────────────────────────────────────┘
```

### Kalibrasi / Demo CV Engine

Masalah utama di sini: video kecil + ruang kosong raksasa. Perbaikan: **kamera jadi full-bleed**, panel data jadi HUD mengambang di atasnya (docked), bukan kolom terpisah yang berebut ruang dengan area kosong.

```
┌──────────────────────────────────────────────────┐
│ GYMQUEST · Kalibrasi                    ← Kembali │
├──────────────────────────────────────────────────┤
│                                    ┌─────────────┐│
│                                    │ STATUS SCAN ││  ← glass HUD, docked kanan atas
│   [ FULL-BLEED CAMERA FEED ]      │ Kepala    ●  ││
│   dengan bio-scan skeleton         │ Bahu      ●  ││
│   + corner bracket frame           │ Pinggul   ◐  ││
│   + scan sweep saat proses         │ Confidence   ││
│                                    │ ▓▓▓▓▓░░░ 44% ││
│                                    └─────────────┘│
│                                                     │
│   "Mundur sedikit agar pinggul terlihat"           │  ← pesan panduan, bukan error dingin
└──────────────────────────────────────────────────┘
```

### Exercise Tracker

Sama seperti di atas — kamera full-bleed jadi latar utama. Rep counter jadi elemen visual paling besar dan mencolok (bukan angka kecil pojok), daftar exercise jadi dock tab yang bisa disembunyikan.

```
┌──────────────────────────────────────────────────┐
│ GYMQUEST · Exercise Tracker                        │
├──────────────────────────────────────────────────┤
│                                    ┌─────────────┐│
│                                    │ Push Up      ││ ← dock exercise picker
│   [ FULL-BLEED CAMERA + SKELETON ]│ ▸ Squat      ││
│                                    │ Sit Up       ││
│                                    │ Plank        ││
│         ┌───────────┐             └─────────────┘│
│         │    12      │  ← REPS, font display     │
│         │   REPS     │    besar, glow saat naik   ┌─────────────┐
│         └───────────┘                              │ Form: BENAR ││
│                                                      │ Fase: Naik  ││
│  [ Reset ]  [ Form Feedback: On ]                   └─────────────┘
└──────────────────────────────────────────────────┘
```

### Arena Mode

Saat gameplay aktif, **game canvas jadi elemen dominan**, kamera pengguna jadi small picture-in-picture di pojok (kebalikan dari implementasi sekarang), supaya fokus pemain ke game bukan ke kamera sendiri.

```
┌──────────────────────────────────────────────────┐
│ GYMQUEST · Arena — Flappy Squat        [PIP kamera]│
├──────────────────────────────────────────────────┤
│                                                     │
│         [ GAME CANVAS — dominan, full area ]       │
│         karakter dikendalikan gerakan real-time    │
│                                                     │
│  SCORE: 240        BEST: 890                        │
└──────────────────────────────────────────────────┘
```

---

## 6. Pola Komponen UI

| Komponen | Spesifikasi |
|---|---|
| **Card/Panel** | `.glass-panel` + `.clip-corner`, padding 20–24px, judul pakai `--font-mono` uppercase kecil (eyebrow), isi pakai `--font-body` |
| **Tombol Primer** | Latar solid gradasi tipis cyan→cyan-gelap, `.clip-corner`, `box-shadow: var(--glow-cyan)` saat hover, teks `--font-body` weight 600 |
| **Tombol Sekunder** | Outline 1px `--text-muted`, transparan, hover border jadi cyan |
| **Status indikator** | Bukan ✓/✗ teks — pakai dot berwarna (cyan solid = terdeteksi, amber pulsing = belum, abu = netral) + label mono kecil di sampingnya |
| **Progress/Confidence bar** | Track abu gelap tipis, fill gradient cyan→magenta sesuai persentase, angka mono di ujung kanan |
| **Empty state** (mis. "Belum ada repetisi tercatat") | Jangan cuma teks pasif — beri instruksi aksi: *"Mulai gerakan pertamamu untuk melihat log di sini."* |
| **Badge status card** (Active/Coming Soon) | Chip kecil kanan atas card, `--font-mono`, warna latar `--bg-accent` role sesuai status (aktif = cyan tipis, coming soon = abu) |

---

## 7. Microcopy & UX Writing

- **Sentence case**, bukan Title Case atau ALL CAPS untuk label/tombol (kecuali eyebrow/HUD label yang memang gaya teknikal, itu boleh uppercase karena fungsinya seperti label sistem).
- **Verb-first untuk tombol**: "Mulai Kalibrasi", bukan "Kalibrasi" saja atau "Klik untuk Mulai".
- **Pesan error/panduan menjelaskan apa yang terjadi + cara memperbaiki**, dengan nada membantu bukan menyalahkan. Contoh yang sudah cukup baik dari implementasi sekarang: *"Pinggul tidak terlihat. Mundur sedikit agar tubuh lebih terlihat."* — pertahankan pola ini, terapkan konsisten ke semua pesan status.
- **Empty state adalah ajakan bertindak**, bukan pernyataan kosong. Ganti "Belum ada repetisi tercatat" jadi sesuatu yang mengarahkan aksi berikutnya.
- Konsistensi bahasa: **pilih satu bahasa utama untuk UI** (disarankan Bahasa Indonesia karena target user pemula lokal), dengan toggle EN yang benar-benar menerjemahkan semua string — bukan campuran seperti sekarang.

---

## 8. Motion & Interaksi

- Scan sweep saat kalibrasi (1.5s loop) — satu-satunya animasi ambient yang jalan terus, sisanya event-driven saja.
- Joint node pulse saat valid terdeteksi (2s loop, halus).
- Rep counter: sedikit scale-up (1 → 1.15 → 1, 200ms) tiap rep tervalidasi — feedback yang terasa seperti game.
- Transisi halaman: fade sederhana 200ms, hindari animasi berlebihan di banyak tempat sekaligus (satu titik animasi mencolok per layar sudah cukup, sisanya tenang).
- **Wajib**: hormati `prefers-reduced-motion` — matikan pulsing/scan sweep, ganti dengan indikator statis.

---

## 9. Aksesibilitas & Responsif

- Kontras teks minimal WCAG AA terhadap `--bg-void`/`--bg-panel` (cek khusus untuk `--text-muted` di atas panel gelap).
- Fokus keyboard harus terlihat jelas (outline cyan 2px, jangan dihilangkan dengan `outline: none` tanpa pengganti).
- Full-bleed camera layout tetap harus scalable ke mobile — di layar sempit, HUD panel yang docked di sisi kanan pindah jadi bottom sheet yang bisa di-swipe, bukan dipaksa muat di samping.
- Sediakan fallback teks untuk semua indikator warna (jangan hanya mengandalkan warna untuk makna — dot warna selalu didampingi label).

---

## 10. Tahapan Implementasi

> **Status per 2026-08-27:** Tahap A–C sudah diterapkan pada implementasi awal (landing page + halaman `/kalibrasi`). Tahap D–F menunggu Fase 2–3 briefing coding selesai karena butuh halaman Exercise Tracker & Arena.

- [x] **Tahap A — Fondasi Token**: setup CSS variables global, import font (Space Grotesk, Plus Jakarta Sans, JetBrains Mono), buat utility class `.glass-panel`, `.clip-corner`.
- [x] **Tahap B — Redesign Landing**: bahasa disatukan (Indonesia), hero baru + 3 card mode dengan badge status. *Onboarding modal belum dibuat (menunggu Fase 9).*
- [x] **Tahap C — Redesign Kalibrasi**: full-bleed camera, HUD panel docked, corner bracket frame, scan sweep, status indikator dot. *Perlu verifikasi visual dengan kamera nyata.*
- [ ] **Tahap D — Redesign Exercise Tracker**: full-bleed camera, rep counter besar dengan animasi, dock exercise picker.
- [ ] **Tahap E — Redesign Arena**: game canvas dominan, kamera jadi PIP.
- [ ] **Tahap F — Polish & Aksesibilitas**: audit kontras, fokus keyboard, reduced-motion, uji responsif mobile, hapus semua emoji jadi ikon konsisten.

---

## 11. Checklist Kesesuaian Kriteria Penilaian

| Kriteria | Bagaimana redesign ini membantu |
|---|---|
| User Experience and Interface Design (15%) | Layout full-bleed menghilangkan ruang kosong, HUD lebih jelas dibaca, microcopy lebih membantu |
| Innovation and Creativity (20%) | Bio-Scan HUD menjadikan teknologi CV sebagai elemen visual utama, bukan disembunyikan di panel debug |
| Technical Implementation (25%) | Sistem token yang konsisten menunjukkan arsitektur frontend yang rapi, bukan styling ad-hoc per halaman |
| Project Demonstration (Final, 25%) | Layout yang lebih dramatis/imersif akan jauh lebih meyakinkan saat demo 5 menit di depan juri dibanding tampilan kosong seperti sekarang |
