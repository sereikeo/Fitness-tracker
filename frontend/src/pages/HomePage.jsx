import { Link } from 'react-router-dom';

/**
 * HomePage
 *
 * Props (all optional — component renders stub/placeholder data when not provided):
 *   nextWorkout  {object|null}  - { name, time, date, durationMin }
 *                                 null = no workout scheduled today
 *   recentLogs   {array}        - [{ id, tag, name, date, durationMin, totalVolumeKg, avgHrBpm, exercises }]
 *   weekActivity {array}        - 7 items [{ day: 'M', value: 0–100 }], index 6 = today (Sunday)
 *
 * Wiring target:
 *   nextWorkout  <- GET /api/schedule/today
 *   recentLogs   <- GET /api/workouts?limit=3
 *   weekActivity <- GET /api/workouts/week-summary
 */

// ---------------------------------------------------------------------------
// Stub data — replaced by API props once Aider wires the endpoints
// ---------------------------------------------------------------------------
const STUB_NEXT_WORKOUT = {
  name: 'Upper Body Power',
  time: '17:30',
  date: 'OCT 24',
  durationMin: 60,
};

const STUB_RECENT_LOGS = [
  {
    id: '1',
    tag: 'STRENGTH',
    tagColor: 'secondary',
    name: 'Leg Day',
    date: 'April 9, 2024',
    durationMin: 75,
    totalVolumeKg: 14200,
    avgHrBpm: 142,
    exercises: 'Squat, Lunges, Calf Raises...',
  },
];

const STUB_WEEK_ACTIVITY = [
  { day: 'M', value: 40 },
  { day: 'T', value: 65 },
  { day: 'W', value: 35 },
  { day: 'T', value: 85 },
  { day: 'F', value: 45 },
  { day: 'S', value: 55 },
  { day: 'S', value: 95 }, // today
];

// ---------------------------------------------------------------------------
// Sub-components
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
            <p className="text-[9px] text-on-surface-variant uppercase font-bold mb-1 font-headline">
              Time
            </p>
            <p className="text-lg font-bold text-white tracking-tight font-body">
              {workout.time}{' '}
              <span className="text-lg text-secondary ml-1">{workout.date}</span>
            </p>
          </div>
          <div className="bg-surface-container p-3 border-l-2 border-tertiary">
            <p className="text-[9px] text-on-surface-variant uppercase font-bold mb-1 font-headline">
              Duration
            </p>
            <p className="text-lg font-bold text-white tracking-tight font-body">
              {workout.durationMin}{' '}
              <span className="text-[10px] text-tertiary">MIN</span>
            </p>
          </div>
        </div>

        <Link
          to="/workouts/active"
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
    <div className="bg-surface-container-low">
      <div className="p-4 border-b border-outline-variant/10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="bg-secondary/10 text-secondary text-[9px] font-bold px-1.5 py-0.5 uppercase mb-2 inline-block font-headline">
              {log.tag}
            </span>
            <h3 className="text-lg font-bold leading-tight font-headline text-white">
              {log.name}
            </h3>
          </div>
          <span className="text-[10px] text-on-surface-variant font-headline uppercase">
            {log.date}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">
              Duration
            </p>
            <p className="text-xs font-bold text-white tracking-tighter font-body">
              {log.durationMin} MIN
            </p>
          </div>
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">
              Total Volume
            </p>
            <p className="text-xs font-bold text-white tracking-tighter font-body">
              {log.totalVolumeKg.toLocaleString()} KG
            </p>
          </div>
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">
              Avg HR
            </p>
            <p className="text-xs font-bold text-white tracking-tighter font-body">
              {log.avgHrBpm} BPM
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
  const today = data.length - 1;

  return (
    <div className="bg-surface-container p-4">
      <p className="text-[10px] text-on-surface-variant font-bold mb-4 uppercase font-headline">
        Weekly activity
      </p>
      <div className="flex items-end justify-between h-32 gap-1 px-2">
        {data.map((item, i) => {
          const isToday = i === today;
          const heightPct = `${item.value}%`;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
              {isToday && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary font-headline whitespace-nowrap">
                  TODAY
                </div>
              )}
              <div
                className={`w-full ${isToday ? 'bg-primary border-t-2 border-primary' : 'bg-primary/20'}`}
                style={{ height: heightPct }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 px-2">
        {data.map((item, i) => (
          <span
            key={i}
            className={`text-[8px] font-medium font-body ${
              i === today ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            {item.day}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page tabs
// ---------------------------------------------------------------------------
const TABS = ['DASHBOARD', 'ACTIVITIES', 'PROGRESS'];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function HomePage({
  nextWorkout = STUB_NEXT_WORKOUT,
  recentLogs = STUB_RECENT_LOGS,
  weekActivity = STUB_WEEK_ACTIVITY,
  activeTab = 'DASHBOARD',
  onTabChange,
}) {
  return (
    <main className="pb-24 px-4 max-w-7xl mx-auto" style={{ paddingTop: `calc(env(safe-area-inset-top) + 3rem)` }}>
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
            onClick={() => onTabChange?.(tab)}
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

      {/* Dashboard tab content */}
      {activeTab === 'DASHBOARD' && (
        <>
          <NextWorkoutBanner workout={nextWorkout} />

          {/* Previous Workouts */}
          <section className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold tracking-widest uppercase font-headline">
                Previous workouts
              </h2>
              <Link
                to="/workouts"
                className="text-[10px] text-primary cursor-pointer hover:underline uppercase font-bold font-headline"
              >
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              {recentLogs.map((log) => (
                <WorkoutLogCard key={log.id} log={log} />
              ))}
            </div>
          </section>

          {/* Weekly Activity */}
          <section className="mt-8 mb-10">
            <WeeklyActivityChart data={weekActivity} />
          </section>
        </>
      )}

      {/* Placeholder tabs — filled in later */}
      {activeTab === 'ACTIVITIES' && (
        <p className="text-on-surface-variant text-sm font-body">Activities — coming soon.</p>
      )}
      {activeTab === 'PROGRESS' && (
        <p className="text-on-surface-variant text-sm font-body">Progress — coming soon.</p>
      )}
    </main>
  );
}
