import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSessions } from '../hooks/useSessions';

/*
 * HomePage
 *
 * Props (all optional — renders stub data when not provided):
 *   nextWorkout  {object|null}  - { name, time, date, durationMin }
 *   recentLogs   {array}        - [{ id, tag, name, date, durationMin, totalVolumeKg, avgHrBpm, exercises }]
 *   weekActivity {array}        - 7 items [{ day: 'M', value: 0-100 }], index 6 = today
 *   activityLogs {array}        - [{ id, tag, name, date, durationMin, totalVolumeKg, exercises }]
 *   progressData {object}       - { totalVolume, volumeByWeek: [{ week, value }], prs: [{ name, value, date }] }
 *
 * Wiring targets:
 *   nextWorkout  <- GET /api/schedule/today
 *   recentLogs   <- GET /api/workouts?limit=3
 *   weekActivity <- GET /api/workouts/week-summary
 *   activityLogs <- GET /api/workouts?limit=20
 *   progressData <- GET /api/workouts/progress
 */

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
    name: 'Leg Day',
    date: 'April 9, 2024',
    durationMin: 75,
    totalVolumeKg: 14200,
    avgHrBpm: 142,
    exercises: 'Squat, Lunges, Calf Raises...',
  },
  {
    id: '2',
    tag: 'CARDIO',
    name: 'Morning Run',
    date: 'April 8, 2024',
    durationMin: 45,
    totalVolumeKg: 0,
    avgHrBpm: 158,
    exercises: '8km steady state',
  },
];

const STUB_WEEK_ACTIVITY = [
  { day: 'M', value: 40 },
  { day: 'T', value: 65 },
  { day: 'W', value: 35 },
  { day: 'T', value: 85 },
  { day: 'F', value: 45 },
  { day: 'S', value: 55 },
  { day: 'S', value: 95 },
];

const STUB_ACTIVITY_LOGS = [
  {
    id: '1', tag: 'STRENGTH', name: 'Leg Day',
    date: 'Apr 9', durationMin: 75, totalVolumeKg: 14200,
    exercises: 'Squat, Lunges, Calf Raises...',
  },
  {
    id: '2', tag: 'CARDIO', name: 'Morning Run',
    date: 'Apr 8', durationMin: 45, totalVolumeKg: 0,
    exercises: '8km steady state',
  },
  {
    id: '3', tag: 'STRENGTH', name: 'Upper Body Power',
    date: 'Apr 7', durationMin: 60, totalVolumeKg: 12400,
    exercises: 'Bench Press, OHP, Rows...',
  },
  {
    id: '4', tag: 'STRENGTH', name: 'Pull Day',
    date: 'Apr 5', durationMin: 55, totalVolumeKg: 11800,
    exercises: 'Deadlift, Pull Ups, Rows...',
  },
];

const STUB_PROGRESS = {
  totalVolume: 42850,
  volumeByWeek: [
    { week: 'Jan 15', value: 28000 },
    { week: 'Jan 22', value: 31000 },
    { week: 'Jan 29', value: 29500 },
    { week: 'Feb 5',  value: 35000 },
    { week: 'Feb 12', value: 38000 },
    { week: 'Feb 19', value: 42850 },
  ],
  prs: [
    { name: 'Squat',         value: 185.0, date: 'Mar 12' },
    { name: 'Bench Press',   value: 122.5, date: 'Feb 28' },
    { name: 'Deadlift',      value: 210.0, date: 'Mar 19' },
    { name: 'Overhead Press',value: 82.5,  date: 'Feb 14' },
  ],
};

const TABS = ['DASHBOARD', 'ACTIVITIES', 'PROGRESS'];

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
            <p className="text-[9px] text-on-surface-variant uppercase font-bold mb-1 font-headline">Time</p>
            <p className="text-lg font-bold text-white tracking-tight font-body">
              {workout.time}{' '}
              <span className="text-lg text-secondary ml-1">{workout.date}</span>
            </p>
          </div>
          <div className="bg-surface-container p-3 border-l-2 border-tertiary">
            <p className="text-[9px] text-on-surface-variant uppercase font-bold mb-1 font-headline">Duration</p>
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
            <p className="text-xs font-bold text-white tracking-tighter font-body">{log.durationMin} MIN</p>
          </div>
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">Total Volume</p>
            <p className="text-xs font-bold text-white tracking-tighter font-body">
              {log.totalVolumeKg > 0 ? `${log.totalVolumeKg.toLocaleString()} KG` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">Avg HR</p>
            <p className="text-xs font-bold text-white tracking-tighter font-body">{log.avgHrBpm} BPM</p>
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
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
              {isToday && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary font-headline whitespace-nowrap">
                  TODAY
                </div>
              )}
              <div
                className={`w-full ${isToday ? 'bg-primary border-t-2 border-primary' : 'bg-primary/20'}`}
                style={{ height: `${item.value}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 px-2">
        {data.map((item, i) => (
          <span
            key={i}
            className={`text-[8px] font-medium font-body ${i === today ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
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
              <p className="text-xs font-bold text-white font-body">{log.durationMin} MIN</p>
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
  const maxVolume = Math.max(...data.volumeByWeek.map((w) => w.value));

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
                  style={{ height: `${heightPct}%` }}
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
      <div className="bg-surface-container-low p-4">
        <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-3">
          Recent Personal Records
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HomePage({
  nextWorkout = STUB_NEXT_WORKOUT,
  weekActivity = STUB_WEEK_ACTIVITY,
  progressData = STUB_PROGRESS,
}) {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [recentLogs, setRecentLogs] = useState(STUB_RECENT_LOGS);
  const [activityLogs, setActivityLogs] = useState(STUB_ACTIVITY_LOGS);

  useEffect(() => {
    fetchSessions(20)
      .then((sessions) => {
        setRecentLogs(sessions.slice(0, 3));
        setActivityLogs(sessions);
      })
      .catch(() => {
        // silently fall back to stub data on error
      });
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