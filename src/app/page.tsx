import Link from 'next/link';
import { UserNavButton } from '@/components/UserNavButton';

const MODES = [
  {
    title: 'Program Latihan',
    accent: 'cyan',
    status: 'Aktif',
    href: '/programs',
    description:
      'Program latihan rumahan tanpa alat (Full Body, Cardio, Core, Stretching) dengan panduan form 3D 360°, timer, dan deteksi AI kamera.',
  },
  {
    title: 'Arena Mode',
    accent: 'magenta',
    status: 'Aktif',
    href: '/arena',
    description:
      'Mini-game interaktif Kuda Poni (Push-up) dan Kangguru (Angkat Barbel) yang dikendalikan langsung oleh gerakan fisik nyata.',
  },
  {
    title: 'Progres & Streak',
    accent: 'cyan',
    status: 'Aktif',
    href: '/progress',
    description:
      'Kalender latihan bulanan interaktif, penghitung streak harian beruntun, serta total durasi dan estimasi kalori terbakar.',
  },
  {
    title: '5 Liga & Leaderboard',
    accent: 'yellow',
    status: 'Aktif',
    href: '/leaderboard',
    description:
      'Sistem kompetisi 5 kasta liga (Iron, Bronze, Silver, Gold, Titan) berbasis EXP mingguan dengan siklus evaluasi 7 hari.',
  },
] as const;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="glass-panel sticky top-0 z-10 flex items-center justify-between border-x-0 border-t-0 px-5 py-3">
        <span className="font-display text-sm tracking-wide">GYMQUEST</span>
        <nav className="flex items-center gap-5 font-body text-sm text-muted">
          <Link href="/programs" className="text-white hover:text-cyan transition-colors font-medium">
            Program
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-yellow-400 font-medium">
            Leaderboard
          </Link>
          <Link href="/progress" className="transition-colors hover:text-cyan">
            Progres
          </Link>
          <Link href="/arena" className="transition-colors hover:text-magenta">
            Arena
          </Link>
          <Link href="/kalibrasi" className="transition-colors hover:text-cyan hidden sm:inline">
            Kalibrasi
          </Link>
          <UserNavButton />
        </nav>
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-5 py-16 sm:py-24">
        <p className="font-mono text-xs tracking-widest text-cyan uppercase">◉ Platform Latihan Rumahan & Gamifikasi</p>

        <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight font-bold text-balance sm:text-6xl">
          Olahraga di rumah terasa seperti main game
        </h1>

        <p className="mt-5 max-w-xl font-body text-base text-muted sm:text-lg">
          Personal trainer digital tanpa alat gym yang berjalan 100% langsung di browsermu. Dilengkapi program terstruktur, panduan visual 3D 360°, timer istirahat, dan leaderboard 5 liga mingguan.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/programs"
            className="clip-corner bg-gradient-to-r from-cyan to-magenta px-6 py-3 font-body text-sm font-bold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-cyan)]"
          >
            Mulai Program Latihan ▸
          </Link>
          <Link
            href="/leaderboard"
            className="clip-corner border border-yellow-400/50 bg-yellow-400/10 px-6 py-3 font-body text-sm font-semibold text-yellow-400 transition-colors hover:bg-yellow-400/20"
          >
            Cek Liga & Leaderboard 🏆
          </Link>
          <Link
            href="/arena"
            className="clip-corner border border-magenta/40 bg-magenta/10 px-6 py-3 font-body text-sm font-semibold text-magenta transition-colors hover:bg-magenta/20"
          >
            Arena Mode 🎮
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((mode) => {
            const card = (
              <article
                key={mode.title}
                className="glass-panel clip-corner flex h-full flex-col gap-3 p-6 transition-all hover:border-white/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2
                    className={`font-display text-lg font-semibold ${
                      mode.accent === 'magenta'
                        ? 'text-magenta'
                        : mode.accent === 'yellow'
                          ? 'text-yellow-400'
                          : 'text-cyan'
                    }`}
                  >
                    {mode.title}
                  </h2>
                  <span
                    className={`clip-corner px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase ${
                      mode.status !== 'Aktif'
                        ? 'bg-white/8 text-muted'
                        : mode.accent === 'magenta'
                          ? 'bg-magenta/15 text-magenta'
                          : mode.accent === 'yellow'
                            ? 'bg-yellow-400/15 text-yellow-400'
                            : 'bg-cyan/15 text-cyan'
                    }`}
                  >
                    {mode.status}
                  </span>
                </div>
                <p className="font-body text-sm text-muted">{mode.description}</p>
              </article>
            );

            return mode.href ? (
              <Link key={mode.title} href={mode.href} className="group">
                {card}
              </Link>
            ) : (
              card
            );
          })}
        </div>

        <p className="mt-12 max-w-2xl font-body text-xs text-muted">
          GymQuest adalah alat bantu latihan, bukan pengganti nasihat dokter atau pelatih
          bersertifikat. Hentikan latihan jika kamu merasa nyeri atau tidak nyaman.
        </p>
      </section>
    </main>
  );
}
