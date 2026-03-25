'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Github, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative bg-slate-950/70 border-t border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-slate-200 mb-2">
              SmartFlow AI
              <span className="text-cyan-300">.</span>
            </h3>
            <p className="text-slate-400 text-sm">
              AI-powered traffic optimization for modern cities.
            </p>
          </motion.div>

          {/* Product */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <h4 className="text-slate-200 font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {['Features', 'Pricing', 'Security', 'API'].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-cyan-300 transition-colors flex items-center gap-2">
                    {item}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-slate-200 font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-cyan-300 transition-colors flex items-center gap-2">
                    {item}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Connect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h4 className="text-slate-200 font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              {[
                { icon: Github, label: 'GitHub' },
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Mail, label: 'Email' },
              ].map(({ icon: Icon, label }) => (
                <motion.a
                  key={label}
                  href="#"
                  whileHover={{ scale: 1.1, color: 'rgb(34, 211, 238)' }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 rounded-lg bg-slate-800/80 border border-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400"
          >
            <p>
              © 2026 Smart Traffic. Built by{' '}
              <span className="text-cyan-300">Commit & Conquer Team</span>.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-cyan-300 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-cyan-300 transition-colors">
                Terms
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
