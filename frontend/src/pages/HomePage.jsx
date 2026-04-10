import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSessions } from '../hooks/useSessions';

/*
 * HomePage
 *
 * All data is self-fetched. No props required.
 *
 * Endpoints:
 *   nextWorkout  <- GET /api/schedule/today (returns null if nothing scheduled)
 *   recentLogs   <- GET /api/sessions (first 3)
 *   activityLogs <- GET /api/sessions (all)
 *   weekActivity <- GET /api/workouts/week-summary
 *   progressData <- GET /api/workouts/progress
 */

// ---------------------------------------------------------------------------
// Stub data (shown while loading or on fetch error)
// ---------------------------------------------------------------------------

const STUB_WEEK_ACTIVITY = [
  { day: 'M', value: 0 },
  { day: 'T', value: 0 },
  { day: 'W', value: 0 },
  { day: 'T', value: 0 },
  { day: 'F', value: 0 },
  { day: 'S', value: 0 },
  { day: 'S', value: 0 },
];

const STUB_PROGRESS = {
  totalVolume: 0,
  volumeByWeek: [],
  prs: [],
};

const TABS = ['DASHBOARD', 'ACTIVITIES', 'PROGRESS'];

// ---------------------------------------------------------------------------
// Shape helpers
// ---------------------------------------------------------------------------

/**
 * Maps a /api/sessions item to the shape WorkoutLogCard expects.
 * API shape: { date, day, exercise_count, total_volume_kg, muscle_groups }
 * Card shape: { id, tag, name, date, durationMin, totalVolumeKg, avgHrBpm, exercises }
 */
function sessionToLog(session) {
  return {
    id: session.date,
    tag: 'STRENGTH',
    name: session.muscle_groups?.length > 0
      ? session.muscle_groups.join(' / ')
      : session.day || 'Workout',
    date: new Date(session.date + 'T00:00:00').toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short',
    }),
    durationMin: null,
    totalVolumeKg: session.total_volume_kg ?? 0,
    avgHrBpm: null,
    exercises: `${session.exercise_count} exercise${session.exercise_count !== 1 ? 's' : ''}`,
  };
}

/**
 * Maps /api/workouts/progress response to progressData shape.
 * API: { total_volume, volume_by_week: [{ week, value }], prs: [{ name, value, date }] }
 */
function mapProgress(raw) {
  return {
    totalVolume: raw.total_volume ?? 0,
    volumeByWeek: raw.volume_by_week ?? [],
    prs: raw.prs ?? [],
  };
}

// ---------------------------------------------------------------------------
// Dashboard tab components
// ---------------------------------------------------------------------------

function NextWorkoutBanner({ workout }) {
  if (!workout) {
    return (
      <section>
        <div className="bg-surface-container-low p-4">
          <p className="text-[10px] text-primary font-bold tracking-tighter mb-1 uppercase font-headline">
            Next workout
          </p>
          <p className="text-on-surface-variant text-sm font-body">
            No workout scheduled for today.
          </p>
        </div>
      </section>
    );
  }
  return (
    <section>
      <div className="bg-surface-container-low p-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] text-primary font-bold tracking-tighter mb-1 uppercase font-headline">
              Next workout
            </p>
            <h3 className="text-2xl font-black text-white tracking-tight font-headline uppercase">
              {workout.name}
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-container p-3 border-l-2 border-secondary">
            <p className="text-[9px] text-on-surface-variant uppercase font-bold mb-1 font-headline">Day</p>
            <p className="text-lg font-bold text-white tracking-tight font-body">
              {workout.day}
            </p>
          </div>
          <div className="bg-surface-container p-3 border-l-2 border-tertiary">
            <p className="text-[9px] text-on-surface-variant uppercase font-bold mb-1 font-headline">Program</p>
            <p className="text-lg font-bold text-white tracking-tight font-body">
              {workout.program ?? '—'}
            </p>
          </div>
        </div>
        <Link
          to="/workouts"
          className="w-full bg-primary py-3 flex items-center justify-center gap-2 hover:bg-primary-container transition-colors group"
        >
          <span className="text-on-primary text-sm font-black tracking-[0.2em] font-headline uppercase">
            Start Workout
          </span>
          <span className="material-symbols-outlined text-on-primary text-sm transition-transform group-active:translate-x-1">
            play_arrow
          </span>
        </Link>
      </div>
    </section>
  );
}

function WorkoutLogCard({ log }) {
  return (
    <div className="bg-surface-container-low mb-4">
      <div className="p-4 border-b border-outline-variant/10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="bg-secondary/10 text-secondary text-[9px] font-bold px-1.5 py-0.5 uppercase mb-2 inline-block font-headline">
              {log.tag}
            </span>
            <h3 className="text-lg font-bold leading-tight font-headline text-white">{log.name}</h3>
          </div>
          <span className="text-[10px] text-on-surface-variant font-headline uppercase">{log.date}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">Duration</p>
            <p className="text-xs font-bold text-white tracking-tighter font-body">
              {log.durationMin != null ? `${log.durationMin} MIN` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">Total Volume</p>
            <p className="text-xs font-bold text-white tracking-tighter font-body">
              {log.totalVolumeKg > 0 ? `${log.totalVolumeKg.toLocaleString()} KG` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">Avg HR</p>
            <p className="text-xs font-bold text-white tracking-tighter font-body">
              {log.avgHrBpm != null ? `${log.avgHrBpm} BPM` : '—'}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-surface-container-lowest p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">fitness_center</span>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-on-surface-variant font-bold leading-none mb-1 uppercase font-headline">
              Exercises
            </p>
            <p className="text-xs text-white/80 font-medium font-body">{log.exercises}</p>
          </div>
          <Link
            to={`/workouts/${log.id}`}
            className="w-8 h-8 border border-outline-variant/30 flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function WeeklyActivityChart({ data }) {
  const todayIndex = (new Date().getDay() + 6) % 7; // JS: 0=Sun, convert to 0=Mon
  return (
    <div className="bg-surface-container p-4">
      <p className="text-[10px] text-on-surface-variant font-bold mb-4 uppercase font-headline">
        Weekly activity
      </p>
      <div className="flex items-end justify-between h-32 gap-1 px-2">
        {data.map((item, i) => {
          const isToday = i === todayIndex;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
              {isToday && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary font-headline whitespace-nowrap">
                  TODAY
                </div>
              )}
              <div
                className={`w-full ${isToday ? 'bg-primary border-t-2 border-primary' : 'bg-primary/20'}`}
                style={{ height: `${Math.max(item.value, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 px-2">
        {data.map((item, i) => (
          <span
            key={i}
            className={`text-[8px] font-medium font-body ${i === todayIndex ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
          >
            {item.day}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activities tab
// ---------------------------------------------------------------------------

function ActivitiesTab({ logs }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase font-headline">All Activities</h2>
        <span className="text-[10px] text-on-surface-variant uppercase font-headline">
          {logs.length} sessions
        </span>
      </div>
      {logs.length === 0 && (
        <p className="text-on-surface-variant text-sm font-body">No sessions logged yet.</p>
      )}
      {logs.map((log) => (
        <div key={log.id} className="bg-surface-container-low p-4 mb-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="bg-secondary/10 text-secondary text-[9px] font-bold px-1.5 py-0.5 uppercase mb-2 inline-block font-headline">
                {log.tag}
              </span>
              <h3 className="text-base font-bold text-white font-headline uppercase tracking-tight">
                {log.name}
              </h3>
            </div>
            <span className="text-[10px] text-on-surface-variant font-headline uppercase">{log.date}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">Duration</p>
              <p className="text-xs font-bold text-white font-body">
                {log.durationMin != null ? `${log.durationMin} MIN` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">Volume</p>
              <p className="text-xs font-bold text-white font-body">
                {log.totalVolumeKg > 0 ? `${log.totalVolumeKg.toLocaleString()} KG` : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-on-surface-variant font-body">{log.exercises}</p>
            <Link
              to={`/workouts/${log.id}`}
              className="w-8 h-8 border border-outline-variant/30 flex items-center justify-center hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-on-surface-variant">chevron_right</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress tab
// ---------------------------------------------------------------------------

function ProgressTab({ data }) {
  if (!data.volumeByWeek || data.volumeByWeek.length === 0) {
    return (
      <div>
        <div className="bg-surface-container-low p-4 mb-4">
          <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">
            Total Volume
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white font-headline tracking-tighter">0</span>
            <span className="text-secondary text-lg font-bold font-body">KG</span>
          </div>
        </div>
        <p className="text-on-surface-variant text-sm font-body">No workout data yet.</p>
      </div>
    );
  }

  const maxVolume = Math.max(...data.volumeByWeek.map((w) => w.value), 1);

  return (
    <div>
      {/* Total volume stat */}
      <div className="bg-surface-container-low p-4 mb-4">
        <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">
          Total Volume
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white font-headline tracking-tighter">
            {(data.totalVolume / 1000).toFixed(1)}
          </span>
          <span className="text-secondary text-lg font-bold font-body">T</span>
          <span className="text-[10px] text-on-surface-variant uppercase font-headline ml-1">
            all time
          </span>
        </div>
      </div>

      {/* Volume over time chart */}
      <div className="bg-surface-container p-4 mb-4">
        <p className="text-[10px] text-on-surface-variant font-bold mb-4 uppercase font-headline">
          Volume Over Time
        </p>
        <div className="flex items-end gap-1 h-24 px-1">
          {data.volumeByWeek.map((w, i) => {
            const isLast = i === data.volumeByWeek.length - 1;
            const heightPct = (w.value / maxVolume) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <div
                  className={`w-full ${isLast ? 'bg-secondary' : 'bg-primary/30'}`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-1">
          {data.volumeByWeek.map((w, i) => (
            <span key={i} className="text-[8px] text-on-surface-variant font-body">
              {w.week.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Personal records */}
      {data.prs.length > 0 && (
        <div className="bg-surface-container-low p-4">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-3">
            Personal Records
          </p>
          {data.prs.map((pr) => (
            <div key={pr.name} className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
              <div>
                <p className="text-sm font-bold text-white font-headline uppercase tracking-tight">
                  {pr.name}
                </p>
                <p className="text-[9px] text-on-surface-variant uppercase font-headline mt-0.5">
                  {pr.date}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-secondary font-body tracking-tighter">
                  {pr.value}
                  <span className="text-[10px] text-on-surface-variant ml-1">KG</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [nextWorkout, setNextWorkout] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [weekActivity, setWeekActivity] = useState(STUB_WEEK_ACTIVITY);
  const [progressData, setProgressData] = useState(STUB_PROGRESS);

  useEffect(() => {
    // Sessions — drives recentLogs and activityLogs
    fetchSessions()
      .then((sessions) => {
        const logs = sessions.map(sessionToLog);
        setRecentLogs(logs.slice(0, 3));
        setActivityLogs(logs);
      })
      .catch(() => {});

    // Week summary
    fetch('/api/workouts/week-summary')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length === 7) setWeekActivity(data);
      })
      .catch(() => {});

    // Progress
    fetch('/api/workouts/progress')
      .then((r) => r.json())
      .then((data) => setProgressData(mapProgress(data)))
      .catch(() => {});

// Today's schedule
fetch('/api/schedule/today')
  .then((r) => r.json())
  .then((data) => {
    if (!data || !data.routine_id) return;
    fetch('/api/programs')
      .then((r) => r.json())
      .then((programs) => {
        const program = programs.find((p) => p.id === data.routine_id);
        const programName = program?.name ?? 'Scheduled Workout';
        setNextWorkout({
          name: programName,
          day: new Date(data.scheduled_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long' }),
          program: programName,
        });
      });
  })
  .catch(() => {});
  }, []);

  return (
    <main
      className="pb-24 px-4 max-w-7xl mx-auto"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white">
          HOME
        </h1>
      </div>

      {/* Sub-nav tabs */}
      <div className="flex border-b border-outline-variant/20 mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-sm font-bold tracking-widest uppercase font-headline px-4 relative transition-colors ${
              activeTab === tab
                ? 'text-white border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === 'DASHBOARD' && (
        <>
          <NextWorkoutBanner workout={nextWorkout} />
          <section className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold tracking-widest uppercase font-headline">
                Previous workouts
              </h2>
              <button
                onClick={() => setActiveTab('ACTIVITIES')}
                className="text-[10px] text-primary cursor-pointer hover:underline uppercase font-bold font-headline"
              >
                View all
              </button>
            </div>
            <div className="flex flex-col">
              {recentLogs.length === 0 && (
                <p className="text-on-surface-variant text-sm font-body">No sessions logged yet.</p>
              )}
              {recentLogs.map((log) => (
                <WorkoutLogCard key={log.id} log={log} />
              ))}
            </div>
          </section>
          <section className="mt-8 mb-10">
            <WeeklyActivityChart data={weekActivity} />
          </section>
        </>
      )}

      {/* Activities */}
      {activeTab === 'ACTIVITIES' && (
        <ActivitiesTab logs={activityLogs} />
      )}

      {/* Progress */}
      {activeTab === 'PROGRESS' && (
        <ProgressTab data={progressData} />
      )}
    </main>
  );
}
