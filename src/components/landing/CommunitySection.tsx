import { Upload } from "lucide-react";

const communityPhotos = [
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526779259212-939e64788e3c?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=1600&auto=format&fit=crop",
];

export default function CommunitySection() {
  return (
    <section id="community" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">From the community</h2>
        <p className="mt-3 text-gray-600">Real snaps from travelers worldwide.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {communityPhotos.map((src, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-100">
            <img src={src} alt="travel snap" className="h-40 md:h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <a href="/upload" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-sky-200 text-sky-700 hover:bg-sky-50 font-medium">
          <Upload className="h-4 w-4" /> Share your snap
        </a>
      </div>
    </section>
  );
}
