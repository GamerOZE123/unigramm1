import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AndroidBeta() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your Gmail address.');
      return;
    }
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setError('Please enter a valid Gmail address.');
      return;
    }

    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('android_testers' as any)
        .insert({ email: email.toLowerCase().trim() } as any);
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: 'linear-gradient(180deg, #080c17 0%, #0d1424 50%, #080c17 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(79,142,255,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <img
          src="/unigramm-logo.png"
          alt="Unigramm"
          className="h-10 mb-10"
          style={{ display: 'block' }}
        />

        {!submitted ? (
          <>
            <h1
              className="text-3xl sm:text-4xl font-bold text-center mb-4"
              style={{ color: '#ffffff' }}
            >
              Get Unigramm on Android
            </h1>
            <p
              className="text-center text-sm sm:text-base mb-2 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              We're in closed beta on the Play Store.
            </p>
            <p
              className="text-center text-sm sm:text-base mb-8 leading-relaxed font-semibold px-2 py-3 rounded-xl"
              style={{
                color: '#8dcfff',
                background: 'rgba(79,142,255,0.1)',
                border: '1px solid rgba(79,142,255,0.2)',
              }}
            >
              ⚠️ Enter the email address linked to your Play Store account below — we'll add you manually and send you the download link within 2 hours.
            </p>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full h-12 rounded-xl px-4 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(79,142,255,0.2)',
                  color: '#ffffff',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4f8eff')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(79,142,255,0.2)')}
              />

              {error && (
                <p className="text-xs text-center" style={{ color: '#ff6b6b' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: loading
                    ? 'rgba(79,142,255,0.5)'
                    : 'linear-gradient(135deg, #4f8eff 0%, #8dcfff 100%)',
                  color: '#080c17',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {loading ? 'Submitting...' : 'Get Early Access'}
              </button>
            </form>

            <p
              className="text-xs text-center mt-4"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Make sure this is the email logged into Google Play Store on your Android phone
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-6">🤖</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#ffffff' }}>
              You're on the list!
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              Check your Gmail within 2 hours for the download link.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="absolute bottom-6 text-center"
        style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}
      >
        © {new Date().getFullYear()} Unigramm
      </div>
    </div>
  );
}
