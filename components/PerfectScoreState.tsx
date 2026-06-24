export default function PerfectScoreState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-sm mx-auto glass-card rounded-2xl relative overflow-hidden shadow-xl border border-emerald-500/20">
      {/* Glow background */}
      <div className="absolute inset-0 bg-emerald-500/5 blur-2xl pointer-events-none" />
      
      <div aria-hidden="true" className="relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-bounce">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-1">Perfect Audit</h3>
      <p className="text-sm text-zinc-400">
        Your meta tags are solid.
      </p>
    </div>
  );
}

