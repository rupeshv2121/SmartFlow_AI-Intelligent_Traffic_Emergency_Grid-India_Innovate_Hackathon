'use client';

import {
  AlertCircle,
  Brain,
  Camera,
  Gauge,
  Navigation,
  Radio,
} from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { ScrollReveal } from '../ScrollReveal';

const features = [
  {
    icon: Brain,
    title: 'AI Traffic Analysis',
    description:
      'Real-time computer vision analyzes vehicle density and flow patterns from CCTV feeds.',
  },
  {
    icon: Radio,
    title: 'Adaptive Signal Timing',
    description:
      'Dynamically adjusts traffic light duration based on current demand and congestion levels.',
  },
  {
    icon: AlertCircle,
    title: 'Emergency Prioritization',
    description:
      'Automatic green corridor activation for ambulances and emergency vehicles.',
  },
  {
    icon: Camera,
    title: 'Smart CCTV Integration',
    description:
      'Leverages existing city camera infrastructure for cost-effective deployment.',
  },
  {
    icon: Gauge,
    title: 'Real-Time Dashboard',
    description:
      'Live monitoring of all traffic signals, flow metrics, and system health.',
  },
  {
    icon: Navigation,
    title: 'Smart Route Recommendations',
    description:
      'Guides drivers through optimal routes to avoid congestion and reduce travel time.',
  },
];

export function Solution() {
  return (
    <section className="relative py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-200 mb-6">
            The AI-Powered
            <span className="text-cyan-300">
              {' '}
              Answer
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            An intelligent traffic management system that learns, adapts, and optimizes
            in real-time.
          </p>
        </ScrollReveal>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <GlassCard
                key={i}
                delay={i * 0.1}
                className="group hover:glow-border"
              >
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-slate-800/80 border border-cyan-400/25 text-cyan-300 w-fit group-hover:bg-slate-800 group-hover:shadow-[0_0_18px_rgba(34,211,238,0.14)] transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
