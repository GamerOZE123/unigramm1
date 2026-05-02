import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import logoImg from '@/assets/unigramm-logo.png';
import indiaMapImg from '@/assets/india-map.png';
import screenshotExplore from '@/assets/screenshot-explore.png';
import screenshotHome from '@/assets/screenshot-home.png';
import screenshotUniversity from '@/assets/screenshot-university.png';

import NavSection from '@/components/landing/NavSection';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import MapSection from '@/components/landing/MapSection';
import CtaSection from '@/components/landing/CtaSection';
import FooterSection from '@/components/landing/FooterSection';

export default function Landing() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#080c17', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Helmet>
        <title>Unigramm — Your Campus</title>
        <meta name="description" content="Unigramm is the all-in-one campus app for Indian university students — connect, collaborate, date, trade, and thrive with your college community." />
      </Helmet>
      <NavSection logo={logoImg} />
      <HeroSection indiaMap={indiaMapImg} screenshots={[screenshotExplore, screenshotHome, screenshotUniversity]} />
      <FeaturesSection />
      <MapSection indiaMap={indiaMapImg} />
      <CtaSection />
      <FooterSection logo={logoImg} />
    </div>
  );
}
