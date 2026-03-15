import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageCircle, Users, Lightbulb, Compass, Clock, ShoppingBag, UsersRound, BarChart3, UserCircle } from 'lucide-react';

const features = [
  { icon: MessageCircle, title: 'Campus Chat', desc: 'Real-time messaging with your campus community.', live: true },
  { icon: Users, title: 'Clubs & Orgs', desc: 'Discover and join student organisations.', live: true },
  { icon: Lightbulb, title: 'Ideas & Ventures', desc: 'Showcase and explore student startups.', live: true },
  { icon: Compass, title: 'Explore', desc: 'Trending posts, hashtags and stories.', live: true },
  { icon: Clock, title: 'Timetable Widget', desc: 'Your class schedule at a glance.', live: true },
  { icon: ShoppingBag, title: 'Marketplace', desc: 'Buy & sell within campus.', live: false },
  { icon: UsersRound, title: 'Groups', desc: 'Private group discussions.', live: false },
  { icon: BarChart3, title: 'Polls & Surveys', desc: 'Create and vote on campus polls.', live: true },
  { icon: UserCircle, title: 'Profile', desc: 'Your digital campus identity.', live: true },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="relative rounded-2xl overflow-hidden aspect-square sm:aspect-auto"
      style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.08)' }}
    >
      {/* Mouse glow */}
      {hovering && (
        <div className="absolute inset-0 pointer-events-none transition-opacity" style={{
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(79,142,255,0.08), transparent 60%)`
        }} />
      )}
      <div className="relative z-10 p-4 sm:p-5 h-full flex flex-col justify-between">
        <div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(79,142,255,0.1)' }}>
            <Icon className="w-4 h-4" style={{ color: '#4f8eff' }} />
          </div>
          <p className="text-sm font-semibold text-white mb-1">{feature.title}</p>
          <p className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{feature.desc}</p>
        </div>
        <div className="mt-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={feature.live
              ? { background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
              : { background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }
            }>
            {feature.live ? 'Live now' : 'Coming soon'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section style={{ background: '#0f1525', padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div className="mb-10" initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4f8eff' }}>Everything inside</p>
          <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700 }}>
            Eight worlds. One campus.
          </h2>
        </motion.div>

        {/* Desktop: asymmetric grid, Mobile: 2-col square grid */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
        <div className="hidden sm:grid gap-3" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridAutoRows: 'minmax(140px, auto)' }}>
          {features.map((f, i) => {
            const spans = [
              'col-span-4', 'col-span-4', 'col-span-4',
              'col-span-6', 'col-span-6',
              'col-span-4', 'col-span-4', 'col-span-4',
            ];
            // Last card spans remaining
            const span = i < spans.length ? spans[i] : 'col-span-12';
            return <div key={f.title} className={span}><FeatureCard feature={f} index={i} /></div>;
          })}
        </div>
      </div>
    </section>
  );
}
