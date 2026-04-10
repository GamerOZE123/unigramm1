import React from 'react';

export default function NavSection({ logo }: { logo: string }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(8,12,23,0.8)', borderColor: 'rgba(79,142,255,0.08)' }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between" style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)' }}>
        <img src={logo} alt="Unigramm" className="h-8 sm:h-10" />
      </div>
    </nav>
  );
}
