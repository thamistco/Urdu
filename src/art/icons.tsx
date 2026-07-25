import Svg, { Path, Circle, Rect, Line, Polygon, G, Ellipse, Polyline } from 'react-native-svg';

/**
 * Harf's illustration set — flat, warm vector art in the app palette, drawn to
 * read on a dark framed tile (see Illustration.tsx). One consistent visual
 * language replaces the inconsistent, sometimes-broken emoji across platforms.
 *
 * Every icon draws inside a 0 0 64 64 viewBox. Colours come from the palette so
 * the whole set feels of a piece.
 */

/* Persian-miniature / gold-leaf palette for the heritage set. */
const G_ = '#E2A13C'; // saffron
const GD = '#B87C24'; // deep saffron
const CR = '#F6EEE2'; // cream
const IN = '#1E1024'; // ink (outlines)
const JADE = '#2F9E8F'; // turquoise
const ROSE = '#C4633F'; // terracotta
const SKY = '#2E5A9E'; // lapis
const BROWN = '#9A6A3A'; // warm wood

type IconProps = { size?: number };
const Frame = ({ size = 40, children }: { size?: number; children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    {children}
  </Svg>
);

// ---- objects -------------------------------------------------------------

export const Droplet = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M32 8 C32 8 48 28 48 40 a16 16 0 0 1 -32 0 C16 28 32 8 32 8 Z" fill={SKY} />
    <Path d="M26 40 a6 6 0 0 0 6 6" stroke={CR} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.85} />
  </Frame>
);

export const Book = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M32 16 C26 12 18 12 12 14 V48 C18 46 26 46 32 50 Z" fill={CR} />
    <Path d="M32 16 C38 12 46 12 52 14 V48 C46 46 38 46 32 50 Z" fill={G_} />
    <Line x1="32" y1="16" x2="32" y2="50" stroke={IN} strokeWidth={2.5} />
    <Path d="M18 22 h8 M18 30 h8" stroke={IN} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
    <Path d="M38 22 h8 M38 30 h8" stroke={IN} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
  </Frame>
);

export const House = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M12 30 L32 14 L52 30 Z" fill={ROSE} />
    <Rect x="18" y="30" width="28" height="22" rx="2" fill={CR} />
    <Rect x="28" y="38" width="8" height="14" rx="1.5" fill={GD} />
    <Rect x="21" y="34" width="6" height="6" rx="1" fill={SKY} />
    <Rect x="37" y="34" width="6" height="6" rx="1" fill={SKY} />
  </Frame>
);

export const Heart = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M32 50 C10 34 16 16 28 20 C31 21 32 24 32 24 C32 24 33 21 36 20 C48 16 54 34 32 50 Z" fill={ROSE} />
  </Frame>
);

export const Tag = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M14 14 h20 L52 32 L34 50 L14 30 Z" fill={G_} />
    <Circle cx="24" cy="24" r="4" fill={IN} />
  </Frame>
);

export const Clock = ({ size }: IconProps) => (
  <Frame size={size}>
    <Circle cx="32" cy="32" r="20" fill={CR} stroke={G_} strokeWidth={3} />
    <Path d="M32 32 V20 M32 32 L42 38" stroke={IN} strokeWidth={3} strokeLinecap="round" />
    <Circle cx="32" cy="32" r="2.5" fill={IN} />
  </Frame>
);

export const Briefcase = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="12" y="24" width="40" height="26" rx="3" fill={G_} />
    <Path d="M25 24 v-4 a3 3 0 0 1 3 -3 h8 a3 3 0 0 1 3 3 v4" stroke={CR} strokeWidth={3} fill="none" />
    <Line x1="12" y1="36" x2="52" y2="36" stroke={IN} strokeWidth={2.5} opacity={0.6} />
  </Frame>
);

export const Handshake = ({ size }: IconProps) => (
  <Frame size={size}>
    <Circle cx="32" cy="32" r="20" fill={JADE} opacity={0.18} />
    <Path d="M18 34 l8 -6 6 5 6 -5 8 6" stroke={G_} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M26 28 l6 5 6 -5" stroke={CR} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Frame>
);

// ---- food ----------------------------------------------------------------

export const Bowl = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M14 30 h36 a18 18 0 0 1 -36 0 Z" fill={G_} />
    <Path d="M14 30 h36" stroke={CR} strokeWidth={3} />
    <Path d="M26 22 q2 -6 -2 -10 M34 22 q2 -6 -2 -10" stroke={CR} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.7} />
  </Frame>
);

export const Apple = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M32 22 C24 16 14 22 16 34 C17 44 26 50 32 50 C38 50 47 44 48 34 C50 22 40 16 32 22 Z" fill={ROSE} />
    <Path d="M32 22 v-6 c0 -3 3 -5 6 -5" stroke={BROWN} strokeWidth={3} fill="none" strokeLinecap="round" />
    <Path d="M33 15 q6 -3 9 2 q-6 3 -9 -2 Z" fill={JADE} />
  </Frame>
);

export const TeaCup = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M16 28 h28 v8 a14 14 0 0 1 -28 0 Z" fill={CR} />
    <Path d="M44 30 a6 6 0 0 1 0 12" stroke={G_} strokeWidth={3} fill="none" />
    <Path d="M24 22 q2 -5 -1 -9 M32 22 q2 -5 -1 -9" stroke={CR} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.6} />
    <Rect x="12" y="46" width="34" height="4" rx="2" fill={G_} />
  </Frame>
);

export const MilkGlass = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M20 14 h24 l-3 36 a3 3 0 0 1 -3 3 H26 a3 3 0 0 1 -3 -3 Z" fill={CR} />
    <Path d="M21 26 h22 l-2 24 a3 3 0 0 1 -3 3 H26 a3 3 0 0 1 -3 -3 Z" fill={SKY} opacity={0.35} />
  </Frame>
);

export const Bread = ({ size }: IconProps) => (
  <Frame size={size}>
    <Ellipse cx="32" cy="32" rx="22" ry="16" fill={G_} />
    <Ellipse cx="32" cy="32" rx="22" ry="16" fill="none" stroke={GD} strokeWidth={2.5} />
    <G fill={GD}>
      <Circle cx="24" cy="28" r="1.7" /><Circle cx="34" cy="26" r="1.7" /><Circle cx="40" cy="34" r="1.7" />
      <Circle cx="28" cy="37" r="1.7" /><Circle cx="20" cy="34" r="1.7" />
    </G>
  </Frame>
);

// ---- nature --------------------------------------------------------------

export const Moon = ({ size }: IconProps) => (
  <Frame size={size}>
    {/* crescent: big circle minus an offset smaller arc (opposite sweeps) */}
    <Path d="M42 8 a24 24 0 1 0 0 48 a17 24 0 1 1 0 -48 Z" fill={G_} />
    <Circle cx="46" cy="20" r="2" fill={CR} opacity={0.9} />
  </Frame>
);

export const Sun = ({ size }: IconProps) => (
  <Frame size={size}>
    <Circle cx="32" cy="32" r="12" fill={G_} />
    <G stroke={G_} strokeWidth={3} strokeLinecap="round">
      <Line x1="32" y1="6" x2="32" y2="14" /><Line x1="32" y1="50" x2="32" y2="58" />
      <Line x1="6" y1="32" x2="14" y2="32" /><Line x1="50" y1="32" x2="58" y2="32" />
      <Line x1="14" y1="14" x2="19" y2="19" /><Line x1="45" y1="45" x2="50" y2="50" />
      <Line x1="50" y1="14" x2="45" y2="19" /><Line x1="19" y1="45" x2="14" y2="50" />
    </G>
  </Frame>
);

export const Star = ({ size }: IconProps) => (
  <Frame size={size}>
    <Polygon points="32,8 39,25 57,25 43,36 48,54 32,43 16,54 21,36 7,25 25,25" fill={G_} />
  </Frame>
);

export const Sparkle = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M32 12 C34 24 40 30 52 32 C40 34 34 40 32 52 C30 40 24 34 12 32 C24 30 30 24 32 12 Z" fill={G_} />
    <Path d="M50 12 C50.8 16 52 17.2 56 18 C52 18.8 50.8 20 50 24 C49.2 20 48 18.8 44 18 C48 17.2 49.2 16 50 12 Z" fill={CR} />
  </Frame>
);

export const Flower = ({ size }: IconProps) => (
  <Frame size={size}>
    <G fill={ROSE}>
      <Circle cx="32" cy="18" r="8" /><Circle cx="46" cy="28" r="8" />
      <Circle cx="40" cy="44" r="8" /><Circle cx="24" cy="44" r="8" /><Circle cx="18" cy="28" r="8" />
    </G>
    <Circle cx="32" cy="32" r="7" fill={G_} />
  </Frame>
);

export const Tree = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="29" y="34" width="6" height="18" rx="2" fill={BROWN} />
    <Circle cx="32" cy="24" r="14" fill={JADE} />
    <Circle cx="22" cy="30" r="9" fill={JADE} />
    <Circle cx="42" cy="30" r="9" fill={JADE} />
  </Frame>
);

export const RainCloud = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M20 34 a10 10 0 0 1 20 -4 a8 8 0 0 1 2 16 H22 a8 8 0 0 1 -2 -12 Z" fill={CR} />
    <G stroke={SKY} strokeWidth={3} strokeLinecap="round">
      <Line x1="24" y1="46" x2="21" y2="52" /><Line x1="33" y1="46" x2="30" y2="52" /><Line x1="42" y1="46" x2="39" y2="52" />
    </G>
  </Frame>
);

export const Waves = ({ size }: IconProps) => (
  <Frame size={size}>
    <G stroke={SKY} strokeWidth={3.5} fill="none" strokeLinecap="round">
      <Path d="M10 26 q6 -6 11 0 t11 0 t11 0" />
      <Path d="M10 36 q6 -6 11 0 t11 0 t11 0" />
      <Path d="M10 46 q6 -6 11 0 t11 0 t11 0" />
    </G>
  </Frame>
);

export const Mountain = ({ size }: IconProps) => (
  <Frame size={size}>
    <Polygon points="6,50 24,20 36,50" fill={JADE} />
    <Polygon points="28,50 44,26 58,50" fill={BROWN} />
    <Polygon points="44,26 39,34 49,34" fill={CR} />
  </Frame>
);

// ---- home objects --------------------------------------------------------

export const Table = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="12" y="26" width="40" height="6" rx="2" fill={G_} />
    <Rect x="16" y="32" width="5" height="18" rx="2" fill={BROWN} />
    <Rect x="43" y="32" width="5" height="18" rx="2" fill={BROWN} />
  </Frame>
);

export const Chair = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="22" y="12" width="6" height="26" rx="2" fill={BROWN} />
    <Rect x="22" y="32" width="24" height="6" rx="2" fill={G_} />
    <Rect x="24" y="38" width="5" height="14" rx="2" fill={BROWN} />
    <Rect x="40" y="38" width="5" height="14" rx="2" fill={BROWN} />
    <Rect x="40" y="14" width="5" height="24" rx="2" fill={BROWN} />
  </Frame>
);

export const Door = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="18" y="10" width="28" height="44" rx="3" fill={BROWN} />
    <Rect x="23" y="15" width="18" height="34" rx="2" fill={GD} />
    <Circle cx="38" cy="33" r="2.5" fill={CR} />
  </Frame>
);

export const Window = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="14" y="12" width="36" height="40" rx="3" fill={BROWN} />
    <Rect x="19" y="17" width="26" height="30" rx="1.5" fill={SKY} />
    <Line x1="32" y1="17" x2="32" y2="47" stroke={BROWN} strokeWidth={3} />
    <Line x1="19" y1="32" x2="45" y2="32" stroke={BROWN} strokeWidth={3} />
  </Frame>
);

export const Key = ({ size }: IconProps) => (
  <Frame size={size}>
    <Circle cx="22" cy="24" r="10" fill="none" stroke={G_} strokeWidth={5} />
    <Path d="M29 31 L48 50 M44 46 l4 -4 M40 42 l3 -3" stroke={G_} strokeWidth={5} strokeLinecap="round" />
  </Frame>
);

export const Bed = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="10" y="30" width="44" height="14" rx="3" fill={G_} />
    <Rect x="14" y="24" width="16" height="10" rx="3" fill={CR} />
    <Rect x="10" y="30" width="6" height="20" rx="2" fill={BROWN} />
    <Rect x="48" y="30" width="6" height="20" rx="2" fill={BROWN} />
  </Frame>
);

export const Lamp = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M22 30 L42 30 L36 16 L28 16 Z" fill={G_} />
    <Line x1="32" y1="30" x2="32" y2="46" stroke={BROWN} strokeWidth={3} />
    <Rect x="24" y="46" width="16" height="5" rx="2" fill={BROWN} />
    <Circle cx="32" cy="38" r="3" fill={CR} opacity={0.9} />
  </Frame>
);

// ---- people (family) -----------------------------------------------------

const Person = ({ hair, robe, beard, small }: { hair: string; robe: string; beard?: boolean; small?: boolean }) => {
  const cy = small ? 26 : 22;
  const r = small ? 7 : 9;
  return (
    <>
      <Path d={`M${small ? 20 : 16} 54 q0 -16 16 -16 q16 0 16 16 Z`} fill={robe} transform={small ? 'translate(0,4)' : ''} />
      <Circle cx="32" cy={cy} r={r} fill={CR} />
      <Path d={`M32 ${cy - r} a${r} ${r} 0 0 0 -${r} ${r} q${r} -4 ${r * 2} 0 a${r} ${r} 0 0 0 -${r} -${r} Z`} fill={hair} />
      {beard && <Path d={`M${32 - r + 2} ${cy + 2} a${r - 2} ${r - 1} 0 0 0 ${(r - 2) * 2} 0 Z`} fill={CR} opacity={0.9} />}
    </>
  );
};

export const Woman = ({ size }: IconProps) => (
  <Frame size={size}><Person hair={ROSE} robe={JADE} /></Frame>
);
export const Man = ({ size }: IconProps) => (
  <Frame size={size}><Person hair={IN} robe={G_} /></Frame>
);
export const ElderMan = ({ size }: IconProps) => (
  <Frame size={size}><Person hair={CR} robe={SKY} beard /></Frame>
);
export const ElderWoman = ({ size }: IconProps) => (
  <Frame size={size}><Person hair={'#C9C4BC'} robe={ROSE} /></Frame>
);
export const Child = ({ size }: IconProps) => (
  <Frame size={size}><Person hair={BROWN} robe={G_} small /></Frame>
);
/* Distinct younger figures so no two family words share the same picture. */
export const Girl = ({ size }: IconProps) => (
  <Frame size={size}>
    <Person hair={ROSE} robe={SKY} small />
    {/* ponytail */}
    <Circle cx="46" cy="30" r="4" fill={ROSE} />
  </Frame>
);
export const Boy = ({ size }: IconProps) => (
  <Frame size={size}>
    <Person hair={IN} robe={JADE} small />
    {/* cap brim */}
    <Path d="M23 21 h18 l4 3 H23 Z" fill={GD} />
  </Frame>
);
export const SonChild = ({ size }: IconProps) => (
  <Frame size={size}>
    <Person hair={BROWN} robe={G_} small />
    {/* held ball marks the small child */}
    <Circle cx="46" cy="46" r="5" fill={SKY} />
  </Frame>
);
export const DaughterChild = ({ size }: IconProps) => (
  <Frame size={size}>
    <Person hair={GD} robe={ROSE} small />
    <Circle cx="46" cy="46" r="5" fill={JADE} />
  </Frame>
);

export const Family = ({ size }: IconProps) => (
  <Frame size={size}>
    {/* adult + child pair */}
    <G transform="translate(-8,2) scale(0.8)">
      <Path d="M16 54 q0 -16 16 -16 q16 0 16 16 Z" fill={JADE} />
      <Circle cx="32" cy="22" r="9" fill={CR} />
      <Path d="M32 13 a9 9 0 0 0 -9 9 q9 -4 18 0 a9 9 0 0 0 -9 -9 Z" fill={ROSE} />
    </G>
    <G transform="translate(20,16) scale(0.6)">
      <Path d="M16 54 q0 -16 16 -16 q16 0 16 16 Z" fill={G_} />
      <Circle cx="32" cy="22" r="9" fill={CR} />
      <Path d="M32 13 a9 9 0 0 0 -9 9 q9 -4 18 0 a9 9 0 0 0 -9 -9 Z" fill={IN} />
    </G>
  </Frame>
);

// ---- symbolic (goals / greetings) ---------------------------------------

export const Pen = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M44 12 L52 20 L26 46 L16 50 L20 40 Z" fill={G_} />
    <Path d="M44 12 L52 20 L48 24 L40 16 Z" fill={CR} />
    <Path d="M20 40 L24 44" stroke={IN} strokeWidth={2} />
    <Path d="M14 52 q4 -2 8 0" stroke={IN} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.5} />
  </Frame>
);

export const Mosque = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="18" y="30" width="28" height="22" rx="2" fill={CR} />
    <Path d="M18 30 q14 -18 28 0 Z" fill={G_} />
    <Path d="M30 52 v-8 a2 2 0 0 1 4 0 v8 Z" fill={GD} />
    <Rect x="12" y="26" width="4" height="26" rx="2" fill={G_} />
    <Rect x="48" y="26" width="4" height="26" rx="2" fill={G_} />
    <Circle cx="32" cy="16" r="2.5" fill={G_} />
    <Path d="M14 24 a2 2 0 0 1 0 -4 Z M50 24 a2 2 0 0 1 0 -4 Z" fill={G_} />
  </Frame>
);

export const Salaam = ({ size }: IconProps) => (
  <Frame size={size}>
    <Circle cx="32" cy="32" r="20" fill={JADE} opacity={0.16} />
    {/* dove */}
    <Path d="M18 38 q6 -12 20 -12 q-4 -4 2 -8 q1 6 6 6 q8 0 10 8 q-8 2 -14 8 q-2 6 -8 6 q2 -6 -2 -8 q-8 2 -14 2 Z" fill={CR} />
    <Circle cx="44" cy="26" r="1.4" fill={IN} />
  </Frame>
);

export const ThanksHands = ({ size }: IconProps) => (
  <Frame size={size}>
    <Circle cx="32" cy="32" r="20" fill={G_} opacity={0.15} />
    <Path d="M32 20 L24 40 q8 6 16 0 Z" fill={CR} />
    <Path d="M32 20 L24 40" stroke={IN} strokeWidth={2} opacity={0.4} />
    <Path d="M22 28 q-4 8 2 14 M42 28 q4 8 -2 14" stroke={G_} strokeWidth={3} fill="none" strokeLinecap="round" />
  </Frame>
);

export const Check = ({ size }: IconProps) => (
  <Frame size={size}>
    <Circle cx="32" cy="32" r="20" fill={JADE} />
    <Path d="M22 33 l7 8 14 -16" stroke={CR} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Frame>
);

export const Cross = ({ size }: IconProps) => (
  <Frame size={size}>
    <Circle cx="32" cy="32" r="20" fill={ROSE} />
    <Path d="M24 24 l16 16 M40 24 l-16 16" stroke={CR} strokeWidth={5} strokeLinecap="round" />
  </Frame>
);

export const HandHeart = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M14 40 q0 -8 10 -8 h4 l4 4 4 -4 h4 q10 0 10 8 v8 H14 Z" fill={G_} opacity={0.25} />
    <Path d="M32 34 C24 26 28 18 32 22 C36 18 40 26 32 34 Z" fill={ROSE} />
  </Frame>
);

export const Smile = ({ size }: IconProps) => (
  <Frame size={size}>
    <Circle cx="32" cy="32" r="20" fill={G_} />
    <Circle cx="25" cy="28" r="2.6" fill={IN} />
    <Circle cx="39" cy="28" r="2.6" fill={IN} />
    <Path d="M23 38 q9 8 18 0" stroke={IN} strokeWidth={3} fill="none" strokeLinecap="round" />
  </Frame>
);

export const Egg = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M32 12 C22 12 18 34 18 42 a14 14 0 0 0 28 0 C46 34 42 12 32 12 Z" fill={CR} />
    <Path d="M26 40 a6 6 0 0 0 6 5" stroke={G_} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.6} />
  </Frame>
);

export const RiceBowl = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M14 32 h36 a18 18 0 0 1 -36 0 Z" fill={SKY} />
    <Path d="M16 30 q16 -8 32 0 Z" fill={CR} />
    <Path d="M20 30 q12 -5 24 0" stroke={SKY} strokeWidth={1.5} fill="none" opacity={0.4} />
  </Frame>
);

export const Meat = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M22 24 a10 10 0 1 1 14 14 L26 48 a4 4 0 0 1 -6 -6 Z" fill={ROSE} />
    <Line x1="18" y1="50" x2="26" y2="42" stroke={CR} strokeWidth={4} strokeLinecap="round" />
  </Frame>
);

export const SaltShaker = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M22 24 h20 v22 a4 4 0 0 1 -4 4 H26 a4 4 0 0 1 -4 -4 Z" fill={CR} />
    <Path d="M24 24 q8 -8 16 0 Z" fill={G_} />
    <G fill={IN} opacity={0.55}><Circle cx="29" cy="20" r="1.2" /><Circle cx="35" cy="20" r="1.2" /><Circle cx="32" cy="17" r="1.2" /></G>
  </Frame>
);

/** Grammar — an interlaced jaali screen: structure you can see through. */
export const Lattice = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="12" y="12" width="40" height="40" rx="5" fill={SKY} />
    <G stroke={G_} strokeWidth={2.4} fill="none" strokeLinecap="round">
      <Path d="M32 15 L49 32 L32 49 L15 32 Z" />
      <Rect x="21" y="21" width="22" height="22" rx="2" />
      <Path d="M32 21 v22 M21 32 h22" opacity={0.55} />
    </G>
    <Circle cx="32" cy="32" r="3" fill={CR} />
  </Frame>
);

/** Sentence building — tiles waiting to be put in order. */
export const Tiles = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="9" y="24" width="15" height="16" rx="3" fill={CR} />
    <Rect x="26" y="20" width="15" height="16" rx="3" fill={G_} />
    <Rect x="43" y="28" width="12" height="16" rx="3" fill={JADE} />
    <G stroke={IN} strokeWidth={2} strokeLinecap="round" opacity={0.45}>
      <Path d="M13 32 h7" />
      <Path d="M30 28 h7" />
      <Path d="M46 36 h6" />
    </G>
  </Frame>
);

/** Reading — an open manuscript page with a ruled margin. */
export const Scroll = ({ size }: IconProps) => (
  <Frame size={size}>
    <Rect x="14" y="11" width="36" height="42" rx="4" fill={CR} />
    <Rect x="14" y="11" width="7" height="42" rx="4" fill={G_} />
    <G stroke={IN} strokeWidth={2.2} strokeLinecap="round" opacity={0.45}>
      <Path d="M27 21 h17" />
      <Path d="M27 29 h17" />
      <Path d="M27 37 h12" />
    </G>
    <Circle cx="17.5" cy="32" r="1.6" fill={IN} opacity={0.45} />
  </Frame>
);

/** Review — a crescent with a settling star, the app's "come back" motif. */
export const Crescent = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path
      d="M42 12 a21 21 0 1 0 0 40 a17 17 0 1 1 0 -40 Z"
      fill={G_}
    />
    <Path d="M24 24 l2.2 4.6 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7 Z" fill={CR} opacity={0.9} />
  </Frame>
);

// ---- gamification tokens -------------------------------------------------

/** Gems — the soft currency. A faceted jewel in the app's pistachio. */
export const Gem = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M20 14 h24 l12 14 -24 24 -24 -24 Z" fill="#6FA35C" />
    <Path d="M20 14 l-12 14 h48 l-12 -14 Z" fill="#93BE72" />
    <Path d="M32 52 L8 28 h16 Z" fill="#4F8046" />
    <Path d="M24 28 l8 -14 8 14 -8 24 Z" fill={CR} opacity={0.28} />
  </Frame>
);

/** Streak flame — marigold, deliberately warm rather than alarming. */
export const Flame = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M32 6 C36 18 48 22 48 36 a16 16 0 0 1 -32 0 C16 26 22 24 24 16 C27 21 30 20 32 6 Z" fill="#EF8F4A" />
    <Path d="M32 26 C34 33 40 35 40 41 a8 8 0 0 1 -16 0 C24 36 29 33 32 26 Z" fill={G_} />
  </Frame>
);

/** XP — a bolt, in saffron. */
export const Bolt = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M36 6 L16 36 h12 l-4 22 20 -30 h-12 Z" fill={G_} stroke={GD} strokeWidth={1.5} strokeLinejoin="round" />
  </Frame>
);

/** Achievements — a seedling, for growth. */
export const Sprout = ({ size }: IconProps) => (
  <Frame size={size}>
    <Path d="M32 54 V28" stroke="#6FA35C" strokeWidth={3.5} strokeLinecap="round" />
    <Path d="M32 34 C24 34 18 28 18 20 C28 20 32 26 32 34 Z" fill="#93BE72" />
    <Path d="M32 30 C40 30 46 24 46 16 C36 16 32 22 32 30 Z" fill="#6FA35C" />
    <Path d="M22 54 h20" stroke={BROWN} strokeWidth={3.5} strokeLinecap="round" />
  </Frame>
);

// ---- registry ------------------------------------------------------------

export const ICONS: Record<string, (p: IconProps) => JSX.Element> = {
  droplet: Droplet, book: Book, house: House, heart: Heart, tag: Tag, clock: Clock,
  briefcase: Briefcase, handshake: Handshake, bowl: Bowl, apple: Apple, tea: TeaCup,
  milk: MilkGlass, bread: Bread, moon: Moon, sun: Sun, star: Star, sparkle: Sparkle,
  flower: Flower, tree: Tree, rain: RainCloud, waves: Waves, mountain: Mountain,
  table: Table, chair: Chair, door: Door, window: Window, key: Key, bed: Bed, lamp: Lamp,
  woman: Woman, man: Man, elderMan: ElderMan, elderWoman: ElderWoman, child: Child, family: Family,
  girl: Girl, boy: Boy, sonChild: SonChild, daughterChild: DaughterChild,
  pen: Pen, mosque: Mosque, salaam: Salaam, thanks: ThanksHands, check: Check, cross: Cross,
  handHeart: HandHeart, smile: Smile, egg: Egg, rice: RiceBowl, meat: Meat, salt: SaltShaker,
  lattice: Lattice, tiles: Tiles, scroll: Scroll, crescent: Crescent,
  gem: Gem, flame: Flame, bolt: Bolt, sprout: Sprout,
};

export type IconName = keyof typeof ICONS;
