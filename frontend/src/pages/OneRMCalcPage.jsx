import { useState } from 'react';

/*
 * OneRMCalcPage
 *
 * Pure frontend — no API calls required.
 *
 * Formulae (all produce estimated 1RM from weight lifted x reps):
 *   Epley:    weight * (1 + reps / 30)
 *   Brzycki:  weight * (36 / (37 - reps))
 *   Lombardi: weight * reps ^ 0.1
 *
 * Intensity ratios displayed:
 *   95% — Threshold
 *   80% — Working Zone
 *   50% — Recovery Pace
 */

const INTENSITY_LEVELS = [
  { label: '95%', pct: 0.95, description: 'THRESHOLD' },
  { label: '80%', pct: 0.80, description: 'WORKING ZONE' },
  { label: '50%', pct: 0.50, description: 'RECOVERY PACE' },
];

function epley(weight, reps) {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function calc1RM(weight, reps) {
  return epley(weight, reps);
}

export default function OneRMCalcPage() {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  const valid = !isNaN(w) && !isNaN(r) && w > 0 && r > 0 && r <= 30;
  const oneRM = valid ? calc1RM(w, r) : null;

  return (
    <main
      className="pb-24 px-4 max-w-7xl mx-auto"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white">
          1RM CALC
        </h1>
      </div>

      {/* Input block */}
      <div className="bg-surface-container-low p-4 mb-4">
        <p className="text-[10px] text-primary font-bold tracking-tighter mb-4 uppercase font-headline">
          Input Function
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Weight input */}
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold mb-2 font-headline">
              Load Mass (KG)
            </p>
            <div className="bg-surface-container border-b-2 border-outline p-3 focus-within:border-primary transition-colors">
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-transparent text-white text-xl font-bold font-body outline-none placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          {/* Reps input */}
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold mb-2 font-headline">
              Repetition Count
            </p>
            <div className="bg-surface-container border-b-2 border-outline p-3 focus-within:border-primary transition-colors">
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-transparent text-white text-xl font-bold font-body outline-none placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => {}}
          className="w-full bg-emerald-600 py-3 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
        >
          <span className="text-white text-sm font-black tracking-[0.2em] font-headline uppercase">
            Execute Calculation
          </span>
          <span className="material-symbols-outlined text-white text-sm">
            calculate
          </span>
        </button>
      </div>

      {/* Result block — only shown when valid input */}
      {oneRM !== null && (
        <>
          {/* 1RM result */}
          <div className="bg-surface-container-low p-4 mb-4">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-1">
              Return Value
            </p>
            <p className="text-[10px] text-primary font-bold uppercase font-headline mb-3">
              Estimated Max Repetition
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black font-headline text-white tracking-tighter">
                {oneRM.toFixed(1)}
              </span>
              <span className="text-secondary text-xl font-bold font-body">KG</span>
            </div>
          </div>

          {/* Intensity ratios */}
          <div className="bg-surface-container-low p-4">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-4">
              Predicted Intensity Ratios
            </p>

            <div className="flex flex-col gap-0">
              {INTENSITY_LEVELS.map(({ label, pct, description }, i) => {
                const value = oneRM * pct;
                const barWidth = pct * 100;
                return (
                  <div key={label} className="mb-4">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase font-headline">
                          {label}
                        </span>
                        <span className="text-[9px] text-on-surface-variant/60 uppercase font-headline">
                          {description}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-white font-body">
                        {value.toFixed(1)} KG
                      </span>
                    </div>
                    {/* Segmented progress bar */}
                    <div className="flex gap-0.5 h-1.5">
                      {Array.from({ length: 10 }).map((_, segIdx) => {
                        const segThreshold = (segIdx + 1) / 10;
                        const filled = segThreshold <= barWidth / 100;
                        return (
                          <div
                            key={segIdx}
                            className={`flex-1 ${filled ? 'bg-secondary' : 'bg-surface-container-highest'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formula note */}
            <p className="text-[9px] text-on-surface-variant/40 uppercase font-headline mt-4 leading-relaxed">
              Formula: Epley — weight * (1 + reps / 30). Results are estimates.
              Always calibrate against actual performance data.
            </p>
          </div>
        </>
      )}

      {/* Empty state */}
      {oneRM === null && (
        <div className="bg-surface-container-low p-4">
          <p className="text-[10px] text-on-surface-variant/40 uppercase font-headline">
            Enter load and reps to compute estimated max.
          </p>
        </div>
      )}
    </main>
  );
}