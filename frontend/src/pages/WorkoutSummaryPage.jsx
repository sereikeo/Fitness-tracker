import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSessionDetail } from '../hooks/useSessions';

const STUB_SESSION = {
  id: '1',
  date: 'Apr 9, 2026',
  tag: 'STRENGTH',
  totalVolumeKg: 14200,
  setsDone: 24,
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
      <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">{label}</p>
      <p className="text-xl font-black text-white font-body tracking-tighter">
        {value}
        {unit && (
          <span className={`text-[10px] ml-1 ${accent === 'secondary' ? 'text-secondary' : 'text-on-surface-variant'}`}>
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function SegmentedBar({ pct }) {
  return (
    <div className="flex gap-0.5 h-1.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 ${(i + 1) / 10 <= pct / 100 ? 'bg-secondary' : 'bg-surface-container-highest'}`}
        />
      ))}
    </div>
  );
}

function ExerciseLogCard({ exercise }) {
  const volume = exercise.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
  return (
    <div className="bg-surface-container-low mb-3">
      <div className="p-3 border-b border-outline-variant/10 flex justify-between items-start">
        <div>
          <span className="bg-surface-container-highest text-on-surface-variant text-[9px] font-bold px-1.5 py-0.5 uppercase mb-1 inline-block font-headline">
            {exercise.tag}
          </span>
          <h3 className="text-sm font-black text-white uppercase font-headline tracking-tight">{exercise.name}</h3>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-on-surface-variant uppercase font-headline">Volume</p>
          <p className="text-sm font-bold text-white font-body">
            {volume.toLocaleString()}<span className="text-[9px] text-secondary ml-1">KG</span>
          </p>
        </div>
      </div>
      <div className="p-3">
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

export default function WorkoutSummaryPage({ session: sessionProp }) {
  const { id } = useParams();
  const [session, setSession] = useState(sessionProp || STUB_SESSION);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      fetchSessionDetail(id)
        .then(setSession)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <main className="pb-24 px-4 max-w-7xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
        <p className="text-on-surface-variant text-sm font-body">Loading summary...</p>
      </main>
    );
  }

  return (
    <main className="pb-24 px-4 max-w-7xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
      <div className="mb-2">
        <p className="text-[10px] text-[#0e639c] font-bold tracking-tighter mb-1 uppercase font-headline">Session Complete</p>
        <div className="flex justify-between items-start">
          <div>
            <span className="bg-surface-container-highest text-secondary text-[9px] font-bold px-1.5 py-0.5 uppercase mb-2 inline-block font-headline">
              {session.tag}
            </span>
            <h1 className="text-3xl font-headline font-black tracking-tighter uppercase text-white">
              {session.date}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 mt-4">
        <StatBlock label="Total Volume" value={session.totalVolumeKg.toLocaleString()} unit="KG" accent="secondary" />
        <StatBlock label="Sets Total" value={session.setsDone} />
      </div>

      <div className="bg-surface-container-low p-4 mb-4">
        <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-4">Load Distribution</p>
        <div className="flex flex-col gap-4">
          {session.loadDistribution.map(({ muscle, pct }) => (
            <div key={muscle}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-on-surface-variant uppercase font-headline">{muscle}</span>
                <span className="text-[10px] font-bold text-white font-body">{pct}%</span>
              </div>
              <SegmentedBar pct={pct} />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-3">Exercise Log</p>
        {session.exercises.map((ex) => (
          <ExerciseLogCard key={ex.id} exercise={ex} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <Link
          to="/"
          className="bg-emerald-600 py-3 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
        >
          <span className="material-symbols-outlined text-white text-sm">home</span>
          <span className="text-white text-sm font-black tracking-[0.2em] font-headline uppercase">Home</span>
        </Link>
        <Link
          to="/workouts"
          className="border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-sm">fitness_center</span>
          <span className="text-on-surface-variant text-sm font-black tracking-[0.2em] font-headline uppercase">Workouts</span>
        </Link>
      </div>
    </main>
  );
}