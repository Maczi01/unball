import { Camera, MapPin, Compass } from "lucide-react";

const howItWorksItems = [
  {
    icon: Camera,
    title: "Snap it",
    desc: "Upload your travel photo. We'll help you set the spot on the map.",
  },
  {
    icon: MapPin,
    title: "Guess it",
    desc: "Others drop a pin or type the city. The closer, the higher the score.",
  },
  {
    icon: Compass,
    title: "Reveal it",
    desc: "See how far they were and share the round with friends.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">How it works</h2>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">One simple loop that never gets old.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {howItWorksItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
              <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 grid place-content-center mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
