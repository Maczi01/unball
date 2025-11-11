import { Camera } from "lucide-react";

export default function HeaderSection() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b border-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-sky-500 grid place-content-center text-white">
            <Camera className="h-4 w-4" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Snaptrip</span>
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
          <a className="hover:text-gray-900" href="#how">How it works</a>
          <a className="hover:text-gray-900" href="#modes">Modes</a>
          <a className="hover:text-gray-900" href="#community">Community</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/login" className="px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">Log in</a>
          <a href="/signup" className="px-3 py-2 rounded-xl text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 shadow-sm">Sign up</a>
        </div>
      </div>
    </header>
  );
}
