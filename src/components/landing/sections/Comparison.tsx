'use client';

import { motion } from 'framer-motion';
import { ScrollReveal } from '../ScrollReveal';
import { Check, X } from 'lucide-react';

const features = [
  { name: 'Real-time Adaptivity', traditional: false, ai: true },
  { name: 'AI-Powered Optimization', traditional: false, ai: true },
  { name: 'Emergency Prioritization', traditional: false, ai: true },
  { name: 'Predictive Analytics', traditional: false, ai: true },
  { name: 'Scalable & Cost-Effective', traditional: false, ai: true },
  { name: 'Fixed Signal Timing', traditional: true, ai: false },
  { name: 'Manual Monitoring', traditional: true, ai: false },
  { name: 'Reactive Responses', traditional: true, ai: false },
];

export function Comparison() {
  return (
    <section className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-200 mb-6">
            Why This Stands Out
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            A head-to-head comparison of traditional and AI-powered traffic control.
          </p>
        </ScrollReveal>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-x-auto"
        >
          <table className="w-full glass-effect rounded-xl overflow-hidden">
            <thead>
              <tr>
                <th className="text-left py-4 px-6 text-slate-300 font-medium border-b border-white/10">
                  Feature
                </th>
                <th className="text-center py-4 px-6 text-slate-300 font-medium border-b border-white/10">
                  <div className="inline-block text-lg font-bold text-slate-400">
                    Traditional Systems
                  </div>
                </th>
                <th className="text-center py-4 px-6 text-slate-300 font-medium border-b border-white/10">
                  <div className="inline-block text-lg font-bold text-cyan-300">
                    AI-Powered System
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/8 hover:bg-slate-800/35 transition-colors"
                >
                  <td className="py-4 px-6 text-slate-200 font-medium">{feature.name}</td>
                  <td className="py-4 px-6 text-center">
                    {feature.traditional ? (
                      <Check className="w-6 h-6 text-slate-300 mx-auto" />
                    ) : (
                      <X className="w-6 h-6 text-slate-500 mx-auto" />
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {feature.ai ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                      >
                        <Check className="w-6 h-6 text-cyan-300 mx-auto" />
                      </motion.div>
                    ) : (
                      <X className="w-6 h-6 text-slate-500 mx-auto" />
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Bottom insights */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {[
            {
              title: 'Cost-Effective',
              desc: 'Uses existing CCTV infrastructure',
            },
            {
              title: 'Scalable',
              desc: 'Works for cities of any size',
            },
            {
              title: 'Life-Saving',
              desc: '50% faster emergency response',
            },
          ].map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-effect rounded-xl p-6 border-white/10 text-center"
            >
              <h3 className="text-xl font-bold text-cyan-300 mb-2">{insight.title}</h3>
              <p className="text-slate-400">{insight.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
