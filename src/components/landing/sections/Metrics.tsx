'use client';

import { motion } from 'framer-motion';
import { Clock, Smartphone, TrendingDown, Zap } from 'lucide-react';
import { AnimatedCounter } from '../AnimatedCounter';
import { ScrollReveal } from '../ScrollReveal';

const metrics = [
  {
    icon: TrendingDown,
    end: 35,
    suffix: '%',
    label: 'Less Congestion',
    description: 'Significant reduction in traffic bottlenecks',
  },
  {
    icon: Zap,
    end: 50,
    suffix: '%',
    label: 'Faster Emergency Response',
    description: 'Reduced wait times for critical vehicles',
  },
  {
    icon: Clock,
    end: 24,
    suffix: '/7',
    label: 'Real-Time Monitoring',
    description: 'Continuous AI-powered traffic analysis',
  },
  {
    icon: Smartphone,
    end: 99,
    suffix: '%',
    label: 'System Uptime',
    description: 'Enterprise-grade reliability',
  },
];

export function Metrics() {
  return (
    <section className="relative py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-200 mb-6">
            Impact & Metrics
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Real-world results from AI-powered traffic optimization systems.
          </p>
        </ScrollReveal>

        {/* Metrics grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group glass-effect rounded-xl p-8 transition-all duration-300 hover:shadow-[0_16px_30px_rgba(2,6,23,0.5)] hover:border-cyan-400/35"
              >
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-slate-800/80 border border-cyan-400/25 text-cyan-300 w-fit group-hover:bg-slate-800 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Animated number */}
                  <div className="space-y-1">
                    <div className="text-5xl font-bold text-cyan-300">
                      <AnimatedCounter
                        end={metric.end}
                        duration={2.5}
                        suffix={metric.suffix}
                      />
                    </div>
                    <div className="text-lg font-semibold text-slate-200">
                      {metric.label}
                    </div>
                  </div>

                  <p className="text-sm text-slate-400">
                    {metric.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom insight */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 text-center p-8 rounded-xl glass-effect border-white/10"
        >
          <p className="text-2xl font-bold text-slate-200 mb-2">
            Smart Cities Deserve Smart Traffic
          </p>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Our AI system turns every intersection into an intelligent decision point,
            creating safer, faster, and more efficient urban transportation.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
