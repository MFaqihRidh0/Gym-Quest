# GymQuest

Personal trainer digital gratis berbasis computer vision (deteksi pose lewat webcam) yang mengubah olahraga rumahan menjadi pengalaman bermain game (Arena Mode) sekaligus program latihan terstruktur berbasis riset (Quest Mode).

> Dokumen konteks proyek: [`GymQuest_AI_Coding_Briefing.md`](./GymQuest_AI_Coding_Briefing.md) (rencana fase pengembangan) dan [`GymQuest_UIUX_Briefing.md`](./GymQuest_UIUX_Briefing.md) (arah desain).

**Status:** Fase 0 (fondasi proyek) — lihat checklist di `GymQuest_AI_Coding_Briefing.md` untuk progres terkini.

## Menjalankan Proyek

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Struktur Proyek

```
src/
├── app/                    # routing Next.js
├── components/
├── modules/
│   ├── cv-engine/          # pose detection, kalibrasi
│   ├── rep-counter/        # state machine hitung rep + form check
│   ├── game-engine/        # Arena Mode
│   ├── program-engine/     # Quest Mode, weekly split, anti-overtraining
│   └── gamification/       # XP, badge, streak
├── config/
│   └── exercise-levels.json
└── lib/                    # supabase client, utils
```

Dokumentasi lebih lengkap (arsitektur, instalasi, tech stack) akan dilengkapi di Fase 10 pada folder `docs/`.
