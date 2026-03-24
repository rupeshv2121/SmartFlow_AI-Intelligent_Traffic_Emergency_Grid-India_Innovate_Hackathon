'use client';

import { motion } from 'framer-motion';
import { Activity, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { FloatingParticles } from '../FloatingParticles';
import { GlowButton } from '../GlowButton';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-12 pb-20 px-4 overflow-hidden">
      <FloatingParticles />
      
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-cyan-300/6 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glow-border bg-slate-900/60"
          >
            <Activity className="w-4 h-4 text-cyan-300" />
            <span className="text-sm font-medium text-cyan-300">Hackathon Innovation</span>
          </motion.div>

          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-slate-200 leading-tight">
              Reinventing{' '}
              <span className="text-cyan-300">
                Urban Traffic
              </span>{' '}
              with AI
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-slate-400 max-w-xl leading-relaxed"
          >
            Transform chaotic traffic flow into intelligent, adaptive systems using real-time AI analysis. Reduce congestion by 35%, accelerate emergency response, and enable smart city infrastructure.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <Link to="/dashboard">
            <GlowButton variant="primary">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2 inline" />
            </GlowButton>
            </Link>
            <GlowButton variant="outline">
              Explore Features
            </GlowButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10"
          >
            <div>
              <div className="text-2xl font-bold text-cyan-300">35%</div>
              <div className="text-sm text-slate-400">Less Congestion</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">50%</div>
              <div className="text-sm text-slate-400">Faster Response</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-200">24/7</div>
              <div className="text-sm text-slate-400">Real-Time</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right side - Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          <div className="glass-effect rounded-2xl p-8 space-y-6 glow-border-blue">
            {/* Dashboard header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-100">Live Traffic Control</h3>
              <div className="w-3 h-3 rounded-full bg-cyan-300 animate-pulse" />
            </div>

            {/* Lane Status */}
            <div className="space-y-3">
              <p className="text-sm text-slate-400 font-medium">Lane Density Analysis</p>
              {['Lane 1 - Heavy', 'Lane 2 - Moderate', 'Lane 3 - Light'].map((lane, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{lane}</span>
                    <span className="text-cyan-300">{70 - i * 20}%</span>
                  </div>
                  <div className="h-2 bg-slate-700/70 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${70 - i * 20}%` }}
                      transition={{ duration: 1.5, delay: 0.5 + i * 0.2 }}
                      className="h-full bg-cyan-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Signal Status */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
              {['Signal 1', 'Signal 2', 'Signal 3'].map((signal, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-slate-800/70 border border-white/8 text-center"
                >
                  <div className="text-xs text-slate-400 mb-2">{signal}</div>
                  <div
                    className="text-lg font-bold"
                    style={{
                      color: i === 0 ? '#22D3EE' : '#64748B',
                    }}
                  >
                    {i === 0 ? '●' : i === 1 ? '●' : '●'}
                  </div>
                </div>
              ))}
            </div>

            {/* Stats footer */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="p-3 rounded-lg bg-slate-800/70 border border-white/10 shadow-[0_10px_24px_rgba(2,6,23,0.45)]">
                <div className="text-2xl font-bold text-cyan-300">247</div>
                <div className="text-xs text-slate-400">Vehicles Detected</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/70 border border-white/10 shadow-[0_10px_24px_rgba(2,6,23,0.45)]">
                <div className="text-2xl font-bold text-slate-100">12s</div>
                <div className="text-xs text-slate-400">Avg Wait Time</div>
              </div>
            </div>
          </div>

          <div className="absolute -inset-3 rounded-2xl border border-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.08)] -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
