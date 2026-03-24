'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'glow';
  className?: string;
}

export function GlowButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
}: GlowButtonProps) {
  const baseStyles = 'px-8 py-3 rounded-full font-semibold transition-all duration-300 relative border';
  
  const variants = {
    primary: 'bg-slate-900/80 border-cyan-400/50 text-slate-100 glow-border hover:shadow-[0_0_28px_rgba(34,211,238,0.2)]',
    secondary: 'bg-slate-900/70 border-white/20 text-slate-200 hover:border-cyan-400/40 hover:text-cyan-200',
    outline: 'bg-transparent border-white/20 text-slate-300 hover:border-cyan-400/45 hover:text-cyan-200',
    glow: 'bg-cyan-400/20 border-cyan-400/50 text-cyan-300 glow-border-blue hover:shadow-[0_0_40px_rgba(34,211,238,0.3)]',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
