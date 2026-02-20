import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, MessageCircle, Users, Briefcase, Heart, 
  TrendingUp, Shield, Zap, Globe, ChevronRight, Star
} from 'lucide-react';

const features = [
  {
    icon: MessageCircle,
    title: 'Campus Chat',
    description: 'Connect with classmates, join group chats, and stay in the loop with your university community.',
  },
  {
    icon: Users,
    title: 'Clubs & Communities',
    description: 'Discover and join student clubs, organizations, and interest-based communities on campus.',
  },
  {
    icon: Briefcase,
    title: 'Jobs & Internships',
    description: 'Find internships, part-time jobs, and career opportunities tailored for students.',
  },
  {
    icon: Heart,
    title: 'Campus Dating',
    description: 'Meet other students who share your interests in a safe, university-verified environment.',
  },
  {
    icon: TrendingUp,
    title: 'Student Startups',
    description: 'Showcase your startup, find co-founders, and get support from the student entrepreneur community.',
  },
  {
    icon: Shield,
    title: 'Anonymous Confessions',
    description: 'Share your thoughts anonymously with your campus community in a judgement-free space.',
  },
];

const stats = [
  { value: '10K+', label: 'Students' },
  { value: '50+', label: 'Universities' },
  { value: '500+', label: 'Clubs' },
  { value: '1M+', label: 'Posts' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-foreground tracking-tight">Unigramm</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="text-muted-foreground hover:text-foreground"
            >
              Log in
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              className="btn-primary"
            >
              Sign up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4">
        {/* Glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 text-sm text-muted-foreground mb-8">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>The social platform built for university students</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Your campus life,{' '}
            <span className="text-transparent bg-clip-text university-gradient">
              all in one place
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with your university community. Chat, discover clubs, find jobs, 
            share moments, and make the most of your student experience.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="btn-primary text-base px-8 py-6 w-full sm:w-auto"
            >
              Get Started
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="text-base px-8 py-6 border-border text-foreground hover:bg-surface w-full sm:w-auto"
            >
              Already have an account? Log in
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need on campus
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From academics to social life, Unigramm brings your entire university experience together.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-primary text-primary" />
            ))}
          </div>
          <blockquote className="text-xl sm:text-2xl font-medium text-foreground leading-relaxed mb-6">
            "Unigramm completely changed how I experience university. I found my study group, 
            my first internship, and even my best friends — all through this platform."
          </blockquote>
          <p className="text-muted-foreground">— A happy student</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 sm:p-14 rounded-3xl border border-border bg-card relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="relative z-10">
              <Globe className="w-10 h-10 text-primary mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Ready to join your campus?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                Sign up in seconds and start connecting with students at your university today.
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="btn-primary text-base px-10 py-6"
              >
                Join Unigramm
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Unigramm</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Unigramm. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
