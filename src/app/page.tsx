import Link from 'next/link';

const MODES = [
  {
    title: 'Program Latihan',
    accent: 'cyan',
    status: 'Aktif',
    href: '/programs',
    description:
      'Program latihan rumahan tanpa alat (Full Body, Cardio, Core, Stretching) dengan panduan form, timer, dan deteksi AI kamera.',
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
          <Link href="/progress" className="transition-colors hover:text-cyan">
            Progres
          </Link>
          <Link href="/arena" className="transition-colors hover:text-magenta">
            Arena
          </Link>
          <Link href="/kalibrasi" className="transition-colors hover:text-cyan hidden sm:inline">
            Kalibrasi
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-5 py-16 sm:py-24">
        <p className="font-mono text-xs tracking-widest text-cyan uppercase">◉ Platform Latihan Rumahan & Gamifikasi</p>

        <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight font-bold text-balance sm:text-6xl">
          Olahraga di rumah terasa seperti main game
        </h1>

        <p className="mt-5 max-w-xl font-body text-base text-muted sm:text-lg">
          Personal trainer digital tanpa alat gym yang berjalan 100% langsung di browsermu. Dilengkapi program terstruktur, timer istirahat, dan koreksi postur real-time.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/programs"
            className="clip-corner bg-gradient-to-r from-cyan to-magenta px-6 py-3 font-body text-sm font-bold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-cyan)]"
          >
            Mulai Program Latihan ▸
          </Link>
          <Link
            href="/arena"
            className="clip-corner border border-magenta/40 bg-magenta/10 px-6 py-3 font-body text-sm font-semibold text-magenta transition-colors hover:bg-magenta/20"
          >
            Mainkan Arena Mode 🎮
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {MODES.map((mode) => {
            const card = (
              <article
                key={mode.title}
                className="glass-panel clip-corner flex h-full flex-col gap-3 p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2
                    className={`font-display text-lg font-semibold ${mode.accent === 'magenta' ? 'text-magenta' : 'text-cyan'}`}
                  >
                    {mode.title}
                  </h2>
                  <span
                    className={`clip-corner px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase ${
                      mode.status !== 'Aktif'
                        ? 'bg-white/8 text-muted'
                        : mode.accent === 'magenta'
                          ? 'bg-magenta/15 text-magenta'
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
