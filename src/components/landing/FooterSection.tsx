import { Camera } from "lucide-react";

export default function FooterSection() {
  return (
    <footer className="border-t border-slate-100 bg-white/70">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-sky-500 grid place-content-center text-white">
            <Camera className="h-4 w-4" />
          </div>
          <span>© {new Date().getFullYear()} Snaptrip</span>
        </div>
        <div className="flex items-center gap-4">
          <a className="hover:text-gray-900" href={"/"}>
            Instagram
          </a>
          <a className="hover:text-gray-900" href={"/contact"}>
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
