import React from 'react';

// Guide image paths in Supabase storage
// Upload the four images to your photos bucket under "guides/"
const GUIDE_IMAGES = {
  male_top: '/guides/guide_male_top.png',
  male_bottom: '/guides/guide_male_bottom.png',
  female_top: '/guides/guide_female_top.png',
  female_bottom: '/guides/guide_female_bottom.png',
};

function guideUrl(path: string): string {
  return `https://lkqiivozdscrwlexwigm.supabase.co/storage/v1/object/public/photos${path}`;
}

interface GuideProps {
  style?: React.CSSProperties;
}

function GuideImage({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  return (
    <div style={{ width: '100%', maxWidth: 340, margin: '0 auto', ...style }}>
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: 8,
        }}
      />
    </div>
  );
}

export function MaleTopGuide({ style }: GuideProps) {
  return <GuideImage src={guideUrl(GUIDE_IMAGES.male_top)} alt="Male shirt measurement guide" style={style} />;
}

export function MaleBottomGuide({ style }: GuideProps) {
  return <GuideImage src={guideUrl(GUIDE_IMAGES.male_bottom)} alt="Male trousers measurement guide" style={style} />;
}

export function FemaleTopGuide({ style }: GuideProps) {
  return <GuideImage src={guideUrl(GUIDE_IMAGES.female_top)} alt="Female top measurement guide" style={style} />;
}

export function FemaleBottomGuide({ style }: GuideProps) {
  return <GuideImage src={guideUrl(GUIDE_IMAGES.female_bottom)} alt="Female bottom measurement guide" style={style} />;
}

export function MeasurementGuides({ gender, section }: { gender: 'male' | 'female'; section?: 'top' | 'bottom' | 'both' }) {
  const show = section || 'both';

  if (gender === 'male') {
    return (
      <>
        {(show === 'top' || show === 'both') && <MaleTopGuide />}
        {(show === 'bottom' || show === 'both') && <MaleBottomGuide style={{ marginTop: 16 }} />}
      </>
    );
  }

  return (
    <>
      {(show === 'top' || show === 'both') && <FemaleTopGuide />}
      {(show === 'bottom' || show === 'both') && <FemaleBottomGuide style={{ marginTop: 16 }} />}
    </>
  );
}
