# 🏋️‍♂️ GYMQUEST — Konsep, Ide, & Visi Platform

> **Elevator Pitch:**  
> *"GymQuest adalah platform Personal Trainer digital cerdas dan gratis yang berjalan 100% langsung di browser web. Menggabungkan teknologi Computer Vision real-time, visualisasi biomekanika 3D interaktif, kurikulum sains olahraga, dan gamifikasi RPG adiktif, GymQuest mengubah olahraga mandiri di rumah menjadi petualangan kebugaran yang aman, presisi, dan menyenangkan tanpa perlu alat mahal maupun biaya langganan."*

---

## 🧭 1. Apa Itu GymQuest?

**GymQuest** adalah aplikasi web modern (*progressive web application*) yang dirancang sebagai **asisten kebugaran dan pelatih pribadi (AI Personal Trainer)** untuk siapa saja yang ingin berolahraga di rumah. 

Alih-alih sekadar menampilkan video tutorial statis yang pasif seperti di YouTube, GymQuest **"melihat" dan "memahami"** gerakan pengguna secara langsung melalui kamera webcam laptop atau smartphone:
- Memandu postur gerak dengan perhitungan sudut sendi biomekanik (*joint angles*).
- Menghitung repetisi secara otomatis dan akurat saat batas gerakan valid terpenuhi.
- Memberikan koreksi suara (*voice audio feedback*) secara langsung jika terjadi kesalahan postur yang berpotensi memicu cedera.
- Menampilkan model anatomi 3D interaktif untuk menunjukkan kelompok otot yang sedang aktif.
- Membungkus seluruh aktivitas latihan ke dalam mode pertarungan game (*Battle Arena*) dan sistem kompetisi liga bertingkat ala game RPG.

---

## 🎯 2. Masalah Nyata yang Diselesaikan (Latar Belakang)

Banyak orang menyadari pentingnya hidup sehat, namun menemui dinding penghalang yang nyata:

| Hambatan Utama | Masalah di Lapangan | Solusi yang Ditawarkan GymQuest |
|---|---|---|
| **Finansial & Akses** | Biaya sewa Personal Trainer (PT) bersertifikat mahal (Rp 500.000 – Rp 2.500.000+/bulan) dan gym tidak merata di semua daerah. | **100% Gratis & Terbuka**: Cukup browser dan kamera bawaan laptop/HP tanpa perangkat keras tambahan. |
| **Tingginya Risiko Cedera** | 30–40% orang yang olahraga mandiri di rumah mengalami cedera (lutut kolaps, punggung bungkuk) karena tidak ada yang mengoreksi form. | **AI Pose Guidance & Koreksi Real-Time**: Deteksi 33 titik sendi dengan validasi batas fleksi/ekstensi dan peringatan instan. |
| **Hilangnya Motivasi (Drop-out)** | Lebih dari 60% orang berhenti berolahraga dalam 30 hari pertama karena repetisi terasa monoton, sepi, dan membosankan. | **Gamifikasi Penuh (RPG & Arena)**: Mengubah push-up menjadi jurus Kamehameha, liga mingguan, EXP, daily streak, dan badge prestasi. |
| **Isu Privasi Kamera** | Pengguna enggan menyalakan kamera di dalam kamar/rumah jika rekaman video dikirim ke server orang lain. | **100% Client-Side Privacy**: Pemrosesan AI berjalan lokal di browser via WebAssembly (WASM). Video tidak pernah keluar dari perangkat pengguna. |

---

## 🏛️ 3. Tiga Pilar Pengalaman Pengguna (Fitur Utama)

GymQuest memiliki 3 pilar pengalaman yang saling melengkapi:

### 1. 🛡️ Quest Mode — Cockpit Latihan Sains Olahraga (`/programs` & `/workout`)
Ditujukan bagi pengguna yang ingin latihan terstruktur layaknya bersama pelatih profesional:
- **Smart Assessment:** Menyesuaikan program berdasarkan level kebugaran (*Pemula*, *Menengah*, *Mahir*) dan target utama (*Bina Otot*, *Bakar Lemak*, *Mobilitas & Sendi*).
- **Kurikulum Berbasis Sains (ACSM Framework):** Program latihan yang dirancang dengan rasio intensitas, repetisi, set, dan jeda istirahat yang aman.
- **Custom Workout Builder:** Memungkinkan pengguna meracik variasi gerakan sendiri sesuai kebutuhan harian.
- **Dual-Runner Mode:**
  - *AI Camera Mode*: AI memindai sendi tubuh, menghitung rep otomatis, dan memberi peringatan suara instan.
  - *Manual / Audio Timer Mode*: Tetap dapat digunakan di ruangan gelap atau tanpa izin kamera dengan pemandu suara dan pewaktu otomatis.

### 2. 🧬 3D Interactive Biomechanics Viewer (Three.js)
Terintegrasi di dalam layar latihan untuk memberikan pemahaman anatomi mendalam:
- **Manekin Anatomi 3D 360°:** Pengguna dapat memutar, memperbesar, dan mengamati contoh postur gerak ideal dari berbagai sudut pandang.
- **Highlight Otot Agonis & Sinergis:** Warna neon menyala menunjukkan otot mana yang menjadi fokus utama latihan dan otot mana yang berfungsi sebagai penstabil (*stabilizer*).
- **Indikator Pencegahan Cedera:** Visualisasi sudut aman sendi (misalnya batas tekukan lutut pada squat atau posisi siku pada push-up).

### 3. 🎮 Arena Mode — Gamified Calisthenics (`/arena`)
Mengubah latihan kalistenik berat menjadi kontrol permainan arkade interaktif:
- 💥 **Dragon Ball Push-Up Battle (`/arena/battle`):**
  - Kamera mendeteksi kedalaman push-up secara real-time.
  - Saat dada turun mendekat ke lantai (>60%), sistem masuk ke status *Charging Ki*.
  - Saat tubuh didorong naik kembali, repetisi valid melepaskan tembakan balok energi dahsyat **KAMEHAMEHA** untuk mengalahkan bos/musuh!
- 🦄 **Kuda Poni Terbang (Fly & Dodge):**
  - Mengontrol ketinggian terbang karakter menggunakan ketinggian tangan (bicep curl/angkat beban) atau posisi push-up.
- 🦘 **Kangguru Lari (Endless Squat Runner):**
  - Menunduk menghindari rintangan dengan gerakan squat, dan melompat dengan mengangkat tubuh kembali.

---

## 🏆 4. Ekosistem Gamifikasi & Motivasi Berkelanjutan

Agar olahraga menjadi rutinitas jangka panjang, GymQuest mengadopsi psikologi game:

1. **5 Kasta Liga Mingguan (`/leaderboard`):**
   - 🛡️ *Iron Initiate* → 🥉 *Bronze Brawler* → 🥈 *Silver Striker* → 🥇 *Gold Gladiator* → 👑 *Titan Colossus*.
   - Setiap minggu, pengguna bersaing di bracket 11 atlet dengan sistem promosi (3 teratas naik kasta) dan degradasi (3 terbawah turun kasta).
2. **Sistem EXP & Dynamic Formula:**
   - EXP dihitung secara adil dari durasi latihan nyata, ketepatan form, dan jumlah repetisi valid.
3. **Daily Streak & Streak Freeze:**
   - Menjaga api disiplin harian dengan multiplier bonus EXP dan pelindung streak jika berhalangan latihan satu hari.
4. **Dashboard Progres Komprehensif (`/progress`):**
   - Statistik total repetisi, waktu olahraga, estimasi kalori, kalender heatmap latihan, dan pencapaian lencana (*achievements*).

---

## ⚡ 5. Arsitektur Teknis & Keunggulan Rekayasa

GymQuest dibangun dengan filosofi modern **Privacy-First & Edge-Computing**:

```
[ Pengguna & Kamera ]
        │ (Video Frame Lokal 60 FPS)
        ▼
[ MediaPipe Pose Landmarker (Client-Side WASM / WebGL) ]
        │ (33 Titik Landmark 3D)
        ▼
[ One Euro Filter (Anti-Jitter & Noise Reduction) ]
        │ (Koordinat Sendi Halus)
        ▼
[ Finite State Machine (FSM) & Biomechanics Engine ]
   ├── Penghitungan Sudut Sendi & Form Check
   ├── Validasi Repetisi Otomatis
   ├── Kontrol Real-time Mini-Game (Arena)
   └── Web Audio API (Sintesis Suara Prosedural Tanpa File MP3 Eksternal)
        │
        ▼
[ Supabase Cloud Sync + LocalStorage (Offline-First) ]
```

### Keunggulan Utama:
- **Zero Latency**: Semua inferensi berlangsung di komputer pengguna (<16 milidetik per frame).
- **Zero Cloud GPU Cost**: Server tidak dibebani komputasi video, membuat aplikasi ini sangat hemat biaya operasional dan dapat diskalakan secara masif.
- **Audio Prosedural**: Efek suara dan musik latar disintesis langsung melalui kode Web Audio API tanpa membutuhkan kuota besar untuk unduh aset audio.

---

## 🌟 6. Visi Sosial: Olahraga untuk Semua (SDG Alignment)

GymQuest tidak hanya dibangun sebagai proyek teknologi, tetapi juga berpihak pada misi sosial:
- **SDG 3 (Good Health and Well-Being):** Membantu menurunkan angka penyakit tidak menular (diabetes, obesitas, penyakit kardiovaskular) dengan menyediakan akses olahraga yang terarah dan bebas cedera bagi masyarakat luas.
- **SDG 10 (Reduced Inequalities):** Menghilangkan jurang kesenjangan antara kalangan berpunya yang mampu membayar trainer pribadi mahal dan masyarakat umum yang hanya memiliki ponsel/laptop biasa.

---

*Dokumen ini menyajikan ringkasan utuh mengenai identitas, visi, arsitektur, dan nilai manfaat GymQuest.*
