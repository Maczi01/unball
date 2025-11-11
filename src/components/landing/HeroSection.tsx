import { motion } from "framer-motion";
import { Play, Upload } from "lucide-react";

const heroImages = [
  {
    src: "https://plus.unsplash.com/premium_photo-1694475446158-966f8162b98a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2069",
    alt: "Coastline",
    caption: "Somewhere in... Canada?",
  },
  {
    src: "https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1600&auto=format&fit=crop",
    alt: "City tram",
    caption: "Lisbon, Porto… or somewhere else?",
  },
  {
    src: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?q=80&w=1600&auto=format&fit=crop",
    alt: "Mountain lake",
    caption: "How close can you get?",
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* background collage */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-[-10%] h-80 w-80 rounded-full bg-sky-200 blur-3xl opacity-60" />
        <div className="absolute -bottom-24 left-[-10%] h-96 w-96 rounded-full bg-teal-200 blur-3xl opacity-60" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 lg:pb-24">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-semibold tracking-tight text-slate-900 text-center"
        >
          Guess where the world takes you.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-4 text-lg md:text-xl text-gray-600 text-center max-w-2xl mx-auto"
        >
          Upload travel photos. Let everyone guess the location. Simple, fast, and dangerously fun.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <a
            href="/play/normal"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 text-white font-medium shadow-sm hover:bg-sky-700"
          >
            <Play className="h-4 w-4" /> Play Now
          </a>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-sky-200 text-sky-700 hover:bg-sky-50 font-medium"
          >
            <Upload className="h-4 w-4" /> Upload Photo
          </a>
        </motion.div>

        {/* Hero preview cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {heroImages.map((img, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 to-transparent text-white">
                <div className="text-sm opacity-90">{img.caption}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
