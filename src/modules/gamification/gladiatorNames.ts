/**
 * Modul pembuat dan pengelola nama gladiator unik otomatis untuk mode Arena PvP
 * Mencegah bentrok username dan memastikan setiap pemain memiliki identitas unik.
 */

const GLADIATOR_PREFIXES = [
  'CyberKnight',
  'NeonSpartan',
  'IronValkyrie',
  'ShadowStriker',
  'TitanForce',
  'AeroGladiator',
  'ApexWarrior',
  'VoltBerserker',
  'SolarGuardian',
  'QuantumRebel',
  'FrostPhantom',
  'ThunderChampion',
  'HyperNova',
  'ZeroGravity',
  'PlasmaBlaster',
];

export function generateRandomGladiatorName(): string {
  const prefix = GLADIATOR_PREFIXES[Math.floor(Math.random() * GLADIATOR_PREFIXES.length)];
  const num = Math.floor(100 + Math.random() * 900); // 3 digit angka unik: 100 - 999
  return `${prefix}-${num}`;
}

export function getOrCreatePlayerUsername(): string {
  if (typeof window === 'undefined') return 'Gladiator-01';

  try {
    // 1. Cek apakah ada profil akun yang sudah punya username kustom
    const rawProfile = localStorage.getItem('gymquest_user_profile');
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      if (
        parsed.username &&
        typeof parsed.username === 'string' &&
        parsed.username.trim() &&
        parsed.username !== 'Knight-01' &&
        parsed.username !== 'Kamu (Knight-01)' &&
        parsed.username !== 'Gladiator'
      ) {
        return parsed.username.trim();
      }
    }

    // 2. Cek apakah ada persistent player tag unik tersimpan di device/browser ini
    const savedTag = localStorage.getItem('gymquest_gladiator_tag');
    if (savedTag && savedTag.trim()) {
      return savedTag.trim();
    }

    // 3. Buat nama gladiator acak yang unik khusus untuk browser/perangkat ini
    const newName = generateRandomGladiatorName();
    localStorage.setItem('gymquest_gladiator_tag', newName);

    // Update username di user profile lokal jika ada
    if (rawProfile) {
      try {
        const parsed = JSON.parse(rawProfile);
        parsed.username = newName;
        localStorage.setItem('gymquest_user_profile', JSON.stringify(parsed));
      } catch {
        // Abaikan parse error
      }
    }

    return newName;
  } catch {
    return `Gladiator-${Math.floor(100 + Math.random() * 900)}`;
  }
}
