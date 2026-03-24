'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Cpu,
  MonitorPlay,
  Sparkles,
  Video,
} from 'lucide-react';
import { ScrollReveal } from '../ScrollReveal';

const steps = [
  {
    icon: Video,
    title: 'CCTV Feed Input',
    description: 'Video streams from traffic cameras feed into the system.',
  },
  {
    icon: Sparkles,
    title: 'AI Analysis',
    description: 'Computer vision detects vehicles, lanes, and traffic patterns.',
  },
  {
    icon: BarChart3,
    title: 'Density Calculation',
    description: 'Real-time density metrics computed for each intersection.',
  },
  {
    icon: Cpu,
    title: 'Signal Optimization',
    description: 'AI algorithms optimize signal timing for maximum flow.',
  },
  {
    icon: AlertCircle,
    title: 'Emergency Override',
    description: 'Instant activation of green corridor for ambulances.',
  },
  {
    icon: MonitorPlay,
    title: 'Live Dashboard',
    description: 'Real-time visualization of all traffic metrics.',
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-200 mb-6">
            The Intelligent
            <span className="text-cyan-300">
              {' '}
              Pipeline
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            See how AI transforms raw traffic data into intelligent signal control.
          </p>
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-linear-to-r from-transparent via-cyan-400/35 to-transparent" />

          {/* Steps grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative"
                >
                  {/* Step number badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 + 0.2 }}
                    className="absolute -top-12 left-0 w-12 h-12 rounded-full bg-slate-900 text-cyan-300 font-bold text-lg flex items-center justify-center border-4 border-slate-950 glow-border"
                  >
                    {i + 1}
                  </motion.div>

                  {/* Card */}
                  <div className="glass-effect rounded-xl p-8 h-full pt-16">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-slate-800/80 border border-cyan-400/25 text-cyan-300 flex-shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-200 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Final arrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex justify-center mt-16"
        >
          <div className="text-4xl text-cyan-300 animate-bounce">↓</div>
        </motion.div>

        {/* Result statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mt-8 p-6 rounded-xl glass-effect glow-border"
        >
          <p className="text-xl font-semibold text-cyan-300">
            Intelligent Traffic Flow Achieved
          </p>
          <p className="text-slate-400 mt-2">
            Optimized signal timing, reduced congestion, and faster emergency response.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
