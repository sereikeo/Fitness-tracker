import { Link, useParams } from 'react-router-dom';

/*
 * WorkoutSummaryPage
 *
 * Props (all optional — renders stub data when not provided):
 *   session  {object}  - {
 *                          id, name, date, tag,
 *                          durationMin, totalVolumeKg, setsDone, intensityPct,
 *                          loadDistribution: [{ muscle, pct }],
 *                          exercises: [{
 *                            id, name, tag,
 *                            sets: [{ weight, reps }]
 *                          }]
 *                        }
 *
 * Wiring target:
 *   session  <- GET /api/workouts/:id
 *   (useParams pulls :id from the route automatically)
 */

const STUB_SESSION = {
  id: '1',
  name: 'Hypertrophy A Pull',
  date: 'April 9, 2024',
  tag: 'STRENGTH',
  durationMin: 75,
  totalVolumeKg: 14200,
  setsDone: 24,
  intensityPct: 88,
  loadDistribution: [
    { muscle: 'QUADRICEPS', pct: 68 },
    { muscle: 'POSTERIOR',  pct: 20 },
    { muscle: 'CORE',       pct: 10 },
  ],
  exercises: [
    {
      id: '1',
      name: 'Back Squat',
      tag: 'Main Lift',
      sets: [
        { weight: 100, reps: 4 },
        { weight: 100, reps: 4 },
        { weight: 100, reps: 4 },
      ],
    },
    {
      id: '2',
      name: 'Lat Pulldown',
      tag: 'Accessory',
      sets: [
        { weight: 60, reps: 10 },
        { weight: 60, reps: 10 },
        { weight: 60, reps: 10 },
      ],
    },
  ],
};

function StatBlock({ label, value, unit, accent }) {
  return (
    <div className="bg-surface-container p-3">
      <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">
        {label}
      </p>
      <p className="text-xl font-black text-white font-body tracking-tighter">
        {value}
        {unit && (
          <span className={`text-[10px] ml-1 ${accent === 'secondary' ? 'text-secondary' : accent === 'tertiary' ? 'text-tertiary' : 'text-on-surface-variant'}`}>
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function SegmentedBar({ pct, color = 'secondary' }) {
  return (
    <div className="flex gap-0.5 h-1.5">
      {Array.from({ length: 10 }).map((_, i) => {
        const filled = (i + 1) / 10 <= pct / 100;
        return (
          <div
            key={i}
            className={`flex-1 ${filled ? (color === 'tertiary' ? 'bg-tertiary' : 'bg-secondary') : 'bg-surface-container-highest'}`}
          />
        );
      })}
    </div>
  );
}

function ExerciseLogCard({ exercise }) {
  const volume = exercise.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);

  return (
    <div className="bg-surface-container-low mb-3">
      {/* Header */}
      <div className="p-3 border-b border-outline-variant/10 flex justify-between items-start">
        <div>
          <span className="bg-surface-container-highest text-on-surface-variant text-[9px] font-bold px-1.5 py-0.5 uppercase mb-1 inline-block font-headline">
            {exercise.tag}
          </span>
          <h3 className="text-sm font-black text-white uppercase font-headline tracking-tight">
            {exercise.name}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-on-surface-variant uppercase font-headline">Volume</p>
          <p className="text-sm font-bold text-white font-body">
            {volume.toLocaleString()}
            <span className="text-[9px] text-secondary ml-1">KG</span>
          </p>
        </div>
      </div>

      {/* Sets table */}
      <div className="p-3">
        {/* Column headers */}
        <div className="flex gap-3 mb-2">
          <span className="text-[9px] text-on-surface-variant uppercase font-headline w-4">#</span>
          <span className="flex-1 text-[9px] text-on-surface-variant uppercase font-headline text-right">KG</span>
          <span className="flex-1 text-[9px] text-on-surface-variant uppercase font-headline text-right">REPS</span>
          <span className="flex-1 text-[9px] text-on-surface-variant uppercase font-headline text-right">VOL</span>
        </div>
        {exercise.sets.map((set, i) => (
          <div key={i} className="flex gap-3 py-1.5 border-b border-outline-variant/10 last:border-0">
            <span className="text-[10px] text-on-surface-variant font-headline w-4">{i + 1}</span>
            <span className="flex-1 text-xs font-bold text-white font-body text-right">{set.weight}</span>
            <span className="flex-1 text-xs font-bold text-white font-body text-right">{set.reps}</span>
            <span className="flex-1 text-xs text-secondary font-bold font-body text-right">
              {(set.weight * set.reps).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkoutSummaryPage({ session = STUB_SESSION }) {
  return (
    <main
      className="pb-24 px-4 max-w-7xl mx-auto"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}
    >
      {/* Header */}
      <div className="mb-2">
        <p className="text-[10px] text-primary font-bold tracking-tighter mb-1 uppercase font-headline">
          Active Workout
        </p>
        <div className="flex justify-between items-start">
          <div>
            <span className="bg-surface-container-highest text-secondary text-[9px] font-bold px-1.5 py-0.5 uppercase mb-2 inline-block font-headline">
              {session.tag}
            </span>
            <h1 className="text-3xl font-headline font-black tracking-tighter uppercase text-white">
              {session.name}
            </h1>
          </div>
        </div>
        <p className="text-[10px] text-on-surface-variant uppercase font-headline mt-1">
          {session.date} — Completion
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 mt-4">
        <StatBlock label="Duration" value={session.durationMin} unit="MIN" accent="secondary" />
        <StatBlock label="Total Volume" value={session.totalVolumeKg.toLocaleString()} unit="KG" accent="secondary" />
        <StatBlock label="Sets Total" value={session.setsDone} />
      </div>

      {/* Intensity */}
      <div className="bg-surface-container-low p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">
            Intensity
          </p>
          <p className="text-sm font-black text-white font-body">
            {session.intensityPct}
            <span className="text-[9px] text-tertiary ml-0.5">%</span>
          </p>
        </div>
        <SegmentedBar pct={session.intensityPct} color="tertiary" />
      </div>

      {/* Load distribution */}
      <div className="bg-surface-container-low p-4 mb-4">
        <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-4">
          Load Distribution
        </p>
        <div className="flex flex-col gap-4">
          {session.loadDistribution.map(({ muscle, pct }) => (
            <div key={muscle}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-on-surface-variant uppercase font-headline">
                  {muscle}
                </span>
                <span className="text-[10px] font-bold text-white font-body">{pct}%</span>
              </div>
              <SegmentedBar pct={pct} />
            </div>
          ))}
        </div>
      </div>

      {/* Exercise log */}
      <div className="mb-4">
        <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-3">
          Exercise Log
        </p>
        {session.exercises.map((ex) => (
          <ExerciseLogCard key={ex.id} exercise={ex} />
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <Link
          to="/"
          className="bg-primary py-3 flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-primary text-sm">home</span>
          <span className="text-on-primary text-sm font-black tracking-[0.2em] font-headline uppercase">
            Finish
          </span>
        </Link>
        <Link
          to="/workouts"
          className="border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
          <span className="text-on-surface-variant text-sm font-black tracking-[0.2em] font-headline uppercase">
            Cancel
          </span>
        </Link>
      </div>
    </main>
  );
}