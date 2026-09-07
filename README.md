# GymQuest

Personal trainer digital gratis berbasis computer vision (deteksi pose lewat webcam) yang mengubah olahraga rumahan menjadi pengalaman bermain game (Arena Mode) sekaligus program latihan terstruktur berbasis riset (Quest Mode).

> Dokumen konteks proyek: [`GymQuest_AI_Coding_Briefing.md`](./GymQuest_AI_Coding_Briefing.md) (rencana fase pengembangan, checklist progres terkini) dan [`GymQuest_UIUX_Briefing.md`](./GymQuest_UIUX_Briefing.md) (arah desain "Modern Cyberpunk Minimalist").

**Prinsip inti:** seluruh pemrosesan computer vision berjalan **100% di browser pengguna** (client-side, via WebAssembly). Video kamera tidak pernah dikirim ke server — penting untuk privasi, latensi rendah, dan biaya hosting yang murah.

## Menjalankan Proyek

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Browser akan meminta izin akses kamera saat membuka halaman `/kalibrasi`, `/exercise`, atau `/arena`.

Perintah lain yang tersedia:

```bash
npm run build   # build produksi
npm run lint    # ESLint
npm run format  # Prettier --write
```

## Struktur Proyek

```
src/
├── app/                       # routing Next.js (App Router)
│   ├── page.tsx                 # landing page
│   ├── kalibrasi/page.tsx       # halaman kalibrasi & demo skeleton overlay
│   ├── exercise/page.tsx        # Exercise Tracker (Quest-style, single session)
│   └── arena/page.tsx           # Arena Mode: 2 mini-game
├── components/                # komponen UI reusable (CameraStage, HUD, dsb.)
├── modules/
│   ├── cv-engine/                # deteksi pose, smoothing, kalibrasi, render skeleton
│   ├── rep-counter/               # sudut sendi, state machine hitung rep, form check
│   └── game-engine/               # engine Arena Mode (2 game)
├── config/
│   └── exercise-levels.json     # target set/reps per level, berbasis kerangka ACSM
└── lib/
    └── useCountdown.ts          # timer sesi 60 detik yang dipakai bersama
```

---

## Logika Inti

Bagian ini menjelaskan **kenapa** kode ditulis seperti ini, bukan sekadar apa yang dilakukannya — supaya siapa pun yang melanjutkan proyek ini paham keputusan desain di baliknya.

### 1. CV Engine (`src/modules/cv-engine/`)

**`usePoseDetection.ts`** — hook utama yang menyalakan kamera dan menjalankan MediaPipe Pose Landmarker di setiap frame.

- **Dua jalur data yang sengaja dipisah:** hasil deteksi mentah disimpan di `liveLandmarksRef` (di-update *setiap frame*, tanpa lewat React state) sementara panel status UI dipasok dari state yang **di-throttle ke ~12 Hz** (`UI_SYNC_INTERVAL_MS = 80`). Alasannya: memanggil `setState` di setiap frame (20–30×/detik) memaksa React me-render ulang seluruh halaman hanya untuk memperbarui teks status, yang menyita waktu main-thread dari inference MediaPipe itu sendiri. Komponen visual yang butuh update per-frame (skeleton overlay di kanvas) membaca langsung dari `liveLandmarksRef`, bukan dari state.
- **Resolusi kamera 960×540**, bukan 1280×720 — model `lite` MediaPipe menskalakan input ke ukuran kecil secara internal, jadi resolusi lebih tinggi hanya menambah biaya upload tekstur GPU tanpa menambah akurasi.

**`smoothing.ts`** — implementasi **One Euro Filter** per koordinat landmark (x, y, z masing-masing punya filter sendiri, per titik sendi). Filter ini meredam jitter kecil saat tubuh diam, tapi tidak menambah lag terasa saat gerakan cepat (parameter `beta` menaikkan cutoff frequency sebanding kecepatan gerak). Ini penting karena rep-counter (bagian 2) membaca sudut sendi dari data yang sudah dihaluskan ini — tanpa filter ini, noise deteksi bisa membuat state machine rep-counter "meloncat" fase secara salah.

**`drawBioScan.ts`** — render skeleton overlay ("Bio-Scan HUD") di kanvas.

- **Koreksi crop `object-cover`:** landmark dari MediaPipe ternormalisasi terhadap *frame asli kamera* (mis. 960×540), tapi video ditampilkan dengan `object-cover` yang memotong sisi yang tidak muat ke kotak tampilan. Tanpa koreksi, titik skeleton akan meleset dari posisi tubuh sungguhan setiap kali rasio aspek kotak video berbeda dari rasio kamera. Fungsi ini menghitung ulang skala dan offset crop tersebut sebelum memetakan koordinat ke kanvas.
- Kanvas digambar dalam satuan CSS pixel dikalikan `devicePixelRatio` agar tetap tajam di layar HiDPI, bukan buram.
- Warna skeleton berubah **merah** saat form gerakan salah (lihat `formOkRef` di bagian 2) — sinyal visual langsung di titik sendi yang bermasalah, bukan cuma teks di sidebar.

**`calibration.ts`** — mengelompokkan 33 landmark tubuh menjadi 5 region (kepala, bahu, lengan, pinggul, kaki), menghitung *confidence* tiap region dari rata-rata `visibility` landmark-nya, dan memberi **pesan panduan spesifik** ("Mundur sedikit agar pinggul terlihat") untuk region pertama yang belum terdeteksi — bukan pesan generik "posisi salah".

### 2. Rep-Counter & Form Detection (`src/modules/rep-counter/`)

**`angles.ts`** — menghitung sudut antara tiga titik sendi (mis. bahu-siku-pergelangan untuk push-up) memakai *dot product* di ruang 2D. Koordinat z MediaPipe sengaja diabaikan karena jauh lebih berisik daripada x/y pada webcam biasa (bukan kamera depth). `averageJointAngle` merata-ratakan sisi kiri & kanan tubuh **dengan bobot visibility** — sisi yang tertutup badan (mis. saat push-up dari samping) tidak ikut menarik hasil ke angka yang salah.

**`exercises.ts`** — definisi tiap exercise **config-driven** dalam satu tempat: sudut sendi kunci, threshold atas/bawah, aturan form, dan petunjuk kamera. Menambah exercise baru = menambah satu entri di sini, bukan mengubah logika di banyak tempat.

**`repCounter.ts`** — state machine **naik → turun → naik**. Sebuah repetisi baru **hanya** dihitung saat sudut kembali melewati `upThreshold` *setelah* sempat menyentuh `downThreshold` terlebih dahulu (bukan setiap kali sudut melintasi satu threshold saja). Ini mencegah *double-count* akibat jitter kecil di sekitar satu titik ambang. Untuk exercise berbasis durasi (plank), tidak ada rep — yang dihitung adalah `holdSeconds`, bertambah tiap frame **hanya** selama form (`holdRule`) terpenuhi.

### 3. Game Engine — Arena Mode (`src/modules/game-engine/`)

Dua mini-game dengan **mekanisme yang sengaja dibuat berbeda** (bukan cuma reskin), supaya benar-benar terasa seperti dua game, bukan satu game dengan dua kulit:

| | Kuda Poni Terbang | Kangguru Lari |
|---|---|---|
| Exercise pengendali | Push-up (wajah) / Angkat barbel (lengan) | Squat |
| Posisi karakter | **Kontinu** — mengikuti posisi tubuh secara langsung | **Diskrit** — lompat/tunduk sebagai aksi terpisah |
| Rintangan | 1 jenis (celah vertikal, ala Flappy Bird) | 2 jenis (rintangan darat = lompati, rintangan terbang = tunduk) |
| Nyawa | 3 nyawa dengan invulnerability sesaat setelah kena | 1 kali tabrak = game over (ala endless-runner klasik) |
| Kecepatan dunia | Tetap | Meningkat seiring waktu bertahan |

**`verticalControl.ts`** — mengubah posisi mentah suatu titik tubuh (hidung untuk mode push-up, rata-rata pergelangan tangan untuk mode angkat barbel) menjadi nilai kontrol 0–1 untuk kuda poni. Bagian terpenting: **`AdaptiveRange`**, kelas yang auto-mengkalibrasi rentang gerak pengguna selama sesi berjalan — mengontraksi batas min/max secara instan begitu rekor baru ditemukan, tapi merelaksasinya perlahan (`relax = 0.01` per frame) agar rentang tetap mengikuti jika pengguna berpindah posisi. Tanpa ini, jarak pengguna ke kamera akan sangat memengaruhi seberapa jauh karakter bisa bergerak naik/turun — dengan ini, sistem menyesuaikan diri dalam beberapa repetisi pertama, siapa pun bisa langsung main tanpa kalibrasi manual.

**`ponyGame.ts`** — game loop ala Flappy Bird: `ponyY` (target) mengejar nilai dari `verticalControl` lewat interpolasi linear (`LERP_SPEED = 10`) supaya gerakan terasa halus, bukan patah-patah. Rintangan (celah vertikal) muncul berkala dan bergerak ke kiri; tabrakan dicek lewat perbandingan bounding box sederhana. **Rep-counter dari bagian 2 diintegrasikan sebagai bonus skor** — tiap repetisi valid (dideteksi lewat kenaikan `state.reps`) menambah skor terlepas dari apakah karakter sedang melewati rintangan atau tidak, supaya form yang benar tetap dihargai bahkan saat sedang menghindari rintangan.

**`kangarooGame.ts`** — endless-runner ala game dino Chrome offline, **dengan aset dan gameplay yang dirancang orisinal** (kangguru neon magenta, kristal runcing, orb melayang — bukan sprite/warna mereka) untuk menghargai hak cipta, sambil tetap mengadopsi *konsep* genre yang generik (lari tanpa henti, kecepatan meningkat). Fisika lompatan pakai rumus kinematika sederhana (`v = √(2·g·h)`) supaya tinggi lompatan konsisten berapa pun frame rate perangkat. Kontrolnya memanfaatkan **fase** dari `RepCounter` yang sudah ada di bagian 2, bukan modul kontrol baru:
- Fase `'down'` (sedang jongkok) → kangguru menunduk, menghindari rintangan terbang.
- Rep baru selesai (fase turun→naik) → memicu lompatan, menghindari rintangan darat.

Ini contoh konkret ide "config-driven, satu sumber kebenaran": exercise squat yang sama dipakai baik di Exercise Tracker maupun di game ini, tanpa duplikasi logika deteksi.

**`useArenaGame.ts` / `useKangarooGame.ts`** — hook yang menjembatani `liveLandmarksRef` (bagian 1) ke instance game (kelas biasa, bukan React state, supaya loop 60 FPS tidak dibatasi siklus render React). Pola **state React di-reset lewat render, bukan lewat `useEffect`** dipakai di sini secara sengaja — React 19 (`eslint-plugin-react-hooks` versi baru) melarang `setState` sinkron di dalam effect murni untuk kasus "menyesuaikan state saat prop berubah", karena berisiko men-trigger cascading render. Pola resminya: bandingkan kunci pelacakan (`trackedActive`) saat render, dan panggil `setState` di situ juga jika berubah — lihat komentar di kedua file untuk detail.

### 4. Sesi & Countdown (`src/lib/useCountdown.ts`)

Dipakai bersama oleh Exercise Tracker dan Arena — setiap sesi (durasi 60 detik) mulai ulang penuh setiap kali `active` menyala, dan bisa di-restart tanpa mematikan kamera lewat parameter `resetKey` (dipakai tombol "Main lagi"/"Ulangi sesi"). Sama seperti hook game di atas, reset nilai timer dilakukan lewat pola *derived state saat render*, bukan `setState` di dalam `useEffect`, untuk menghindari lint error `react-hooks/set-state-in-effect` dari React 19.

---

## Status Pengembangan

Lihat checklist lengkap per fase di [`GymQuest_AI_Coding_Briefing.md`](./GymQuest_AI_Coding_Briefing.md#6-tahapan-pengerjaan-development-phases). Ringkasan singkat:

- ✅ Fase 0 (fondasi), Fase 1 (CV Engine) — **terverifikasi dengan kamera nyata**
- 🚧 Fase 2 (rep-counting) — kode selesai, akurasi manual belum diuji
- ✅ Fase 3 (Arena Mode, 2 game) — kode selesai, belum diuji dengan kamera
- ⬜ Fase 4–10 — belum dikerjakan

Dokumentasi teknis lebih lengkap (arsitektur, instalasi, tech stack) akan dilengkapi di Fase 10 pada folder `docs/`, sesuai syarat repo kompetisi.
