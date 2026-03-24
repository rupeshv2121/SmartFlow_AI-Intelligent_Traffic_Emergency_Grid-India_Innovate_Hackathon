'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';
import { Link } from 'wouter';
import { GlowButton } from '../GlowButton';
import { ScrollReveal } from '../ScrollReveal';

export function CTA() {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-400/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-300/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <ScrollReveal className="text-center space-y-8">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-6xl font-bold text-slate-200 leading-tight"
          >
            Transform Traffic Chaos into
            <span className="text-cyan-300">
              {' '}
              Intelligent Flow
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Join the future of urban traffic management. Deploy AI-powered traffic
            optimization in your city and see the impact immediately.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-8"
          >
            <Link to='/dashboard'>
            <GlowButton variant="primary" className="text-lg px-8 py-4">
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </GlowButton>
            </Link>

            <a href='https://github.com/AustinVarshney/SmartFlow_AI-Intelligent_Traffic_Emergency_Grid-India_Innovate_Hackathon' target="_blank" rel="noopener noreferrer">
            <GlowButton variant="secondary" className="text-lg px-8 py-4">
              Explore GitHub
              <Github className="w-5 h-5 ml-2 inline" />
            </GlowButton>
            </a>
          </motion.div>

          {/* Trust statement */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-slate-400 text-sm pt-8"
          >
            Trusted by leading municipalities and smart city initiatives worldwide.
          </motion.p>
        </ScrollReveal>
      </div>
    </section>
  );
}
