import { motion } from "framer-motion";
import { BarChart3, Check, LayoutDashboard, ScanSearch, Siren, Timer, Video } from "lucide-react";
import SectionWrapper from "./SectionWrapper.tsx";

const steps = [
  {
    icon: Video,
    title: "CCTV / Video Feed Input",
    desc: "Live feeds from existing city cameras are streamed into the system, providing the foundational data for real-time analysis.",
    features: [
      { text: "High-resolution stream processing" },
    ],
  },
  {
    icon: ScanSearch,
    title: "AI Vehicle & Lane Analysis",
    desc: "Our model meticulously analyze the video feeds to detect vehicles, count their density, and classify lane types.",
    features: [
      { text: "Accurate vehicle detection and classification" },
      { text: "Lane occupancy and flow rate analysis" },
    ],
  },
  {
    icon: BarChart3,
    title: "Traffic Density Calculation",
    desc: "Real-time density scores are computed for each lane, coupled with a congestion classification system to identify potential bottlenecks.",
    features: [
      { text: "Congestion level categorization (Low, Medium, High)" },
      { text: "Predictive traffic modeling" },
    ],
  },
  {
    icon: Timer,
    title: "Signal Timing Optimization",
    desc: "Adaptive algorithms dynamically adjust green and red light phases based on the real-time traffic data, ensuring smooth flow.",
    features: [
      { text: "Dynamic cycle length adjustment" },
      { text: "Reduced wait times and emissions" },
      { text: "Coordination between adjacent intersections" },
    ],
  },
  {
    icon: Siren,
    title: "Emergency Override",
    desc: "Emergency vehicles are automatically detected, triggering an instant green corridor to expedite their passage through traffic.",
    features: [
      { text: "Pre-emptive signal adjustments for clearing paths" },
    ],
  },
  {
    icon: LayoutDashboard,
    title: "Live Dashboard Output",
    desc: "All processed data is visualized in a unified, intuitive command center, empowering traffic operators with actionable insights.",
    features: [
      { text: "Interactive map with real-time traffic status" },
    ],
  },
];

const HowItWorks = () => (
  <SectionWrapper id="how-it-works">
    <div className="text-center mt-20 mb-16 space-y-4">
      <p className="text-xs uppercase tracking-[0.25em] text-primary font-medium">Process</p>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display">
        How It <span className="gradient-text text-cyan-300">Works</span>
      </h2>
    </div>

    <div className="max-w-4xl mx-auto mb-20">
      <div className="space-y-12">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
            className="grid md:grid-cols-12 gap-8 items-start"
          >
            {/* Left side: Step number and title */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-primary font-semibold tracking-wider">STEP {i + 1}</p>
                  <h3 className="text-lg font-bold text-slate-100 font-display">{s.title}</h3>
                </div>
              </div>
            </div>

            {/* Right side: Description and features */}
            <div className="md:col-span-8">
              <div className="glass-panel p-6 rounded-lg border-2 border-transparent hover:border-primary/30 transition-colors duration-300">
                <p className="text-muted-foreground mb-4">{s.desc}</p>
                <ul className="space-y-2">
                  {s.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-400 shrink-0" />
                      <span className="text-sm text-slate-300">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </SectionWrapper>
);

export default HowItWorks;
