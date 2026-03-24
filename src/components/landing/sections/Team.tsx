'use client';

import { motion } from 'framer-motion';
import bhomikVarshneyImage from '../../../assets/bhomik-varshney.jpg';
import austinVarshneyImage from '../../../assets/austin-varshney.png';
import aryanParasharImage from '../../../assets/aryan-parashar.jpeg';
import prakharSaxenaImage from '../../../assets/prakhar-saxena.jpeg';
import rupeshVarshneyImage from '../../../assets/rupesh-varshney.jpeg';
import { ScrollReveal } from '../ScrollReveal';

const teamMembers = [
  {
    name: 'Rupesh Varshney',
    role: 'Full Stack Developer',
    avatar: rupeshVarshneyImage,
  },
  {
    name: 'Austin Varshney',
    role: 'Full Stack Developer',
    avatar: austinVarshneyImage,
  },
  {
    name: 'Bhomik Varshney',
    role: 'AI Developer',
    avatar: bhomikVarshneyImage,
  },
  {
    name: 'Prakhar Saxena',
    role: 'ML Developer',
    avatar: prakharSaxenaImage,
  },
   {
    name: 'Aryan Parashar',
    role: 'AI Developer',
    avatar: aryanParasharImage,
  },
];

export function Team() {
  return (
    <section className="relative py-20 px-4">
      <div className="relative z-10 max-w-6xl mx-auto">
        <ScrollReveal className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-200">
            Meet the Innovators
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A passionate team of developers and thinkers dedicated to solving
            real-world traffic challenges with cutting-edge technology.
          </p>
        </ScrollReveal>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.1 }}
          className="flex flex-wrap justify-center gap-18 pt-16"
        >
          {teamMembers.map((member, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
              className="group text-center"
            >
              <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-white/10 group-hover:border-cyan-400/50 transition-all duration-300 transform group-hover:scale-105 shadow-[0_12px_26px_rgba(2,6,23,0.45)] ">
                <img
                  src={member.avatar}
                  alt={`Avatar of ${member.name}`}
                  className="w-full h-full object-cover group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-200">{member.name}</h3>
              <p className="text-cyan-300">{member.role}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
