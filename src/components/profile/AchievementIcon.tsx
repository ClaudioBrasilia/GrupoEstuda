import React, { useId } from 'react';

interface Props {
  name: string;
  className?: string;
}

// Ícones vetoriais customizados (gradiente) para as conquistas gerais,
// mapeados por achievements.name_key. Evita depender de emoji cru do banco.
export default function AchievementIcon({ name, className = 'h-8 w-8' }: Props) {
  const uid = useId().replace(/[:]/g, '');
  const g = (suffix: string) => `${uid}-${suffix}`;

  switch (name) {
    // categoria: points ---------------------------------------------------
    case 'studyWarrior':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('sword')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#6b7280" />
            </linearGradient>
          </defs>
          <rect x="46" y="14" width="8" height="50" rx="2" fill={`url(#${g('sword')})`} transform="rotate(45 50 50)" />
          <rect x="28" y="46" width="44" height="8" rx="2" fill="#92400e" transform="rotate(45 50 50)" />
          <circle cx="72" cy="72" r="8" fill="#78350f" />
        </svg>
      );
    case 'knowledgeSeeker':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('book')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          <path d="M14 24 C28 18 42 18 50 26 V80 C42 72 28 72 14 78 Z" fill={`url(#${g('book')})`} />
          <path d="M86 24 C72 18 58 18 50 26 V80 C58 72 72 72 86 78 Z" fill={`url(#${g('book')})`} opacity="0.8" />
        </svg>
      );
    case 'problemSolver':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('puzzle')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          <path d="M20 20 H46 V32 a8 8 0 0 1 16 0 V20 H80 V46 a8 8 0 0 0 0 16 V80 H54 a8 8 0 0 0 -16 0 H20 V54 a8 8 0 0 1 0 -16 Z" fill={`url(#${g('puzzle')})`} />
        </svg>
      );
    case 'studyMaster':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('mastercap')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d8b4fe" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
          </defs>
          <path d="M50 18 L92 38 L50 58 L8 38 Z" fill={`url(#${g('mastercap')})`} />
          <path d="M28 46 L28 70 C28 78 38 84 50 84 C62 84 72 78 72 70 L72 46 L50 58 Z" fill={`url(#${g('mastercap')})`} opacity="0.85" />
        </svg>
      );
    case 'studyLegend':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('legend')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
          <path d="M16 42 L30 58 L50 24 L70 58 L84 42 L78 78 L22 78 Z" fill={`url(#${g('legend')})`} />
          <circle cx="16" cy="38" r="6" fill={`url(#${g('legend')})`} />
          <circle cx="50" cy="18" r="7" fill={`url(#${g('legend')})`} />
          <circle cx="84" cy="38" r="6" fill={`url(#${g('legend')})`} />
        </svg>
      );

    // categoria: groups -----------------------------------------------------
    case 'groupLeader':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('leader')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="32" r="16" fill={`url(#${g('leader')})`} />
          <path d="M20 84 C20 62 32 52 50 52 C68 52 80 62 80 84 Z" fill={`url(#${g('leader')})`} />
          <circle cx="22" cy="44" r="10" fill={`url(#${g('leader')})`} opacity="0.6" />
          <circle cx="78" cy="44" r="10" fill={`url(#${g('leader')})`} opacity="0.6" />
        </svg>
      );
    case 'socialButterfly':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('butterfly')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f9a8d4" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <path d="M50 30 C40 10 10 14 12 40 C14 58 34 56 50 44 Z" fill={`url(#${g('butterfly')})`} />
          <path d="M50 30 C60 10 90 14 88 40 C86 58 66 56 50 44 Z" fill={`url(#${g('butterfly')})`} />
          <path d="M50 44 C42 60 20 62 22 78 C24 90 40 84 50 68 Z" fill={`url(#${g('butterfly')})`} opacity="0.85" />
          <path d="M50 44 C58 60 80 62 78 78 C76 90 60 84 50 68 Z" fill={`url(#${g('butterfly')})`} opacity="0.85" />
          <rect x="47" y="24" width="6" height="46" rx="3" fill="#4c1d95" />
        </svg>
      );
    case 'communityBuilder':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('build')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
          <rect x="16" y="46" width="22" height="38" fill={`url(#${g('build')})`} />
          <rect x="42" y="30" width="22" height="54" fill={`url(#${g('build')})`} opacity="0.9" />
          <rect x="68" y="54" width="18" height="30" fill={`url(#${g('build')})`} opacity="0.8" />
        </svg>
      );

    // categoria: sessions -----------------------------------------------------
    case 'consistent':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('cal')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
          </defs>
          <rect x="16" y="22" width="68" height="60" rx="8" fill={`url(#${g('cal')})`} />
          <rect x="16" y="22" width="68" height="16" rx="8" fill="#134e4a" />
          <path d="M38 56 L48 66 L66 44" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'dedicated':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('dumb')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
          <rect x="12" y="40" width="14" height="20" rx="3" fill={`url(#${g('dumb')})`} />
          <rect x="74" y="40" width="14" height="20" rx="3" fill={`url(#${g('dumb')})`} />
          <rect x="26" y="46" width="48" height="8" rx="3" fill={`url(#${g('dumb')})`} />
        </svg>
      );
    case 'unstoppable':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id={g('unstop')} cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>
          </defs>
          <path d="M50 6 C38 28 22 38 22 60 C22 80 34 92 50 92 C66 92 78 80 78 60 C78 46 70 40 66 30 C66 46 56 48 54 38 C52 28 60 18 50 6 Z" fill={`url(#${g('unstop')})`} />
        </svg>
      );

    // categoria: water -----------------------------------------------------
    case 'hydrationMaster':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('drop')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <path d="M50 10 C68 38 82 54 82 68 C82 86 68 94 50 94 C32 94 18 86 18 68 C18 54 32 38 50 10 Z" fill={`url(#${g('drop')})`} />
          <ellipse cx="40" cy="66" rx="8" ry="12" fill="#fff" opacity="0.3" />
        </svg>
      );
    case 'waterChampion':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={g('wave')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
          </defs>
          <path d="M10 50 C22 38 34 38 46 50 C58 62 70 62 82 50 L90 50 L90 90 L10 90 Z" fill={`url(#${g('wave')})`} />
          <path d="M10 66 C22 54 34 54 46 66 C58 78 70 78 82 66 L90 66 L90 90 L10 90 Z" fill={`url(#${g('wave')})`} opacity="0.7" />
        </svg>
      );

    // categoria: streak -----------------------------------------------------
    case 'streak7':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id={g('s7')} cx="50%" cy="70%" r="55%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
          </defs>
          <path d="M50 16 C42 34 30 42 30 58 C30 74 39 84 50 84 C61 84 70 74 70 58 C70 48 64 44 61 36 C61 46 55 48 53 42 C51 34 56 26 50 16 Z" fill={`url(#${g('s7')})`} />
        </svg>
      );
    case 'streak30':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id={g('s30')} cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#c2410c" />
            </radialGradient>
          </defs>
          <path d="M30 20 C24 34 16 42 16 56 C16 70 24 78 32 78 C40 78 46 70 46 58 C46 50 42 46 40 40 C40 48 36 50 34 46 C32 40 36 32 30 20 Z" fill={`url(#${g('s30')})`} opacity="0.85" />
          <path d="M64 12 C54 32 40 42 40 60 C40 78 51 90 64 90 C77 90 88 78 88 60 C88 48 80 42 76 32 C76 46 68 48 66 40 C64 30 71 22 64 12 Z" fill={`url(#${g('s30')})`} />
        </svg>
      );
    case 'streak100':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id={g('s100')} cx="50%" cy="72%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>
            <linearGradient id={g('s100crown')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <path d="M50 30 C40 50 26 58 26 74 C26 88 37 96 50 96 C63 96 74 88 74 74 C74 62 67 57 64 48 C64 60 56 62 54 54 C52 46 58 38 50 30 Z" fill={`url(#${g('s100')})`} />
          <path d="M28 24 L38 36 L50 12 L62 36 L72 24 L68 44 L32 44 Z" fill={`url(#${g('s100crown')})`} />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="40" fill="#d1d5db" />
        </svg>
      );
  }
}
