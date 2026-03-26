import HowItWorks from '@/components/landing/sections/HowItWorks';
import { Comparison } from '../components/landing/sections/Comparison';
import { CTA } from '../components/landing/sections/CTA';
import { Footer } from '../components/landing/sections/Footer';
import { Hero } from '../components/landing/sections/Hero';
import { Metrics } from '../components/landing/sections/Metrics';
import { Problem } from '../components/landing/sections/Problem';
import { Solution } from '../components/landing/sections/Solution';
import { Team } from '../components/landing/sections/Team';
import { UseCases } from '../components/landing/sections/UseCases';

export const metadata = {
  title: 'Smart Traffic Management - AI-Powered Urban Traffic Optimization',
  description:
    'Transform urban traffic with intelligent AI-powered traffic management. Reduce congestion by 35%, accelerate emergency response, and enable smart city infrastructure.',
  keywords: [
    'traffic management',
    'AI traffic control',
    'smart cities',
    'traffic optimization',
    'emergency response',
  ],
};

export default function Home() {
  return (
    <main className="landing-command-center overflow-hidden">
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <Metrics />
      <Comparison />
      <UseCases />
      <Team />
      <hr />
      <CTA />
      <Footer />
    </main>
  );
}
