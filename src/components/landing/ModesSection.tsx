import { motion } from "framer-motion";
import { MapPin, Trophy } from "lucide-react";

const modes = [
  {
    title: "Classic Mode",
    icon: MapPin,
    desc: "Guess random travel photos anytime. Practice and improve your sense of place.",
    cta: "Start Guessing",
    href: "/play/normal",
  },
  {
    title: "Daily Challenge",
    icon: Trophy,
    desc: "One global photo every day at 00:00 UTC. First try counts for the leaderboard.",
    cta: "Play Daily",
    href: "/play/daily",
  },
];

export default function ModesSection() {
  return (
    <section id="modes" className="bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Choose your mode</h2>
          <p className="mt-3 text-gray-600">Play for fun or compete worldwide.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modes.map((mode, i) => {
            const Icon = mode.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 grid place-content-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{mode.title}</h3>
                    <p className="mt-1 text-gray-600 text-sm leading-relaxed">{mode.desc}</p>
                    <div className="mt-4">
                      <a
                        href={mode.href}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
                      >
                        {mode.cta}
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
