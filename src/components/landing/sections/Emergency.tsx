'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Ambulance, MapPin } from 'lucide-react';
import { ScrollReveal } from '../ScrollReveal';

export function Emergency() {
  return (
    <section className="relative py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-200 mb-6">
            Emergency Response,
            <span className="text-cyan-300">
              {' '}
              Elevated
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Life-saving technology that prioritizes emergency vehicles with intelligent green corridors.
          </p>
        </ScrollReveal>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-effect rounded-2xl p-12 border-white/10 relative overflow-hidden">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 24px rgba(34, 211, 238, 0.06)',
                  '0 0 36px rgba(34, 211, 238, 0.14)',
                  '0 0 24px rgba(34, 211, 238, 0.06)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl"
            />

            <div className="relative z-10 space-y-8">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/75 border border-cyan-400/20"
              >
                <Ambulance className="w-8 h-8 text-cyan-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-cyan-300 mb-2">
                    Emergency Vehicle Detected
                  </h3>
                  <p className="text-slate-400">
                    System identifies ambulance, fire truck, or police vehicle through GPS or CCTV
                    recognition.
                  </p>
                </div>
              </motion.div>

              {/* Arrow */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex justify-center text-cyan-300 text-2xl"
              >
                ↓
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/75 border border-cyan-400/20"
              >
                <AlertTriangle className="w-8 h-8 text-cyan-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-cyan-300 mb-2">
                    Signal Override Activated
                  </h3>
                  <p className="text-slate-400">
                    AI immediately overrides current signal timing and initiates emergency
                    protocols.
                  </p>
                </div>
              </motion.div>

              {/* Arrow */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className="flex justify-center text-cyan-300 text-2xl"
              >
                ↓
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/75 border border-cyan-400/20"
              >
                <MapPin className="w-8 h-8 text-cyan-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-cyan-300 mb-2">
                    Green Corridor Enabled
                  </h3>
                  <p className="text-slate-400">
                    Entire route turns green, allowing emergency vehicles to reach their destination
                    50% faster.
                  </p>
                </div>
              </motion.div>

              {/* Result box */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="mt-8 p-6 rounded-lg bg-slate-800/75 border border-cyan-400/30 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
              >
                <p className="text-center text-lg font-bold text-slate-200">
                  Result: <span className="text-cyan-300">Lifesaving Response Time</span>
                </p>
                <p className="text-center text-slate-400 mt-2">
                  Every second counts in emergencies. Our system ensures maximum efficiency when
                  it matters most.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
