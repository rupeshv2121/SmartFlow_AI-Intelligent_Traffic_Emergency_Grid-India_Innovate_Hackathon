'use client';

import {
  Building2,
  Gauge,
  Shield,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { ScrollReveal } from '../ScrollReveal';

const useCases = [
  {
    icon: Building2,
    title: 'Smart Cities',
    description:
      'Complete intelligent traffic infrastructure for modern urban centers.',
  },
  {
    icon: Shield,
    title: 'Municipal Corporations',
    description:
      'City-wide traffic management and optimization systems.',
  },
  {
    icon: Zap,
    title: 'Emergency Services',
    description:
      'Critical response time improvement for emergency vehicles.',
  },
  {
    icon: Smartphone,
    title: 'Commuters & Citizens',
    description:
      'Reduced travel times and better route recommendations via apps.',
  },
  {
    icon: Gauge,
    title: 'Traffic Authorities',
    description:
      'Real-time monitoring and data-driven decision support.',
  },
  {
    icon: Users,
    title: 'Smart Governance',
    description:
      'Sustainable urban development and quality of life improvements.',
  },
];

export function UseCases() {
  return (
    <section className="relative py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-200 mb-6">
            Who Benefits
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            From smart cities to emergency services, our system empowers stakeholders.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, i) => {
            const Icon = useCase.icon;
            return (
              <GlassCard key={i} delay={i * 0.08}>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-800/80 border border-cyan-400/25 w-fit shadow-[0_0_18px_rgba(34,211,238,0.1)]">
                    <Icon className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {useCase.description}
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
