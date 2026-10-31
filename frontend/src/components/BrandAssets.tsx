import React from 'react';

export const PetHubMascotAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  showGoldenBadge?: boolean;
}> = ({ size = 'md', showGoldenBadge = false }) => {
  const dims =
    size === 'lg'
      ? 'w-28 h-28'
      : size === 'md'
        ? 'w-20 h-20'
        : 'w-9 h-9';

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full bg-[#FFF6EB] shadow-md ${dims}`}>
      <svg viewBox="0 0 120 120" className="w-[78%] h-[78%]" fill="none">
        {/* Ears */}
        <ellipse cx="26" cy="58" rx="14" ry="20" transform="rotate(-12 26 58)" fill="#6E3B2E" />
        <ellipse cx="28" cy="58" rx="8" ry="13" transform="rotate(-12 28 58)" fill="#9E5847" />
        <ellipse cx="94" cy="58" rx="14" ry="20" transform="rotate(12 94 58)" fill="#6E3B2E" />
        <ellipse cx="92" cy="58" rx="8" ry="13" transform="rotate(12 92 58)" fill="#9E5847" />
        {/* Head */}
        <circle cx="60" cy="62" r="32" fill="#D58667" />
        {/* Snout / Face patch */}
        <ellipse cx="60" cy="69" rx="22" ry="17" fill="#FBE5D2" />
        {/* Eyes */}
        <circle cx="48" cy="57" r="5.5" fill="#2A1F1D" />
        <circle cx="46.5" cy="55.2" r="2" fill="#FFFFFF" />
        <circle cx="72" cy="57" r="5.5" fill="#2A1F1D" />
        <circle cx="70.5" cy="55.2" r="2" fill="#FFFFFF" />
        {/* Blush */}
        <ellipse cx="41" cy="67" rx="4.5" ry="2.5" fill="#F09A8C" opacity="0.75" />
        <ellipse cx="79" cy="67" rx="4.5" ry="2.5" fill="#F09A8C" opacity="0.75" />
        {/* Nose & Smile */}
        <ellipse cx="60" cy="64" rx="4.2" ry="3" fill="#2A1F1D" />
        <path
          d="M55 70C56.8 72.5 63.2 72.5 65 70"
          stroke="#2A1F1D"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M58 71.5C58 74 62 74 62 71.5" fill="#E56B6F" />
      </svg>

      {showGoldenBadge && (
        <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#F3B63F] border-2 border-[#FFF6EB] flex items-center justify-center text-[11px] shadow-sm">
          🐾
        </span>
      )}
    </div>
  );
};

export const PetHubWordmark: React.FC<{
  light?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ light = true, size = 'lg' }) => {
  const textSize =
    size === 'lg'
      ? 'text-3xl'
      : size === 'md'
        ? 'text-2xl'
        : 'text-lg';

  return (
    <div className="inline-flex items-center gap-2 select-none">
      <span
        style={{ fontFamily: 'var(--font-brand)' }}
        className={`font-black tracking-tight ${textSize} ${
          light ? 'text-[#FFF6EB]' : 'text-[#A9503B]'
        }`}
      >
        PetHub
      </span>
      <span className="px-2.5 py-0.5 rounded-full bg-[#F3B63F] text-[#302B29] text-[10px] font-extrabold tracking-wider uppercase shadow-xs">
        CLUB
      </span>
    </div>
  );
};

export const HangingCatMascot: React.FC = () => (
  <svg
    viewBox="0 0 180 260"
    className="w-36 h-52 drop-shadow-md animate-cat-swing"
    fill="none"
  >
    {/* Left & right arms reaching up to curtain */}
    <rect x="64" y="6" width="11" height="48" rx="5.5" fill="#A9503B" />
    <rect x="105" y="6" width="11" height="48" rx="5.5" fill="#A9503B" />
    {/* White paws gripping the edge */}
    <ellipse cx="69.5" cy="7" rx="8.5" ry="5" fill="#FFF6EB" />
    <circle cx="65" cy="6" r="2" fill="#C57969" />
    <circle cx="69.5" cy="5" r="2" fill="#C57969" />
    <circle cx="74" cy="6" r="2" fill="#C57969" />

    <ellipse cx="110.5" cy="7" rx="8.5" ry="5" fill="#FFF6EB" />
    <circle cx="106" cy="6" r="2" fill="#C57969" />
    <circle cx="110.5" cy="5" r="2" fill="#C57969" />
    <circle cx="115" cy="6" r="2" fill="#C57969" />

    {/* Tail */}
    <path
      d="M90 175 C90 215, 52 225, 45 205 C40 192, 54 185, 60 190"
      stroke="#7C3626"
      strokeWidth="9"
      strokeLinecap="round"
      fill="none"
    />

    {/* Hind legs */}
    <path d="M76 168 L52 195" stroke="#B65744" strokeWidth="14" strokeLinecap="round" />
    <path d="M104 168 L128 195" stroke="#B65744" strokeWidth="14" strokeLinecap="round" />
    {/* Pink paw pads */}
    <ellipse cx="48" cy="198" rx="10" ry="8" fill="#C57969" />
    <circle cx="48" cy="199" r="4" fill="#F5C3B8" />
    <ellipse cx="132" cy="198" rx="10" ry="8" fill="#C57969" />
    <circle cx="132" cy="199" r="4" fill="#F5C3B8" />

    {/* Elongated cat torso */}
    <path d="M74 88 L106 88 L113 172 C113 177 67 177 67 172 Z" fill="#B65744" />
    {/* Cute spots on torso */}
    <ellipse cx="79" cy="128" rx="4" ry="6" fill="#F5D0C5" />
    <ellipse cx="103" cy="156" rx="3" ry="5" fill="#F5D0C5" />
    <circle cx="96" cy="105" r="2.5" fill="#F5D0C5" />

    {/* Ears */}
    <polygon points="64,58 70,38 82,54" fill="#A9503B" />
    <polygon points="67,56 71,43 79,54" fill="#E39A8B" />
    <polygon points="116,58 110,38 98,54" fill="#A9503B" />
    <polygon points="113,56 109,43 101,54" fill="#E39A8B" />

    {/* Head */}
    <ellipse cx="90" cy="70" rx="29" ry="22" fill="#B65744" />
    {/* Big cartoon eyes */}
    <ellipse cx="80" cy="67" rx="9" ry="7.5" fill="#FFFFFF" />
    <ellipse cx="100" cy="67" rx="9" ry="7.5" fill="#FFFFFF" />
    <circle cx="82" cy="67" r="3.5" fill="#302B29" />
    <circle cx="98" cy="67" r="3.5" fill="#302B29" />
    {/* Nose & 'w' cat mouth */}
    <polygon points="87,73 93,73 90,76" fill="#F5C3B8" />
    <path
      d="M84 77 Q87 82 90 77 Q93 82 96 77"
      stroke="#FFF6EB"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Whiskers */}
    <line x1="56" y1="69" x2="70" y2="71" stroke="#FFF6EB" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="56" y1="74" x2="70" y2="74" stroke="#FFF6EB" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="110" y1="71" x2="124" y2="69" stroke="#FFF6EB" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="110" y1="74" x2="124" y2="74" stroke="#FFF6EB" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ScatteredPaws: React.FC = () => {
  const positions = [
    'top-10 left-6 rotate-[-18deg] scale-95',
    'top-20 right-8 rotate-[20deg] scale-75',
    'top-44 left-10 rotate-[12deg] scale-75',
    'top-56 right-14 rotate-[-15deg] scale-90',
    'top-72 left-28 rotate-[-8deg] scale-100',
    'bottom-72 left-6 rotate-[-22deg] scale-105',
    'bottom-64 right-7 rotate-[15deg] scale-90',
    'bottom-48 left-14 rotate-[18deg] scale-85',
    'bottom-36 right-12 rotate-[-10deg] scale-75',
    'bottom-8 left-5 rotate-[-14deg] scale-80',
    'bottom-8 right-7 rotate-[14deg] scale-75',
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {positions.map((pos, idx) => (
        <svg
          key={idx}
          viewBox="0 0 40 40"
          className={`absolute w-8 h-8 text-[#FFF6EB]/20 ${pos}`}
          fill="currentColor"
        >
          <ellipse cx="20" cy="25" rx="8" ry="6.5" />
          <circle cx="10" cy="16" r="3.5" />
          <circle cx="16.5" cy="11.5" r="3.5" />
          <circle cx="23.5" cy="11.5" r="3.5" />
          <circle cx="30" cy="16" r="3.5" />
        </svg>
      ))}
    </div>
  );
};
