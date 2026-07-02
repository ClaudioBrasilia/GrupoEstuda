import React, { useId } from 'react';

interface Props {
  name: string;
  className?: string;
}

// Ícones vetoriais customizados (gradiente) para cada item da loja de avatares.
// Mapeados pelo nome do item (avatar_items.name) para evitar mudanças no schema.
export default function AvatarItemIcon({ name, className = 'h-8 w-8' }: Props) {
  const uid = useId().replace(/[:]/g, '');
  const gradId = (suffix: string) => `${uid}-${suffix}`;

  switch (name) {
    case 'Chapéu de Formatura':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={gradId('cap')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <path d="M50 20 L92 38 L50 56 L8 38 Z" fill={`url(#${gradId('cap')})`} />
          <path d="M28 46 L28 68 C28 76 38 82 50 82 C62 82 72 76 72 68 L72 46 L50 56 Z" fill={`url(#${gradId('cap')})`} opacity="0.85" />
          <circle cx="92" cy="38" r="3.5" fill="#78350f" />
          <line x1="92" y1="38" x2="92" y2="66" stroke="#78350f" strokeWidth="2" />
        </svg>
      );

    case 'Aura de Fogo':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id={gradId('fire')} cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#dc2626" />
            </radialGradient>
          </defs>
          <path
            d="M50 10 C40 30 25 38 25 58 C25 76 36 90 50 90 C64 90 75 76 75 58 C75 46 68 40 64 32 C64 46 56 48 54 40 C52 32 58 22 50 10 Z"
            fill={`url(#${gradId('fire')})`}
          />
        </svg>
      );

    case 'Aura Elétrica':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={gradId('bolt')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="42" fill={`url(#${gradId('bolt')})`} opacity="0.15" />
          <path d="M56 8 L26 56 L46 56 L40 92 L76 42 L54 42 Z" fill={`url(#${gradId('bolt')})`} />
        </svg>
      );

    case 'Moldura Dourada':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={gradId('gold')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="38" fill="none" stroke={`url(#${gradId('gold')})`} strokeWidth="9" />
          <circle cx="50" cy="34" r="12" fill={`url(#${gradId('gold')})`} />
          <path d="M50 44 L38 78 L50 70 L62 78 Z" fill={`url(#${gradId('gold')})`} />
        </svg>
      );

    case 'Moldura Diamante':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={gradId('dia')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cffafe" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
          </defs>
          <path d="M25 35 L50 12 L75 35 L50 90 Z" fill={`url(#${gradId('dia')})`} />
          <path d="M25 35 L75 35 L50 90 Z" fill="#fff" opacity="0.15" />
          <path d="M50 12 L38 35 L62 35 Z" fill="#fff" opacity="0.35" />
        </svg>
      );

    case 'Coroa de Mestre':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={gradId('master')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e9d5ff" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6b21a8" />
            </linearGradient>
          </defs>
          <path
            d="M18 40 L32 60 L50 26 L68 60 L82 40 L76 76 L24 76 Z"
            fill={`url(#${gradId('master')})`}
          />
          <circle cx="18" cy="36" r="6" fill={`url(#${gradId('master')})`} />
          <circle cx="50" cy="20" r="7" fill={`url(#${gradId('master')})`} />
          <circle cx="82" cy="36" r="6" fill={`url(#${gradId('master')})`} />
        </svg>
      );

    case 'Troféu de Campeão':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={gradId('trophy')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          <path d="M34 20 H66 V44 C66 58 58 66 50 66 C42 66 34 58 34 44 Z" fill={`url(#${gradId('trophy')})`} />
          <path d="M34 24 H20 C20 40 28 48 34 48 Z" fill={`url(#${gradId('trophy')})`} opacity="0.85" />
          <path d="M66 24 H80 C80 40 72 48 66 48 Z" fill={`url(#${gradId('trophy')})`} opacity="0.85" />
          <rect x="44" y="64" width="12" height="14" fill={`url(#${gradId('trophy')})`} />
          <rect x="32" y="78" width="36" height="8" rx="2" fill={`url(#${gradId('trophy')})`} />
        </svg>
      );

    case 'Coroa Real':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={gradId('royal')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
          <path
            d="M16 42 L30 58 L50 24 L70 58 L84 42 L78 78 L22 78 Z"
            fill={`url(#${gradId('royal')})`}
          />
          <circle cx="16" cy="38" r="6" fill={`url(#${gradId('royal')})`} />
          <circle cx="50" cy="18" r="7" fill={`url(#${gradId('royal')})`} />
          <circle cx="84" cy="38" r="6" fill={`url(#${gradId('royal')})`} />
          <circle cx="50" cy="62" r="4" fill="#fff" opacity="0.8" />
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
