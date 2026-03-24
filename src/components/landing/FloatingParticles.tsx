'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function FloatingParticles() {
  const [isClient, setIsClient] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(800);

  useEffect(() => {
    setIsClient(true);
    setViewportHeight(window.innerHeight);
  }, []);

  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    duration: 15 + Math.random() * 10,
    delay: Math.random() * 5,
    size: 2 + Math.random() * 4,
    left: Math.random() * 100,
    opacity: 0.04 + Math.random() * 0.16,
  }));

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-cyan-300"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            top: '-20px',
            opacity: particle.opacity,
          }}
          animate={{
            y: viewportHeight + 100,
            x: Math.sin(particle.id) * 100,
            opacity: [particle.opacity, particle.opacity, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}
