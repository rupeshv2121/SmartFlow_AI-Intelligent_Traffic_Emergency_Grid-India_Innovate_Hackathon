'use client';

import {
  AlertTriangle,
  Car,
  Clock,
  Cpu,
  Eye,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { ScrollReveal } from '../ScrollReveal';

const problems = [
  {
    icon: Zap,
    title: 'Fixed-Time Signals',
    description: 'Traditional traffic lights run on rigid timers, ignoring real-time traffic conditions.',
  },
  {
    icon: AlertTriangle,
    title: 'Peak Hour Gridlock',
    description:
      'No adaptive response to congestion spikes during rush hours creates massive bottlenecks.',
  },
  {
    icon: Clock,
    title: 'Delayed Emergency Response',
    description:
      'Emergency vehicles waste precious seconds waiting at red lights in congested intersections.',
  },
  {
    icon: Eye,
    title: 'No Real-Time Visibility',
    description:
      'Traffic authorities lack intelligent analysis of actual traffic patterns and density.',
  },
  {
    icon: Cpu,
    title: 'Manual Oversight',
    description:
      'Inefficient manual monitoring systems with no AI-powered decision support.',
  },
  {
    icon: Car,
    title:"Carbon Emissions",
    description:
      'Increased idling times at red lights contribute to higher pollution levels in cities.',
  }
];

export function Problem() {
  return (
    <section className="relative py-30 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-200 mb-6">
            Why Current Systems
            <span className="text-cyan-300">
              {' '}
              Fail
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Traditional traffic management relies on outdated fixed-time systems that can't
            adapt to modern urban complexity.
          </p>
        </ScrollReveal>

        {/* Problem cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <GlassCard key={i} delay={i * 0.1}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-slate-800/80 border border-cyan-400/25 text-cyan-300 shrink-0 shadow-[0_0_18px_rgba(34,211,238,0.1)]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">
                      {problem.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {problem.description}
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
