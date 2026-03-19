import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function MapSection({ indiaMap }: { indiaMap: string }) {
  const [userCount, setUserCount] = useState(240);
  const [startupCount, setStartupCount] = useState(15);

  useEffect(() => {
    const fetchCounts = async () => {
      const [profilesRes, startupRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('student_startups').select('id', { count: 'exact', head: true }),
      ]);
      if (profilesRes.count && profilesRes.count > 0) setUserCount(profilesRes.count);
      if (startupRes.count && startupRes.count > 0) setStartupCount(startupRes.count);
    };
    fetchCounts();
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0.1, 0.6], [1, 2.4]);

  return (
    <section style={{ padding: "clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)" }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#4f8eff" }}>
            Where we are
          </p>
          <h2
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              fontWeight: 700,
            }}
          >
            Going live at SNU, Delhi.
          </h2>
        </motion.div>

        {/* Map container */}
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden mb-6"
          style={{ height: "clamp(280px, 50vw, 450px)", background: "#0f1525" }}
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center map-zoom-origin"
            style={{ scale }}
          >
            <img src={indiaMap} alt="India map" className="w-full h-full object-contain opacity-30" />

            {/* Delhi dot */}
            <div className="absolute map-dot-position" style={{ transform: "translate(-50%, -50%)" }}>
              {/* Pulsing rings */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: `${24 + i * 16}px`,
                    height: `${24 + i * 16}px`,
                    left: `${-(12 + i * 8)}px`,
                    top: `${-(12 + i * 8)}px`,
                    border: "1px solid rgba(79,142,255,0.3)",
                    animation: `ping-ring 2s ${i * 0.4}s infinite ease-out`,
                  }}
                />
              ))}
              {/* Core dot */}
              <div
                className="w-3 h-3 rounded-full relative"
                style={{
                  background: "#4f8eff",
                  boxShadow: "0 0 20px rgba(79,142,255,0.6)",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: "rgba(79,142,255,0.4)" }}
                />
              </div>
              {/* Label — positioned above the dot */}
              <div
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  bottom: "18px",
                  background: "rgba(79,142,255,0.12)",
                  color: "#4f8eff",
                  border: "1px solid rgba(79,142,255,0.2)",
                }}
              >
                <MapPin className="w-3 h-3" /> SNU · Delhi
              </div>
            </div>
          </motion.div>
        </div>

        {/* Single campus card — no "coming soon" */}
        <div className="rounded-2xl p-5 max-w-md" style={{ background: "#111827", border: "1px solid rgba(79,142,255,0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: "#fbbf24" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#fbbf24" }}>
              Going live
            </span>
          </div>
          <p className="text-base font-bold text-white mb-1">Shiv Nadar University</p>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            Greater Noida, Delhi
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { n: `${userCount}`, l: "Users" },
              { n: `${startupCount}`, l: "Startups" },
              { n: "8", l: "Clubs" },
            ].map((s) => (
              <div key={s.l} className="text-center p-2.5 rounded-xl" style={{ background: "rgba(79,142,255,0.06)" }}>
                <div className="text-sm font-bold" style={{ color: "#4f8eff" }}>
                  {s.n}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .map-zoom-origin { transform-origin: 41% 30%; }
        .map-dot-position { left: 41%; top: 30%; }
        @media (min-width: 768px) {
          .map-zoom-origin { transform-origin: 45% 32%; }
          .map-dot-position { left: 45%; top: 32%; }
        }
      `}</style>
    </section>
  );
}
