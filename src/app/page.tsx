import Link from 'next/link';

const MODES = [
  {
    title: 'CV Engine',
    accent: 'cyan',
    status: 'Aktif',
    href: '/kalibrasi',
    description:
      'Deteksi pose tubuh lewat webcam, berjalan penuh di browser. Video tidak pernah meninggalkan perangkatmu.',
  },
  {
    title: 'Arena Mode',
    accent: 'magenta',
    status: 'Segera',
    href: null,
    description:
      'Mini-game yang dikendalikan gerakan tubuh nyata. Setiap repetisi dengan form benar jadi poin.',
  },
  {
    title: 'Quest Mode',
    accent: 'cyan',
    status: 'Segera',
    href: null,
    description:
      'Program latihan harian berbasis pedoman ilmiah, lengkap dengan aturan istirahat anti-overtraining.',
  },
] as const;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="glass-panel sticky top-0 z-10 flex items-center justify-between border-x-0 border-t-0 px-5 py-3">
        <span className="font-display text-sm tracking-wide">GYMQUEST</span>
        <nav className="flex gap-5 font-body text-sm text-muted">
          <Link href="/kalibrasi" className="transition-colors hover:text-cyan">
            Kalibrasi
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-5 py-16 sm:py-24">
        <p className="font-mono text-xs tracking-widest text-cyan uppercase">◉ CV Engine: siap</p>

        <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight font-bold text-balance sm:text-6xl">
          Olahraga di rumah terasa seperti main game
        </h1>

        <p className="mt-5 max-w-xl font-body text-base text-muted sm:text-lg">
          Personal trainer digital yang gratis, jalan langsung di browser, dan mengoreksi gerakanmu
          secara real-time — tanpa alat mahal, tanpa biaya bulanan.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/kalibrasi"
            className="clip-corner bg-cyan px-6 py-3 font-body text-sm font-semibold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-cyan)]"
          >
            Mulai kalibrasi ▸
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
                      mode.status === 'Aktif' ? 'bg-cyan/15 text-cyan' : 'bg-white/8 text-muted'
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
