import React from 'react';

interface GuideProps {
  style?: React.CSSProperties;
}

const LINE = 'var(--accent)';
const BODY = 'var(--text-secondary)';
const BG = 'var(--bg)';
const TEXT = 'var(--text)';
const MUTED = 'var(--text-secondary)';

function Label({ x, y, letter }: { x: number; y: number; letter: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="12" fill={BG} stroke={LINE} strokeWidth="1.2" />
      <text x={x} y={y + 4} textAnchor="middle" fill={LINE} fontSize="13" fontWeight="700" fontFamily="DM Sans, sans-serif">{letter}</text>
    </g>
  );
}

function Tick({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINE} strokeWidth="1.2" />;
}

function MLine({ x1, y1, x2, y2, dashed }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINE} strokeWidth="1.2" strokeDasharray={dashed ? "5 3" : undefined} />;
}

// =============================================
// MALE SHIRT / TOP GUIDE
// A. Shirt Length  B. Chest  C. Shoulder
// D. Sleeve Length  E. Neck  F. Armhole
// G. Bicep  H. Belly
// =============================================
export function MaleTopGuide({ style }: GuideProps) {
  return (
    <div style={{ width: '100%', maxWidth: 340, margin: '0 auto', ...style }}>
      <svg viewBox="0 0 360 440" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        {/* Shirt body */}
        <path d={`
          M155 52 L145 48 L135 46 L100 56 L65 72 L42 85 L38 100 L55 108
          L62 102 L65 104 L68 320 L72 330 L292 330 L296 320 L298 104 L301 102
          L308 108 L322 100 L318 85 L298 72 L262 56 L228 46 L218 48 L208 52
          L200 60 Q180 75 163 60 Z
        `} stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        {/* Collar */}
        <path d="M155 52 L163 38 L175 28 L180 26 L185 28 L197 38 L208 52" stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        <path d="M163 38 L155 52 L170 62" stroke={BODY} strokeWidth="1" fill="none" opacity="0.35" />
        <path d="M197 38 L208 52 L193 62" stroke={BODY} strokeWidth="1" fill="none" opacity="0.35" />
        <path d="M163 38 L180 32 L197 38" stroke={BODY} strokeWidth="1" fill="none" opacity="0.35" />
        {/* Placket */}
        <line x1="180" y1="60" x2="180" y2="330" stroke={BODY} strokeWidth="0.8" opacity="0.2" />
        {/* Buttons */}
        {[80, 120, 160, 200, 240, 280].map(y => (
          <circle key={y} cx="180" cy={y} r="3" stroke={BODY} strokeWidth="0.8" fill="none" opacity="0.3" />
        ))}
        {/* Cuffs */}
        <line x1="42" y1="85" x2="38" y2="100" stroke={BODY} strokeWidth="1.5" opacity="0.55" />
        <line x1="322" y1="85" x2="322" y2="100" stroke={BODY} strokeWidth="1.5" opacity="0.55" />
        {/* Pocket */}
        <rect x="195" y="130" width="40" height="35" rx="2" stroke={BODY} strokeWidth="0.8" fill="none" opacity="0.15" />

        {/* A - Shirt Length */}
        <MLine x1={22} y1={48} x2={22} y2={330} />
        <Tick x1={17} y1={48} x2={27} y2={48} />
        <Tick x1={17} y1={330} x2={27} y2={330} />
        <Label x={22} y={189} letter="A" />

        {/* B - Chest */}
        <MLine x1={68} y1={150} x2={296} y2={150} />
        <Tick x1={68} y1={144} x2={68} y2={156} />
        <Tick x1={296} y1={144} x2={296} y2={156} />
        <Label x={182} y={150} letter="B" />

        {/* C - Shoulder */}
        <MLine x1={100} y1={56} x2={262} y2={56} />
        <Tick x1={100} y1={50} x2={100} y2={62} />
        <Tick x1={262} y1={50} x2={262} y2={62} />
        <Label x={182} y={40} letter="C" />

        {/* D - Sleeve Length */}
        <MLine x1={338} y1={56} x2={338} y2={100} />
        <Tick x1={333} y1={56} x2={343} y2={56} />
        <Tick x1={333} y1={100} x2={343} y2={100} />
        <Label x={338} y={78} letter="D" />

        {/* E - Neck */}
        <MLine x1={163} y1={22} x2={197} y2={22} />
        <Tick x1={163} y1={17} x2={163} y2={27} />
        <Tick x1={197} y1={17} x2={197} y2={27} />
        <Label x={215} y={22} letter="E" />

        {/* F - Armhole */}
        <MLine x1={90} y1={72} x2={68} y2={104} />
        <Tick x1={85} y1={68} x2={95} y2={76} />
        <Tick x1={63} y1={100} x2={73} y2={108} />
        <Label x={62} y={72} letter="F" />

        {/* G - Bicep */}
        <MLine x1={50} y1={94} x2={68} y2={94} />
        <Tick x1={50} y1={88} x2={50} y2={100} />
        <Tick x1={68} y1={88} x2={68} y2={100} />
        <Label x={42} y={112} letter="G" />

        {/* H - Belly */}
        <MLine x1={72} y1={280} x2={292} y2={280} />
        <Tick x1={72} y1={274} x2={72} y2={286} />
        <Tick x1={292} y1={274} x2={292} y2={286} />
        <Label x={182} y={280} letter="H" />

        <text x="180" y="360" textAnchor="middle" fill={TEXT} fontSize="14" fontWeight="600" fontFamily="DM Sans, sans-serif">Upper Body</text>
        <text x="180" y="382" textAnchor="middle" fill={MUTED} fontSize="11" fontFamily="DM Sans, sans-serif">A. Top Length · B. Chest · C. Shoulder · D. Sleeve</text>
        <text x="180" y="400" textAnchor="middle" fill={MUTED} fontSize="11" fontFamily="DM Sans, sans-serif">E. Neck · F. Armhole · G. Bicep · H. Belly</text>
      </svg>
    </div>
  );
}

// =============================================
// MALE TROUSERS / BOTTOM GUIDE
// I. Outseam  J. Waist  K. Hips
// L. Thigh  M. Knee  N. Ankle  O. Inseam
// =============================================
export function MaleBottomGuide({ style }: GuideProps) {
  return (
    <div style={{ width: '100%', maxWidth: 340, margin: '0 auto', ...style }}>
      <svg viewBox="0 0 360 460" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        {/* Waistband */}
        <path d="M95 40 L265 40 L268 42 L270 55 L265 58 L95 58 L90 55 L92 42 Z" stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        <circle cx="180" cy="49" r="3.5" stroke={BODY} strokeWidth="1" fill="none" opacity="0.35" />
        {[115, 145, 215, 245].map(x => (
          <rect key={x} x={x} y={38} width="5" height="22" rx="1" stroke={BODY} strokeWidth="0.8" fill="none" opacity="0.25" />
        ))}
        {/* Left leg */}
        <path d={`M95 58 L88 90 L84 140 L82 200 L84 260 L88 320 L92 370 L96 395 L108 400 L140 400 L144 396 L148 370 L154 300 L158 240 L162 200 L165 170 L168 150`} stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        {/* Right leg */}
        <path d={`M265 58 L272 90 L276 140 L278 200 L276 260 L272 320 L268 370 L264 395 L252 400 L220 400 L216 396 L212 370 L206 300 L202 240 L198 200 L195 170 L192 150`} stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        <path d="M168 150 Q180 165 192 150" stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        <path d="M180 58 L180 150" stroke={BODY} strokeWidth="0.8" opacity="0.2" />
        <path d="M180 58 Q172 100 174 140" stroke={BODY} strokeWidth="0.8" opacity="0.25" />
        <path d="M98 62 Q100 80 115 90" stroke={BODY} strokeWidth="0.8" fill="none" opacity="0.25" />
        <path d="M262 62 Q260 80 245 90" stroke={BODY} strokeWidth="0.8" fill="none" opacity="0.25" />

        {/* I - Outseam */}
        <MLine x1={38} y1={40} x2={38} y2={400} />
        <Tick x1={33} y1={40} x2={43} y2={40} />
        <Tick x1={33} y1={400} x2={43} y2={400} />
        <Label x={38} y={220} letter="I" />

        {/* J - Waist */}
        <MLine x1={95} y1={28} x2={265} y2={28} />
        <Tick x1={95} y1={22} x2={95} y2={34} />
        <Tick x1={265} y1={22} x2={265} y2={34} />
        <Label x={180} y={28} letter="J" />

        {/* K - Hips */}
        <MLine x1={85} y1={120} x2={275} y2={120} />
        <Tick x1={85} y1={114} x2={85} y2={126} />
        <Tick x1={275} y1={114} x2={275} y2={126} />
        <Label x={310} y={120} letter="K" />

        {/* L - Thigh */}
        <MLine x1={198} y1={200} x2={278} y2={200} />
        <Tick x1={198} y1={194} x2={198} y2={206} />
        <Tick x1={278} y1={194} x2={278} y2={206} />
        <Label x={310} y={200} letter="L" />

        {/* M - Knee */}
        <MLine x1={206} y1={290} x2={272} y2={290} />
        <Tick x1={206} y1={284} x2={206} y2={296} />
        <Tick x1={272} y1={284} x2={272} y2={296} />
        <Label x={310} y={290} letter="M" />

        {/* N - Ankle */}
        <MLine x1={220} y1={395} x2={260} y2={395} />
        <Tick x1={220} y1={389} x2={220} y2={401} />
        <Tick x1={260} y1={389} x2={260} y2={401} />
        <Label x={310} y={395} letter="N" />

        {/* O - Inseam */}
        <MLine x1={180} y1={155} x2={180} y2={395} dashed />
        <Label x={180} y={275} letter="O" />

        <text x="180" y="425" textAnchor="middle" fill={TEXT} fontSize="14" fontWeight="600" fontFamily="DM Sans, sans-serif">Lower Body</text>
        <text x="180" y="447" textAnchor="middle" fill={MUTED} fontSize="11" fontFamily="DM Sans, sans-serif">I. Outseam · J. Waist · K. Hips · L. Thigh · M. Knee · N. Ankle · O. Inseam</text>
      </svg>
    </div>
  );
}

// =============================================
// FEMALE TOP GUIDE
// A. Bodice Length  B. Bust  C. Underbust
// D. Shoulder  E. Sleeve Length  F. Armhole
// G. Bicep  H. Wrist  I. Belly
// =============================================
export function FemaleTopGuide({ style }: GuideProps) {
  return (
    <div style={{ width: '100%', maxWidth: 340, margin: '0 auto', ...style }}>
      <svg viewBox="0 0 360 440" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        {/* Neck */}
        <path d="M165 42 Q165 30 180 25 Q195 30 195 42" stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        {/* Left arm */}
        <path d={`M165 42 L155 48 L130 55 L105 60 L85 65 L68 72 L50 82 L38 95 L32 115 L28 140 L26 170 L25 200 L26 230 L28 260 L30 290 L32 310 L34 330 L38 345`} stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        {/* Right arm */}
        <path d={`M195 42 L205 48 L230 55 L255 60 L275 65 L292 72 L310 82 L322 95 L328 115 L332 140 L334 170 L335 200 L334 230 L332 260 L330 290 L328 310 L326 330 L322 345`} stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        {/* Upper torso with bust */}
        <path d={`M85 65 L82 80 L80 95 Q82 110 90 120 Q110 145 125 130 Q140 120 150 125 L155 128 Q165 135 180 135 Q195 135 205 128 L210 125 Q220 120 235 130 Q250 145 270 120 Q278 110 280 95 L278 80 L275 65`} stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        {/* Left torso */}
        <path d={`M90 120 L84 145 L80 170 L78 200 L80 230 L82 260 L85 290 L88 320 L90 340`} stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        {/* Right torso */}
        <path d={`M270 120 L276 145 L280 170 L282 200 L280 230 L278 260 L275 290 L272 320 L270 340`} stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        <path d="M90 340 Q180 350 270 340" stroke={BODY} strokeWidth="1" fill="none" opacity="0.35" />
        {/* Hands */}
        <ellipse cx="38" cy="350" rx="6" ry="10" stroke={BODY} strokeWidth="1" fill="none" opacity="0.3" />
        <ellipse cx="322" cy="350" rx="6" ry="10" stroke={BODY} strokeWidth="1" fill="none" opacity="0.3" />

        {/* A - Bodice Length */}
        <MLine x1={18} y1={48} x2={18} y2={200} />
        <Tick x1={13} y1={48} x2={23} y2={48} />
        <Tick x1={13} y1={200} x2={23} y2={200} />
        <Label x={18} y={124} letter="A" />

        {/* B - Bust */}
        <MLine x1={82} y1={125} x2={278} y2={125} />
        <Tick x1={82} y1={119} x2={82} y2={131} />
        <Tick x1={278} y1={119} x2={278} y2={131} />
        <Label x={180} y={125} letter="B" />

        {/* C - Underbust */}
        <MLine x1={84} y1={155} x2={276} y2={155} />
        <Tick x1={84} y1={149} x2={84} y2={161} />
        <Tick x1={276} y1={149} x2={276} y2={161} />
        <Label x={180} y={155} letter="C" />

        {/* D - Shoulder */}
        <MLine x1={105} y1={60} x2={255} y2={60} />
        <Tick x1={105} y1={54} x2={105} y2={66} />
        <Tick x1={255} y1={54} x2={255} y2={66} />
        <Label x={180} y={60} letter="D" />

        {/* E - Sleeve Length */}
        <MLine x1={342} y1={60} x2={342} y2={345} />
        <Tick x1={337} y1={60} x2={347} y2={60} />
        <Tick x1={337} y1={345} x2={347} y2={345} />
        <Label x={342} y={202} letter="E" />

        {/* F - Armhole */}
        <path d="M105 60 Q78 80 82 105" stroke={LINE} strokeWidth="1.2" fill="none" />
        <Label x={62} y={70} letter="F" />

        {/* G - Bicep */}
        <MLine x1={42} y1={115} x2={72} y2={108} />
        <Tick x1={40} y1={110} x2={44} y2={120} />
        <Tick x1={70} y1={103} x2={74} y2={113} />
        <Label x={36} y={132} letter="G" />

        {/* H - Wrist */}
        <MLine x1={318} y1={335} x2={332} y2={332} />
        <Tick x1={316} y1={330} x2={320} y2={340} />
        <Tick x1={330} y1={327} x2={334} y2={337} />
        <Label x={345} y={335} letter="H" />

        {/* I - Belly */}
        <MLine x1={80} y1={260} x2={280} y2={260} />
        <Tick x1={80} y1={254} x2={80} y2={266} />
        <Tick x1={280} y1={254} x2={280} y2={266} />
        <Label x={180} y={260} letter="I" />

        <text x="180" y="378" textAnchor="middle" fill={TEXT} fontSize="14" fontWeight="600" fontFamily="DM Sans, sans-serif">Upper Body</text>
        <text x="180" y="400" textAnchor="middle" fill={MUTED} fontSize="11" fontFamily="DM Sans, sans-serif">A. Bodice · B. Bust · C. Underbust · D. Shoulder · E. Sleeve</text>
        <text x="180" y="418" textAnchor="middle" fill={MUTED} fontSize="11" fontFamily="DM Sans, sans-serif">F. Armhole · G. Bicep · H. Wrist · I. Belly</text>
      </svg>
    </div>
  );
}

// =============================================
// FEMALE BOTTOM GUIDE
// J. Waist  K. High Hip  L. Hip  M. Thigh
// N. Knee  O. Ankle  P. Inseam
// Q. Crotch Depth  R. Dress/Bottom Length
// =============================================
export function FemaleBottomGuide({ style }: GuideProps) {
  return (
    <div style={{ width: '100%', maxWidth: 340, margin: '0 auto', ...style }}>
      <svg viewBox="0 0 360 480" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        {/* Waistband */}
        <path d="M105 40 L255 40 L258 55 L102 55 Z" stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        {/* Left leg */}
        <path d={`M102 55 L95 75 L88 100 L84 130 L82 160 L84 190 L90 220 L95 250 Q100 260 105 270 L110 300 L115 330 L118 360 L120 390 L122 410 L128 415 L148 415 L152 412 L155 390 L158 360 L162 320 L165 280 L168 250 L170 220 L172 195 L175 170 L177 155`} stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        {/* Right leg */}
        <path d={`M258 55 L265 75 L272 100 L276 130 L278 160 L276 190 L270 220 L265 250 Q260 260 255 270 L250 300 L245 330 L242 360 L240 390 L238 410 L232 415 L212 415 L208 412 L205 390 L202 360 L198 320 L195 280 L192 250 L190 220 L188 195 L185 170 L183 155`} stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />
        <path d="M177 155 Q180 165 183 155" stroke={BODY} strokeWidth="1.5" fill="none" opacity="0.55" />

        {/* J - Waist */}
        <MLine x1={105} y1={28} x2={255} y2={28} />
        <Tick x1={105} y1={22} x2={105} y2={34} />
        <Tick x1={255} y1={22} x2={255} y2={34} />
        <Label x={180} y={28} letter="J" />

        {/* K - High Hip */}
        <MLine x1={92} y1={85} x2={268} y2={85} />
        <Tick x1={92} y1={79} x2={92} y2={91} />
        <Tick x1={268} y1={79} x2={268} y2={91} />
        <Label x={42} y={85} letter="K" />

        {/* L - Hip */}
        <MLine x1={85} y1={125} x2={275} y2={125} />
        <Tick x1={85} y1={119} x2={85} y2={131} />
        <Tick x1={275} y1={119} x2={275} y2={131} />
        <Label x={42} y={125} letter="L" />

        {/* M - Thigh */}
        <MLine x1={192} y1={210} x2={270} y2={210} />
        <Tick x1={192} y1={204} x2={192} y2={216} />
        <Tick x1={270} y1={204} x2={270} y2={216} />
        <Label x={310} y={210} letter="M" />

        {/* N - Knee */}
        <MLine x1={200} y1={310} x2={248} y2={310} />
        <Tick x1={200} y1={304} x2={200} y2={316} />
        <Tick x1={248} y1={304} x2={248} y2={316} />
        <Label x={310} y={310} letter="N" />

        {/* O - Ankle */}
        <MLine x1={212} y1={410} x2={238} y2={410} />
        <Tick x1={212} y1={404} x2={212} y2={416} />
        <Tick x1={238} y1={404} x2={238} y2={416} />
        <Label x={310} y={410} letter="O" />

        {/* P - Inseam */}
        <MLine x1={183} y1={160} x2={210} y2={410} dashed />
        <Label x={195} y={285} letter="P" />

        {/* Q - Crotch Depth */}
        <MLine x1={62} y1={40} x2={62} y2={160} />
        <Tick x1={57} y1={40} x2={67} y2={40} />
        <Tick x1={57} y1={160} x2={67} y2={160} />
        <Label x={42} y={160} letter="Q" />

        {/* R - Bottom Length */}
        <MLine x1={330} y1={40} x2={330} y2={415} />
        <Tick x1={325} y1={40} x2={335} y2={40} />
        <Tick x1={325} y1={415} x2={335} y2={415} />
        <Label x={330} y={227} letter="R" />

        <text x="180" y="440" textAnchor="middle" fill={TEXT} fontSize="14" fontWeight="600" fontFamily="DM Sans, sans-serif">Lower Body</text>
        <text x="180" y="458" textAnchor="middle" fill={MUTED} fontSize="11" fontFamily="DM Sans, sans-serif">J. Waist · K. High Hip · L. Hip · M. Thigh · N. Knee</text>
        <text x="180" y="474" textAnchor="middle" fill={MUTED} fontSize="11" fontFamily="DM Sans, sans-serif">O. Ankle · P. Inseam · Q. Crotch Depth · R. Length</text>
      </svg>
    </div>
  );
}

// Helper: render guides for a gender
export function MeasurementGuides({ gender, section }: { gender: 'male' | 'female'; section?: 'top' | 'bottom' | 'both' }) {
  const show = section || 'both';
  if (gender === 'male') {
    return (
      <>
        {(show === 'top' || show === 'both') && <MaleTopGuide />}
        {(show === 'bottom' || show === 'both') && <MaleBottomGuide style={{ marginTop: 24 }} />}
      </>
    );
  }
  return (
    <>
      {(show === 'top' || show === 'both') && <FemaleTopGuide />}
      {(show === 'bottom' || show === 'both') && <FemaleBottomGuide style={{ marginTop: 24 }} />}
    </>
  );
}

// Letter label mappings
export const MALE_LABELS: Record<string, string> = {
  torso_length: 'A', chest: 'B', shoulder: 'C', sleeve: 'D',
  neck: 'E', armhole: 'F', bicep: 'G', belly: 'H',
  outseam: 'I', waist: 'J', hips: 'K', thigh: 'L',
  knee: 'M', ankle: 'N', inseam: 'O',
};

export const FEMALE_LABELS: Record<string, string> = {
  bodice_length: 'A', bust: 'B', underbust: 'C', shoulder: 'D',
  sleeve: 'E', armhole: 'F', bicep: 'G', wrist: 'H', belly: 'I',
  waist: 'J', high_hip: 'K', hips: 'L', thigh: 'M',
  knee: 'N', ankle: 'O', inseam: 'P', crotch_depth: 'Q', bottom_length: 'R',
};

export function getLabel(gender: 'male' | 'female', key: string): string {
  const labels = gender === 'male' ? MALE_LABELS : FEMALE_LABELS;
  return labels[key] || '';
}
