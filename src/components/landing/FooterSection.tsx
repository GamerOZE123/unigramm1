import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FooterSection({ logo }: { logo: string }) {
  const navigate = useNavigate();

  return (
    <footer className="border-t" style={{ borderColor: 'rgba(79,142,255,0.08)', padding: 'clamp(1.25rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2rem)' }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Unigramm" className="h-4" />
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Unigramm</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="/support" className="text-[11px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>Support</a>
          <a href="/privacy-policy" className="text-[11px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>Privacy</a>
          <button onClick={() => navigate('/contribute')} className="text-[11px] transition-colors hover:text-[#4f8eff]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Contribute
          </button>
        </div>
      </div>
    </footer>
  );
}
