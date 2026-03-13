'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import LanguageToggle from './LanguageToggle';

interface OnboardingFlowProps {
  onComplete: () => void;      // "Start my first order" tapped
  onAlreadyHaveProfile: () => void;  // go to return/sign-in screen
}

const TOTAL_SLIDES = 6;

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

  const handleSkip = () => {
    markSeen();
    onAlreadyHaveProfile();
  };

  const markSeen = () => {
    localStorage.setItem('ONBOARDING_SEEN', 'true');
  };

  const handleAlreadyHaveProfile = () => {
    markSeen();
    onAlreadyHaveProfile();
  };

  const handleStart = () => {
    markSeen();
    onComplete();
  };

  // Touch/swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const handleTouchEnd = () => {
    if (touchDeltaX.current < -50) goNext();
    else if (touchDeltaX.current > 50) goPrev();
    touchDeltaX.current = 0;
  };

  // Mark seen when reaching slide 6
  useEffect(() => {
    if (currentSlide === 5) markSeen();
  }, [currentSlide]);

  const progressPercent = ((currentSlide + 1) / TOTAL_SLIDES) * 100;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      {/* Progress bar */}
      <div className="ob-progress-bar">
        <div className="ob-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Slides container */}
      <div
        style={{
          display: 'flex',
          width: `${TOTAL_SLIDES * 100}%`,
          height: '100%',
          transform: `translateX(-${currentSlide * (100 / TOTAL_SLIDES)}%)`,
          transition: 'transform 450ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Slide 1: Hero */}
        <SlideHero
          currentSlide={currentSlide}
          onNext={goNext}
          onAlreadyHaveProfile={handleAlreadyHaveProfile}
        />

        {/* Slide 2: Founder */}
        <SlideFounder
          currentSlide={currentSlide}
          onNext={goNext}
          onSkip={handleSkip}
        />

        {/* Slide 3: Problem */}
        <SlideProblem
          currentSlide={currentSlide}
          onNext={goNext}
          onSkip={handleSkip}
        />

        {/* Slide 4: How it works */}
        <SlideHowItWorks
          currentSlide={currentSlide}
          onNext={goNext}
          onSkip={handleSkip}
        />

        {/* Slide 5: Social proof */}
        <SlideProof
          currentSlide={currentSlide}
          onNext={goNext}
          onSkip={handleSkip}
        />

        {/* Slide 6: Commit */}
        <SlideCommit
          onStart={handleStart}
          onAlreadyHaveProfile={handleAlreadyHaveProfile}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   SLIDE 1: HERO (charcoal)
═══════════════════════════════ */
function SlideHero({ currentSlide, onNext, onAlreadyHaveProfile }: {
  currentSlide: number; onNext: () => void; onAlreadyHaveProfile: () => void;
}) {
  return (
    <div style={{
      width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0,
      background: 'var(--charcoal)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: '0 0 56px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ghost S */}
      <div className="ghost-letter" style={{ top: -20, right: -20, fontSize: 200 }}>S</div>

      {/* Language toggle */}
      <div style={{ position: 'absolute', top: 16, right: 20, zIndex: 5 }}>
        <LanguageToggle variant="pill" />
      </div>

      <div style={{ position: 'relative', zIndex: 2, padding: '0 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          Custom clothing, done right
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 200,
          lineHeight: 1.05, color: 'var(--cream)', marginBottom: 18,
        }}>
          What you{'\n'}ordered is{'\n'}what you <em style={{ fontStyle: 'italic', color: 'var(--gold-pale)' }}>get.</em>
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 300,
          color: 'var(--muted-d)', lineHeight: 1.65, marginBottom: 32, maxWidth: 240,
        }}>
          Your measurements, photos, and fit notes &#8212; one link, sent on WhatsApp.
        </p>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <DotIndicators total={TOTAL_SLIDES} current={currentSlide} />
          <button className="btn-circle btn-circle-gold" onClick={onNext} aria-label="Next">&rarr;</button>
        </div>

        <button
          onClick={onAlreadyHaveProfile}
          style={{
            display: 'block', width: '100%', textAlign: 'center', marginTop: 14,
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 400,
            color: 'rgba(248,244,238,0.2)', background: 'none', border: 'none',
            cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          I already have a profile
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   SLIDE 2: FOUNDER (cream)
═══════════════════════════════ */
function SlideFounder({ currentSlide, onNext, onSkip }: {
  currentSlide: number; onNext: () => void; onSkip: () => void;
}) {
  return (
    <div style={{
      width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0,
      background: 'var(--cream)',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '56px 28px 56px', position: 'relative',
    }}>
      {/* Avatar */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: '#f0e6d3', border: '1.5px solid var(--gold-bdr)',
        marginBottom: 22, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg viewBox="0 0 72 72" fill="none" width="72" height="72">
          <circle cx="36" cy="36" r="36" fill="#f0e6d3" />
          <circle cx="36" cy="29" r="11" fill="#b8924a" opacity="0.45" />
          <ellipse cx="36" cy="56" rx="18" ry="12" fill="#b8924a" opacity="0.3" />
        </svg>
      </div>

      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600,
        letterSpacing: '0.2em', textTransform: 'uppercase' as const,
        color: 'var(--gold)', marginBottom: 14,
      }}>
        From the founder
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 300,
        color: 'var(--ink)', lineHeight: 1.1, marginBottom: 18,
      }}>
        Hey, I&apos;m <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Chidi.</em>
      </h2>

      <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 10 }}>
        I built Suruwe because I&apos;ve had too many orders go wrong &#8212; the wrong measurements used, details lost in a WhatsApp thread.
      </p>
      <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
        Every order you place through Suruwe gives your tailor exactly what they need. Nothing left to chance.
      </p>

      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic',
        fontWeight: 300, color: 'var(--gold)', marginTop: 18,
      }}>
        &#8212; Chidi
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
        <button className="btn-ghost" style={{ color: 'var(--muted-c)' }} onClick={onSkip}>Skip</button>
        <button className="btn-circle btn-circle-dark" onClick={onNext} aria-label="Next">&rarr;</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   SLIDE 3: PROBLEM (terracotta)
═══════════════════════════════ */
function SlideProblem({ currentSlide, onNext, onSkip }: {
  currentSlide: number; onNext: () => void; onSkip: () => void;
}) {
  return (
    <div style={{
      width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0,
      background: 'var(--terra-bg)',
      padding: '52px 28px 56px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600,
        letterSpacing: '0.2em', textTransform: 'uppercase' as const,
        color: 'var(--terra)', marginBottom: 18, opacity: 0.85,
      }}>
        Sound familiar?
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300,
        color: 'var(--ink)', lineHeight: 1.1, marginBottom: 24,
      }}>
        The order that went wrong.
      </h2>

      {/* WhatsApp thread mockup */}
      <div style={{
        background: 'white', borderRadius: 12, padding: 14,
        marginBottom: 10, border: '0.5px solid rgba(196,81,42,0.12)',
      }}>
        <Msg text="My measurements are in the thread from March... I think" />
        <Msg text="Just use the last ones" sent />
        <Msg text="Which reference pic was it again?" />
        <Msg text="I'll send again 😅" sent />
        <div style={{
          fontSize: 10, fontWeight: 300, color: 'var(--terra)',
          textAlign: 'center', marginTop: 6, opacity: 0.8,
        }}>
          Another thread. Another order at risk.
        </div>
      </div>

      <div style={{
        fontSize: 13, fontWeight: 400, color: 'var(--terra)',
        lineHeight: 1.55, marginTop: 16, paddingLeft: 14,
        borderLeft: '2px solid var(--terra)', opacity: 0.9,
      }}>
        Suruwe fixes this. One link. Everything your tailor needs.
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
        <button className="btn-ghost" style={{ color: 'rgba(196,81,42,0.45)' }} onClick={onSkip}>Skip</button>
        <button className="btn-circle btn-circle-dark" onClick={onNext} aria-label="Next">&rarr;</button>
      </div>
    </div>
  );
}

function Msg({ text, sent }: { text: string; sent?: boolean }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.45,
      padding: '7px 11px',
      background: sent ? '#dcf8c6' : '#efefef',
      borderRadius: sent ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
      marginBottom: 7, maxWidth: '78%',
      marginLeft: sent ? 'auto' : undefined,
      textAlign: sent ? 'right' as const : undefined,
    }}>
      {text}
    </div>
  );
}

/* ═══════════════════════════════
   SLIDE 4: HOW IT WORKS (forest)
═══════════════════════════════ */
function SlideHowItWorks({ currentSlide, onNext, onSkip }: {
  currentSlide: number; onNext: () => void; onSkip: () => void;
}) {
  const props = [
    {
      title: 'Your profile',
      desc: 'Measurements, body photo, fit preferences. Set once, used forever.',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
          <rect x="1" y="1" width="14" height="14" rx="2" stroke="#2d5a3d" strokeWidth="1.3" />
          <path d="M4 8h8M4 5h8M4 11h5" stroke="#2d5a3d" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: 'Your order',
      desc: 'Fit notes, reference images, deadline. Briefed completely, every time.',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
          <circle cx="8" cy="8" r="5.5" stroke="#2d5a3d" strokeWidth="1.3" />
          <path d="M8 5.5v2.5l1.5 1.5" stroke="#2d5a3d" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: 'One WhatsApp link',
      desc: 'Your tailor sees everything. Nothing gets lost.',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
          <path d="M2 14l2.5-1 7-7a1.8 1.8 0 10-2.7-2.6l-7 7L2 14z" stroke="#2d5a3d" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0,
      background: 'var(--forest-bg)',
      padding: '52px 28px 56px', position: 'relative',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600,
        letterSpacing: '0.2em', textTransform: 'uppercase' as const,
        color: 'var(--forest)', marginBottom: 18, opacity: 0.8,
      }}>
        How it works
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300,
        color: 'var(--ink)', lineHeight: 1.1, marginBottom: 24,
      }}>
        Three things. One link.
      </h2>

      {props.map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 14,
          padding: '14px 0',
          borderTop: i > 0 ? '0.5px solid rgba(45,90,61,0.1)' : 'none',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: 'rgba(45,90,61,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {p.icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{p.title}</div>
            <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{p.desc}</div>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
        <button className="btn-ghost" style={{ color: 'rgba(45,90,61,0.4)' }} onClick={onSkip}>Skip</button>
        <button className="btn-circle btn-circle-dark" onClick={onNext} aria-label="Next">&rarr;</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   SLIDE 5: SOCIAL PROOF (gold)
═══════════════════════════════ */
function SlideProof({ currentSlide, onNext, onSkip }: {
  currentSlide: number; onNext: () => void; onSkip: () => void;
}) {
  const testimonials = [
    {
      quote: '"I was just thinking about doing something like this."',
      name: 'Ama',
      title: 'Communications Director',
      location: 'Accra',
      initial: 'A',
    },
    {
      quote: '"Finally. My tailor in Lagos always had questions. Now he doesn\'t."',
      name: 'Kwame',
      title: 'Engineer',
      location: 'London \u2192 Kumasi',
      initial: 'K',
    },
  ];

  return (
    <div style={{
      width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0,
      background: '#f5ead6',
      padding: '52px 28px 56px', position: 'relative',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600,
        letterSpacing: '0.2em', textTransform: 'uppercase' as const,
        color: 'var(--gold)', marginBottom: 22, opacity: 0.85,
      }}>
        People like you
      </div>

      {testimonials.map((t, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 14, padding: 18,
          marginBottom: 14, border: '0.5px solid rgba(184,146,74,0.2)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 300,
            fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.45, marginBottom: 12,
          }}>
            {t.quote}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: '#f0e6d3', border: '0.5px solid var(--gold-bdr)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 13, fontStyle: 'italic',
              color: 'var(--gold)',
            }}>
              {t.initial}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{t.name}</div>
              <div style={{ fontSize: 11, fontWeight: 300, color: 'var(--ink-soft)' }}>
                {t.title} &middot; {t.location}
              </div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <button className="btn-ghost" style={{ color: 'rgba(184,146,74,0.4)' }} onClick={onSkip}>Skip</button>
        <button className="btn-circle btn-circle-dark" onClick={onNext} aria-label="Next">&rarr;</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   SLIDE 6: COMMIT (charcoal)
═══════════════════════════════ */
function SlideCommit({ onStart, onAlreadyHaveProfile }: {
  onStart: () => void; onAlreadyHaveProfile: () => void;
}) {
  return (
    <div style={{
      width: `${100 / TOTAL_SLIDES}%`, flexShrink: 0,
      background: 'var(--charcoal)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 28px', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ghost */}
      <div className="ghost-letter" style={{
        bottom: -40, left: -20, fontSize: 180,
      }}>
        Ready
      </div>

      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 200,
          fontStyle: 'italic', color: 'var(--gold-pale)', opacity: 0.2,
          lineHeight: 1, marginBottom: 20,
        }}>
          Ready.
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300,
          color: 'var(--cream)', lineHeight: 1.15, marginBottom: 10,
        }}>
          Your first order starts here.
        </h2>

        <p style={{
          fontSize: 13, fontWeight: 300, color: 'var(--muted-d)',
          marginBottom: 36, lineHeight: 1.6,
        }}>
          Two minutes. Your tailor will thank you.
        </p>

        <button className="btn-gold" onClick={onStart} style={{ marginBottom: 14 }}>
          <span>Start my first order</span>
          <span>&rarr;</span>
        </button>

        <button
          onClick={onAlreadyHaveProfile}
          style={{
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            color: 'rgba(248,244,238,0.22)', background: 'none',
            border: 'none', cursor: 'pointer',
          }}
        >
          I already have a profile
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   DOT INDICATORS
═══════════════════════════════ */
function DotIndicators({ total, current }: { total: number; current: number }) {
  return (
    <div className="dot-indicators">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`dot-indicator ${i === current ? 'active' : ''}`}
        />
      ))}
    </div>
  );
}
