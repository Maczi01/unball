import { motion } from "framer-motion";
import { MapPin, Compass, Award, ArrowRight, Link as LinkIcon } from "lucide-react";
import { MapComponent } from "./MapComponent";
import type { PhotoScoreResultDTO } from "@/types";

interface FeedbackSectionProps {
  result: PhotoScoreResultDTO;
  runningTotal: number;
  currentPhoto: number; // 1-5
  totalPhotos: number; // 5
  onNext: () => void;
  userGuessPin: { lat: number; lon: number } | null;
  photoUrl: string;
}

// Helper functions
const fmt = (v: number): string => {
  return Number.isFinite(v) ? v.toLocaleString() : "0";
};

export function FeedbackSection({
  result,
  runningTotal,
  currentPhoto,
  totalPhotos,
  onNext,
  userGuessPin,
  photoUrl,
}: FeedbackSectionProps) {
  const progress = Math.min(100, Math.round((currentPhoto / totalPhotos) * 100));
  const isLastPhoto = currentPhoto === totalPhotos;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-sky-50 text-slate-900 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
      <Header runningTotal={runningTotal} />

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <ScoreBanner points={result.total_score} distanceKm={result.km_error} />

        <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PhotoCard src={photoUrl} />
          <MapCard
            userPin={userGuessPin}
            correctPin={{ lat: result.correct_lat, lon: result.correct_lon }}
            kmError={result.km_error}
          />
        </section>

        <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DetailsCard result={result} />
          <div className="space-y-6">
            <ProgressCard
              progress={progress}
              roundIndex={currentPhoto}
              totalRounds={totalPhotos}
              runningTotal={runningTotal}
            />
            <ActionsCard onNext={onNext} isLastPhoto={isLastPhoto} />
          </div>
        </section>
      </main>
    </div>
  );
}

function Header({ runningTotal }: { runningTotal: number }) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b border-slate-100 dark:bg-gray-900/60 dark:border-gray-700">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <a href="/" className="font-semibold tracking-tight text-slate-900 dark:text-gray-100">
          Photo Guesser
        </a>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Running total: <span className="font-semibold text-sky-700 dark:text-sky-400">{fmt(runningTotal)}</span>
        </div>
      </div>
    </header>
  );
}

function ScoreBanner({ points, distanceKm }: { points: number; distanceKm: number }) {
  const title =
    points >= 18000 ? "Legendary!" : points >= 12000 ? "Great shot!" : points >= 6000 ? "Nice one!" : "Keep trying!";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-r from-sky-500 to-teal-400 text-white shadow-sm"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-sm/5 opacity-95">🎯 {title}</div>
          <div className="text-3xl md:text-5xl font-semibold tracking-tight mt-1">{fmt(points)} points</div>
          <div className="mt-2 text-white/90 text-sm">{fmt(distanceKm)} km away</div>
        </div>
        <div className="hidden md:block h-[120px] w-px bg-white/25" />
        <div className="flex items-center gap-3">
          <Badge icon={MapPin} label={`${fmt(distanceKm)} km`} sub="distance" />
          <Badge icon={Award} label={`${Math.max(0, Math.round((points / 20000) * 100))}%`} sub="of max" />
        </div>
      </div>
      <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    </motion.div>
  );
}

function Badge({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 text-white shadow-sm ring-1 ring-white/20">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <div>
          <div className="text-sm font-medium leading-none">{label}</div>
          <div className="text-xs opacity-80">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function PhotoCard({ src }: { src: string }) {
  const hasSrc = src && src.length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45 }}
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-gray-800 dark:ring-gray-700"
    >
      {hasSrc ? (
        <img src={src} alt="round photography" className="w-full h-[360px] md:h-[420px] object-cover" />
      ) : (
        <div className="w-full h-[360px] md:h-[420px] grid place-content-center bg-slate-100 text-slate-500 text-sm dark:bg-gray-700 dark:text-gray-400">
          No photo available
        </div>
      )}
    </motion.div>
  );
}

function MapCard({
  userPin,
  correctPin,
  kmError,
}: {
  userPin: { lat: number; lon: number } | null;
  correctPin: { lat: number; lon: number };
  kmError: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4 dark:bg-gray-800 dark:ring-gray-700"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200">
          <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="font-medium">Your guess 🎯 vs actual location 🏁</span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">{fmt(kmError)} km away</span>
      </div>
      <div className="h-[320px] md:h-[360px] rounded-xl overflow-hidden">
        <MapComponent
          userPin={userPin}
          correctPin={correctPin}
          showFeedback={true}
          kmError={kmError}
          onPinPlace={() => {
            // Read-only in feedback
          }}
          onPinMove={() => {
            // Read-only in feedback
          }}
          className="h-full"
        />
      </div>
    </motion.div>
  );
}

function DetailsCard({ result }: { result: PhotoScoreResultDTO }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 dark:bg-gray-800 dark:ring-gray-700"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Photo information</h3>
      <div className="mt-4 space-y-4">
        {/* Event name */}
        <div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-gray-100">{result.event_name}</h4>
          {result.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{result.description}</p>}
        </div>

        {/* Details */}
        <dl className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {result.place && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <dt className="font-medium">Place:</dt>
              <dd className="ml-1 text-gray-700 dark:text-gray-300">{result.place}</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <dt className="font-medium">Distance:</dt>
            <dd className="ml-1">{fmt(result.km_error)} km</dd>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <dt className="font-medium">Points:</dt>
            <dd className="ml-1">{fmt(result.total_score)}</dd>
          </div>
        </dl>

        {/* Attribution */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Photo Attribution</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              <span className="font-medium">Credit:</span> {result.credit}
            </p>
            <p>
              <span className="font-medium">License:</span> {result.license}
            </p>
          </div>
        </div>

        {/*/!* Source URL *!/*/}
        {/*{result.sources*/}
        {/*  .source_url && (*/}
        {/*  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">*/}
        {/*    <a*/}
        {/*      href={result.source_url}*/}
        {/*      target="_blank"*/}
        {/*      rel="noopener noreferrer"*/}
        {/*      className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"*/}
        {/*    >*/}
        {/*      <LinkIcon className="h-4 w-4" />*/}
        {/*      View source*/}
        {/*    </a>*/}
        {/*  </div>*/}
        {/*)}*/}
      </div>
    </motion.div>
  );
}

function ProgressCard({
  progress,
  roundIndex,
  totalRounds,
  runningTotal,
}: {
  progress: number;
  roundIndex: number;
  totalRounds: number;
  runningTotal: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 dark:bg-gray-800 dark:ring-gray-700"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Round progress</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {roundIndex} of {totalRounds} photos
      </p>
      <div className="mt-4 h-3 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-400"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
        Total score: <span className="font-semibold text-sky-700 dark:text-sky-400">{fmt(runningTotal)}</span>
      </div>
    </motion.div>
  );
}

function ActionsCard({ onNext, isLastPhoto }: { onNext: () => void; isLastPhoto: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 flex flex-col dark:bg-gray-800 dark:ring-gray-700"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">What&#39;s next?</h3>
      <div className="mt-4">
        <button
          onClick={onNext}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 text-white text-base font-medium hover:bg-sky-700 transition-colors"
        >
          {isLastPhoto ? (
            <>
              See Final Results
              <Award className="h-5 w-5" />
            </>
          ) : (
            <>
              Next photo
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {isLastPhoto ? "Complete all photos to see your final score!" : "Continue to the next photo when you're ready."}
      </p>
    </motion.div>
  );
}
