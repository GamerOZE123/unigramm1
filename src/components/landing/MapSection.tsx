import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MapPin } from "lucide-react";

export default function MapSection({ indiaMap }: { indiaMap: string }) {
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
            Live at SNU, Delhi NCR.
          </h2>
        </motion.div>

        {/* Map container */}
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden mb-6"
          style={{ height: "clamp(280px, 50vw, 450px)", background: "#0f1525" }}
        >
          {/* Map + dot scale together so the dot stays pinned during zoom */}
          <motion.div className="absolute inset-0 flex items-center justify-center" style={{ scale, transformOrigin: "50% 50%" }}>
            <img src={indiaMap} alt="India map" className="w-full h-full object-contain opacity-30" />

            {/* Delhi dot — coordinates relative to the map container */}
            <div className="absolute" style={{ left: "38%", top: "32%", transform: "translate(-50%, -50%)" }}>
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
              {/* Label */}
              <div
                className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  background: "rgba(79,142,255,0.12)",
                  color: "#4f8eff",
                  border: "1px solid rgba(79,142,255,0.2)",
                }}
              >
                <MapPin className="w-3 h-3" /> SNU · Delhi NCR
              </div>
            </div>
          </motion.div>
        </div>

        {/* Campus cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Live campus */}
          <div className="rounded-2xl p-5" style={{ background: "#111827", border: "1px solid rgba(79,142,255,0.1)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#4ade80" }}>
                Currently live
              </span>
            </div>
            <p className="text-base font-bold text-white mb-1">Shiv Nadar University</p>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              Greater Noida, Delhi NCR
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { n: "240+", l: "Students" },
                { n: "15+", l: "Startups" },
                { n: "8+", l: "Clubs" },
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

          {/* Coming soon */}
          <div
            className="rounded-2xl p-5 flex items-center justify-center"
            style={{ border: "2px dashed rgba(79,142,255,0.15)", background: "rgba(15,21,37,0.5)", minHeight: "160px" }}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🎓</div>
              <p className="text-sm font-semibold text-white mb-1">More campuses coming soon</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Your university could be next
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
