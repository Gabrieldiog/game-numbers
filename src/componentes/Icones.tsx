import type { ReactNode } from "react";

// Ícones de linha, geométricos e monocromáticos (herdam a cor via currentColor),
// no lugar dos emojis. Um traço só, no espírito neon do jogo.

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const DECK_ICONES: Record<string, ReactNode> = {
  // população de municípios — skyline
  "ibge-populacao-municipios": (
    <>
      <path d="M3 21V11h5v10M13 21V4h5v17" />
      <path d="M2 21h20M5 14h1M5 17h1M15 8h1M15 12h1M15 16h1" />
    </>
  ),
  // área dos estados — recorte de mapa com a capital
  "ibge-area-estados": (
    <>
      <path d="M4 8l5-3 6 2 5 3-2 7-7 3-6-4z" />
      <circle cx="12" cy="12" r="1.3" />
    </>
  ),
  // população de países — globo
  "paises-populacao": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5v17" />
      <path d="M12 3.5c3 2.4 3 14.2 0 17M12 3.5c-3 2.4-3 14.2 0 17" />
    </>
  ),
  // área dos países — polígono de território
  "paises-area": (
    <>
      <path d="M12 3l8 6-3 11H7L4 9z" />
      <path d="M12 3v18" opacity="0.5" />
    </>
  ),
  // PIB — moedas empilhadas
  "paises-pib": (
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="3" />
      <path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      <path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>
  ),
  // animais — raio (velocidade)
  "animais-velocidade": <path d="M13 2 4 14h7l-1 8 10-13h-7z" />,
  // filmes — botão de play
  "filmes-bilheteria": (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M10 8.5l6 3.5-6 3.5z" />
    </>
  ),
  // montanhas — picos
  "montanhas-altura": (
    <>
      <path d="M3 20l6-12 4 7 3-4 5 9z" />
      <path d="M8 11l1-2 1 2" opacity="0.6" />
    </>
  ),
  // prédios — torre
  "predios-altura": (
    <>
      <path d="M8 21V7h8v14M12 7V3" />
      <path d="M6 21h12M11 11h2M11 15h2" />
    </>
  ),
  // planetas — planeta com anel
  "planetas-diametro": (
    <>
      <circle cx="12" cy="12" r="5" />
      <ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-24 12 12)" />
    </>
  ),
};

export function IconeDeck({ id, className }: { id: string; className?: string }) {
  return <Svg className={className}>{DECK_ICONES[id] ?? <circle cx="12" cy="12" r="8" />}</Svg>;
}

const AVULSOS: Record<string, ReactNode> = {
  // desafio do dia — calendário
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 9.5h18M8 3v4M16 3v4" />
      <path d="M8 14h2M14 14h2M8 17.5h2" opacity="0.7" />
    </>
  ),
  // 1v1 — duas setas se enfrentando
  versus: (
    <>
      <path d="M10 5 4 12l6 7" />
      <path d="M14 5l6 7-6 7" />
    </>
  ),
  // clássico — alvo
  alvo: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>
  ),
  // 3 vidas — coração
  coracao: <path d="M12 20.5C7 17 3.5 13.8 3.5 9.8 3.5 7.2 5.5 5.3 8 5.3c1.6 0 3.1.9 4 2.3.9-1.4 2.4-2.3 4-2.3 2.5 0 4.5 1.9 4.5 4.5 0 4-3.5 7.2-8.5 10.7z" />,
  // blitz — relógio
  blitz: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V8.5M12 13l3 2M9 3h6" />
    </>
  ),
};

export function Icone({ nome, className }: { nome: keyof typeof AVULSOS | string; className?: string }) {
  return <Svg className={className}>{AVULSOS[nome] ?? <circle cx="12" cy="12" r="8" />}</Svg>;
}
