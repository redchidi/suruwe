'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import LanguageToggle from './LanguageToggle';

interface OnboardingFlowProps {
  onComplete: () => void;
  onAlreadyHaveProfile: () => void;
}

const TOTAL_SLIDES = 6;

/* ═══════════════════════════════
   SVG TEXTILE PATTERNS
═══════════════════════════════ */
function TextilePattern() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 1 }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="shweshwe" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(184,146,74,0.04)" strokeWidth="0.5" />
          <circle cx="24" cy="24" r="12" fill="none" stroke="rgba(184,146,74,0.035)" strokeWidth="0.5" />
          <circle cx="24" cy="24" r="6" fill="none" stroke="rgba(184,146,74,0.03)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="6" fill="none" stroke="rgba(184,146,74,0.025)" strokeWidth="0.5" />
          <circle cx="48" cy="0" r="6" fill="none" stroke="rgba(184,146,74,0.025)" strokeWidth="0.5" />
          <circle cx="0" cy="48" r="6" fill="none" stroke="rgba(184,146,74,0.025)" strokeWidth="0.5" />
          <circle cx="48" cy="48" r="6" fill="none" stroke="rgba(184,146,74,0.025)" strokeWidth="0.5" />
        </pattern>
        <pattern id="adire" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M16 0 L32 16 L16 32 L0 16 Z" fill="none" stroke="rgba(184,146,74,0.03)" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="32" y2="32" stroke="rgba(184,146,74,0.02)" strokeWidth="0.3" />
          <line x1="32" y1="0" x2="0" y2="32" stroke="rgba(184,146,74,0.02)" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#shweshwe)" />
      <rect width="100%" height="100%" fill="url(#adire)" />
    </svg>
  );
}

export default function OnboardingFlow({ onComplete, onAlreadyHaveProfile }: OnboardingFlowProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const goNext = useCallback(() => {
    if (currentSlide < TOTAL_SLIDES - 1) setCurrentSlide(currentSlide + 1);
  }, [currentSlide]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  }, [currentSlide]);

  const handleSkip = () => { markSeen(); onAlreadyHaveProfile(); };
  const markSeen = () => { localStorage.setItem('ONBOARDING_SEEN', 'true'); };
  const handleAlreadyHaveProfile = () => { markSeen(); onAlreadyHaveProfile(); };
  const handleStart = () => { markSeen(); onComplete(); };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; };
  const handleTouchMove = (e: React.TouchEvent) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; };
  const handleTouchEnd = () => {
    if (touchDeltaX.current < -50) goNext();
    else if (touchDeltaX.current > 50) goPrev();
    touchDeltaX.current = 0;
  };

  useEffect(() => { if (currentSlide === 5) markSeen(); }, [currentSlide]);

  const progressPercent = ((currentSlide + 1) / TOTAL_SLIDES) * 100;

  return (
    <div className="onboarding-shell" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} ref={containerRef}>
      <div className="ob-progress-bar">
        <div className="ob-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <div style={{ display: 'flex', width: `${TOTAL_SLIDES * 100}%`, height: '100%', transform: `translateX(-${currentSlide * (100 / TOTAL_SLIDES)}%)`, transition: 'transform 450ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <SlideHero currentSlide={currentSlide} onNext={goNext} onAlreadyHaveProfile={handleAlreadyHaveProfile} />
        <SlideFounder currentSlide={currentSlide} onNext={goNext} onSkip={handleSkip} />
        <SlideProblem currentSlide={currentSlide} onNext={goNext} onSkip={handleSkip} />
        <SlideHowItWorks currentSlide={currentSlide} onNext={goNext} onSkip={handleSkip} />
        <SlideProof currentSlide={currentSlide} onNext={goNext} onSkip={handleSkip} />
        <SlideCommit onStart={handleStart} onAlreadyHaveProfile={handleAlreadyHaveProfile} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════ SLIDE 1: HERO ═══════════════════════════════ */
function SlideHero({ currentSlide, onNext, onAlreadyHaveProfile }: { currentSlide: number; onNext: () => void; onAlreadyHaveProfile: () => void }) {
  const t = useTranslations('onboardingFlow.slide1');
  return (
    <div style={{ width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0, height: '100%', background: 'var(--charcoal)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 'max(48px, env(safe-area-inset-bottom, 20px) + 28px)', position: 'relative', overflow: 'hidden' }}>
      <TextilePattern />
      <div className="ghost-letter" style={{ top: -20, right: -20, fontSize: 200 }}>S</div>
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 5 }}><LanguageToggle variant="pill" /></div>
      <div style={{ flex: '1 1 35%' }} />
      <div style={{ position: 'relative', zIndex: 2, padding: '0 28px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 18, opacity: 0.85 }}>
          {t('eyebrow')}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 10vw, 48px)', fontWeight: 200, lineHeight: 1.05, color: 'var(--cream)', marginBottom: 20 }}>
          What you{'\n'}ordered is{'\n'}what you <span style={{ color: 'var(--gold-pale)' }}>{t('getWord')}</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 300, color: 'var(--muted-d)', lineHeight: 1.65, marginBottom: 36, maxWidth: 280 }}>
          {t('body')}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <DotIndicators total={TOTAL_SLIDES} current={currentSlide} />
          <button className="btn-circle btn-circle-gold" onClick={onNext} aria-label="Next">&rarr;</button>
        </div>
        <button onClick={onAlreadyHaveProfile} style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 18, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, color: 'rgba(248,244,238,0.25)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
          {t('alreadyHaveProfile')}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ SLIDE 2: FOUNDER ═══════════════════════════════ */
function SlideFounder({ currentSlide, onNext, onSkip }: { currentSlide: number; onNext: () => void; onSkip: () => void }) {
  const t = useTranslations('onboardingFlow.slide2');
  const tc = useTranslations('common');
  return (
    <div style={{ width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0, height: '100%', background: 'var(--cream)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 28px', paddingBottom: 'max(48px, env(safe-area-inset-bottom, 20px) + 28px)', position: 'relative' }}>
      <div style={{ flex: '0 0 auto' }}>
        {/* Chidi photo */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', border: '1.5px solid var(--gold-bdr)', marginBottom: 24, overflow: 'hidden' }}>
          <img src="/chidi.jpg" alt="Chidi" style={{ width: 72, height: 72, objectFit: 'cover' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 14 }}>
          {t('eyebrow')}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 300, color: 'var(--ink)', lineHeight: 1.1, marginBottom: 20 }}>
          Hey there. I&apos;m <span style={{ color: 'var(--gold)' }}>{t('chidiWord')}</span>
        </h2>
        <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 12 }}>
          {t('body1')}
        </p>
        <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          {t('body2')}
        </p>
      </div>
      <div style={{ flex: '1 1 0', minHeight: 24 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn-ghost" style={{ color: 'var(--muted-c)' }} onClick={onSkip}>{tc('skip')}</button>
        <button className="btn-circle btn-circle-dark" onClick={onNext} aria-label="Next">&rarr;</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ SLIDE 3: PROBLEM ═══════════════════════════════ */
function SlideProblem({ currentSlide, onNext, onSkip }: { currentSlide: number; onNext: () => void; onSkip: () => void }) {
  const t = useTranslations('onboardingFlow.slide3');
  const tc = useTranslations('common');
  return (
    <div style={{ width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0, height: '100%', background: 'var(--terra-bg)', display: 'flex', flexDirection: 'column', padding: '48px 28px', paddingBottom: 'max(48px, env(safe-area-inset-bottom, 20px) + 28px)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--terra)', marginBottom: 18, opacity: 0.85 }}>
        {t('eyebrow')}
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: 'var(--ink)', lineHeight: 1.1, marginBottom: 24 }}>
        {t('headline')}
      </h2>
      <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 14, border: '0.5px solid rgba(196,81,42,0.12)' }}>
          <Msg text={t('msg1')} />
          <Msg text={t('msg2')} sent />
          <Msg text={t('msg3')} />
          <Msg text={t('msg4')} sent />
          <div style={{ fontSize: 11, fontWeight: 300, color: 'var(--terra)', textAlign: 'center', marginTop: 8, opacity: 0.8 }}>
            {t('threadNote')}
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 400, color: 'var(--terra)', lineHeight: 1.55, marginTop: 8, paddingLeft: 14, borderLeft: '2px solid var(--terra)', opacity: 0.9 }}>
          {t('fix')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
        <button className="btn-ghost" style={{ color: 'rgba(196,81,42,0.45)' }} onClick={onSkip}>{tc('skip')}</button>
        <button className="btn-circle btn-circle-dark" onClick={onNext} aria-label="Next">&rarr;</button>
      </div>
    </div>
  );
}

function Msg({ text, sent }: { text: string; sent?: boolean }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.5, padding: '8px 12px', background: sent ? '#dcf8c6' : '#efefef', borderRadius: sent ? '10px 10px 2px 10px' : '10px 10px 10px 2px', marginBottom: 8, maxWidth: '82%', marginLeft: sent ? 'auto' : undefined, textAlign: sent ? 'right' as const : undefined }}>
      {text}
    </div>
  );
}

/* ═══════════════════════════════ SLIDE 4: HOW IT WORKS ═══════════════════════════════ */
function SlideHowItWorks({ currentSlide, onNext, onSkip }: { currentSlide: number; onNext: () => void; onSkip: () => void }) {
  const t = useTranslations('onboardingFlow.slide4');
  const tc = useTranslations('common');
  const props = [
    { title: t('prop1Title'), desc: t('prop1Desc'), icon: <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><rect x="1" y="1" width="14" height="14" rx="2" stroke="#2d5a3d" strokeWidth="1.3" /><path d="M4 8h8M4 5h8M4 11h5" stroke="#2d5a3d" strokeWidth="1.3" strokeLinecap="round" /></svg> },
    { title: t('prop2Title'), desc: t('prop2Desc'), icon: <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><circle cx="8" cy="8" r="5.5" stroke="#2d5a3d" strokeWidth="1.3" /><path d="M8 5.5v2.5l1.5 1.5" stroke="#2d5a3d" strokeWidth="1.3" strokeLinecap="round" /></svg> },
    { title: t('prop3Title'), desc: t('prop3Desc'), icon: <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M2 14l2.5-1 7-7a1.8 1.8 0 10-2.7-2.6l-7 7L2 14z" stroke="#2d5a3d" strokeWidth="1.3" strokeLinejoin="round" /></svg> },
  ];
  return (
    <div style={{ width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0, height: '100%', background: 'var(--forest-bg)', display: 'flex', flexDirection: 'column', padding: '48px 28px', paddingBottom: 'max(48px, env(safe-area-inset-bottom, 20px) + 28px)', position: 'relative' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--forest)', marginBottom: 18, opacity: 0.8 }}>
        {t('eyebrow')}
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: 'var(--ink)', lineHeight: 1.1, marginBottom: 12 }}>
        {t('headline')}
      </h2>
      <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {props.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 0', borderTop: i > 0 ? '0.5px solid rgba(45,90,61,0.1)' : 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: 'rgba(45,90,61,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 13, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn-ghost" style={{ color: 'rgba(45,90,61,0.4)' }} onClick={onSkip}>{tc('skip')}</button>
        <button className="btn-circle btn-circle-dark" onClick={onNext} aria-label="Next">&rarr;</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ SLIDE 5: SOCIAL PROOF ═══════════════════════════════ */
function SlideProof({ currentSlide, onNext, onSkip }: { currentSlide: number; onNext: () => void; onSkip: () => void }) {
  const t = useTranslations('onboardingFlow.slide5');
  const tc = useTranslations('common');
  const testimonials = [
    { quote: t('quote1'), name: t('name1'), location: t('location1'), initial: 'A' },
    { quote: t('quote2'), name: t('name2'), location: t('location2'), initial: 'W' },
  ];
  return (
    <div style={{ width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0, height: '100%', background: '#f5ead6', display: 'flex', flexDirection: 'column', padding: '48px 28px', paddingBottom: 'max(48px, env(safe-area-inset-bottom, 20px) + 28px)', position: 'relative' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 24, opacity: 0.85 }}>
        {t('eyebrow')}
      </div>
      <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
        {testimonials.map((item, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14, padding: 20, border: '0.5px solid rgba(184,146,74,0.2)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 300, fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.5, marginBottom: 14 }}>
              {item.quote}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: '#f0e6d3', border: '0.5px solid var(--gold-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold)' }}>{item.initial}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{item.name}</div>
                <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--ink-soft)' }}>{item.location}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <button className="btn-ghost" style={{ color: 'rgba(184,146,74,0.4)' }} onClick={onSkip}>{tc('skip')}</button>
        <button className="btn-circle btn-circle-dark" onClick={onNext} aria-label="Next">&rarr;</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ SLIDE 6: COMMIT ═══════════════════════════════ */
function SlideCommit({ onStart, onAlreadyHaveProfile }: { onStart: () => void; onAlreadyHaveProfile: () => void }) {
  const t = useTranslations('onboardingFlow.slide6');
  return (
    <div style={{ width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0, height: '100%', background: 'var(--charcoal)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', paddingBottom: 'max(20px, env(safe-area-inset-bottom, 0px))', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="ghost-letter" style={{ bottom: -40, left: -20, fontSize: 180 }}>Ready</div>
      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 200, color: 'var(--gold-pale)', opacity: 0.2, lineHeight: 1, marginBottom: 20 }}>
          {t('readyWord')}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: 'var(--cream)', lineHeight: 1.15, marginBottom: 12 }}>
          {t('headline')}
        </h2>
        <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted-d)', marginBottom: 40, lineHeight: 1.6 }}>
          {t('body')}
        </p>
        <button className="btn-gold" onClick={onStart} style={{ marginBottom: 16 }}>
          <span>{t('startButton')}</span>
          <span>&rarr;</span>
        </button>
        <button onClick={onAlreadyHaveProfile} style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(248,244,238,0.25)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {t('alreadyHaveProfile')}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ DOT INDICATORS ═══════════════════════════════ */
function DotIndicators({ total, current }: { total: number; current: number }) {
  return (
    <div className="dot-indicators">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`dot-indicator ${i === current ? 'active' : ''}`} />
      ))}
    </div>
  );
}
