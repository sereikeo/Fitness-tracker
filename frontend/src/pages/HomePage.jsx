import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchSessions } from '../hooks/useSessions';

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
  volumeByMonth: [],
  prs: [],
};

const TABS = ['DASHBOARD', 'ACTIVITIES', 'PROGRESS'];
const RANGE_OPTIONS = ['all', '3months', '1month'];
const RANGE_LABELS = { '1month': '1 Month', '3months': '3 Months', 'all': 'All Time' };

function mapProgress(raw) {
  return {
    totalVolume: raw.total_volume ?? 0,
    volumeByWeek: raw.volume_by_week ?? [],
    volumeByMonth: raw.volume_by_month ?? [],
    prs: raw.prs ?? [],
  };
}

function useSwipeToDelete(onDelete) {
  const ref = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const THRESHOLD = 80;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onTouchStart(e) {
      startX.current = e.touches[0].clientX;
      currentX.current = 0;
      el.style.transition = 'none';
    }
    function onTouchMove(e) {
      const delta = e.touches[0].clientX - startX.current;
      if (delta > 0) return;
      currentX.current = delta;
      el.style.transform = `translateX(${Math.max(delta, -100)}px)`;
    }
    function onTouchEnd() {
      if (currentX.current < -THRESHOLD) {
        el.style.transition = 'transform 0.2s ease';
        el.style.transform = 'translateX(-100%)';
        setTimeout(() => onDelete(), 200);
      } else {
        el.style.transition = 'transform 0.2s ease';
        el.style.transform = 'translateX(0)';
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onDelete]);

  return ref;
}

// ---------------------------------------------------------------------------
// Dashboard tab components
// ---------------------------------------------------------------------------

function NextWorkoutBanner({ workout, todaySessionId }) {
  if (!workout) {
    return (
      <section>
        <div className="bg-surface-container-low p-4">
          <p className="text-[10px] text-[#0e639c] font-bold tracking-tighter mb-1 uppercase font-headline">
            Next workout
          </p>
          <p className="text-on-surface-variant text-sm font-body">
            No workout scheduled for today.
          </p>
        </div>
      </section>
    );
  }

  if (workout.status === 'Completed') {
    return (
      <section>
        <Link to={todaySessionId ? `/workouts/${todaySessionId}` : '/workouts'} className="block bg-surface-container-low p-4">
          <p className="text-[10px] text-[#0e639c] font-bold tracking-tighter mb-1 uppercase font-headline">
            Today's workout
          </p>
          <h3 className="text-2xl font-black text-white tracking-tight font-headline uppercase mb-3">
            {workout.name}
          </h3>
          <div className="flex items-center justify-between bg-secondary/10 p-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
              <span className="text-secondary text-sm font-black tracking-[0.15em] font-headline uppercase">
                Completed
              </span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
          </div>
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="bg-surface-container-low p-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] text-[#0e639c] font-bold tracking-tighter mb-1 uppercase font-headline">
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
            <p className="text-lg font-bold text-white tracking-tight font-body">{workout.day}</p>
          </div>
          <div className="bg-surface-container p-3 border-l-2 border-tertiary">
            <p className="text-[9px] text-on-surface-variant uppercase font-bold mb-1 font-headline">Program</p>
            <p className="text-lg font-bold text-white tracking-tight font-body">{workout.program ?? '—'}</p>
          </div>
        </div>
        <Link
          to="/workouts"
          className="w-full bg-emerald-600 py-3 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors group"
        >
          <span className="text-white text-sm font-black tracking-[0.2em] font-headline uppercase">
            Start Workout
          </span>
          <span className="material-symbols-outlined text-white text-sm transition-transform group-active:translate-x-1">
            play_arrow
          </span>
        </Link>
      </div>
    </section>
  );
}

function WorkoutLogCard({ log }) {
  return (
    <Link to={`/workouts/${log.id}`} className="block mb-4">
      <div className="bg-surface-container-low">
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
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">Total Volume</p>
            <p className="text-xs font-bold text-white tracking-tighter font-body">
              {log.totalVolumeKg > 0 ? `${log.totalVolumeKg.toLocaleString()} KG` : '—'}
            </p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0e639c]">fitness_center</span>
            </div>
            <p className="text-xs text-white/80 font-medium font-body">{log.exercises}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function WeeklyActivityChart({ data }) {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bg-surface-container p-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline">
          Weekly Volume
        </p>
        <p className="text-[10px] text-on-surface-variant font-headline uppercase">KG</p>
      </div>
      <div className="flex items-end justify-between h-32 gap-1 px-2">
        {data.map((item, i) => {
          const isToday = i === todayIndex;
          const heightPct = (item.value / maxVal) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
              {isToday && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#0e639c] font-headline whitespace-nowrap">
                  TODAY
                </div>
              )}
              {item.value > 0 && (
                <div className="absolute bottom-full mb-0.5 text-[8px] text-on-surface-variant font-body whitespace-nowrap">
                  {item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}t` : item.value}
                </div>
              )}
              <div
                className={`w-full ${isToday ? 'bg-emerald-600' : 'bg-primary/20'}`}
                style={{ height: `${Math.max(heightPct, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 px-2">
        {data.map((item, i) => (
          <span
            key={i}
            className={`text-[8px] font-medium font-body ${i === todayIndex ? 'text-[#0e639c] font-bold' : 'text-on-surface-variant'}`}
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

function ActivityRow({ log, onDelete }) {
  const ref = useSwipeToDelete(onDelete);
  return (
    <div className="relative mb-3 overflow-hidden">
      <div className="absolute inset-0 bg-[#d93025] flex items-center justify-end pr-4">
        <span className="material-symbols-outlined text-on-error">delete</span>
      </div>
      <div ref={ref} className="relative bg-surface-container-low">
        <Link to={`/workouts/${log.id}`} className="block p-4">
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
          <div className="mb-3">
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline">Volume</p>
            <p className="text-xs font-bold text-white font-body">
              {log.totalVolumeKg > 0 ? `${log.totalVolumeKg.toLocaleString()} KG` : '—'}
            </p>
          </div>
          <p className="text-[10px] text-on-surface-variant font-body">{log.exercises}</p>
        </Link>
      </div>
    </div>
  );
}

function ActivitiesTab({ logs, onDelete }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase font-headline">All Activities</h2>
        <span className="text-[10px] text-on-surface-variant uppercase font-headline">
          {logs.length} sessions
        </span>
      </div>
      <p className="text-[10px] text-on-surface-variant font-headline uppercase mb-3">
        Swipe left on a session to delete it
      </p>
      {logs.length === 0 && (
        <p className="text-on-surface-variant text-sm font-body">No sessions logged yet.</p>
      )}
      {logs.map((log) => (
        <ActivityRow key={log.id} log={log} onDelete={() => onDelete(log.id)} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress tab
// ---------------------------------------------------------------------------

function VolumeChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-24 px-1">
        {data.map((w, i) => {
          const isLast = i === data.length - 1;
          const heightPct = (w.value / maxVal) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1 relative">
              {w.value > 0 && (
                <div className="absolute bottom-full mb-0.5 text-[7px] text-on-surface-variant font-body whitespace-nowrap">
                  {w.value >= 1000 ? `${(w.value / 1000).toFixed(1)}t` : w.value}
                </div>
              )}
              <div
                className={`w-full ${isLast ? 'bg-secondary' : 'bg-primary/30'}`}
                style={{ height: `${Math.max(heightPct, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 px-1">
        {data.map((w, i) => (
          <span key={i} className="text-[8px] text-on-surface-variant font-body truncate">
            {w.label.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProgressTab({ data, range, onRangeChange }) {
  const [volumeView, setVolumeView] = useState('week');
  const chartData = volumeView === 'week' ? data.volumeByWeek : data.volumeByMonth;
  const hasData = chartData && chartData.length > 0;

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={`flex-1 py-1.5 text-[9px] font-bold uppercase font-headline transition-colors ${
              range === r
                ? 'bg-emerald-600 text-white'
                : 'bg-surface-container text-on-surface-variant hover:text-white'
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="bg-surface-container-low p-4 mb-4">
        <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">
          Total Volume — {RANGE_LABELS[range]}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white font-headline tracking-tighter">
            {(data.totalVolume / 1000).toFixed(1)}
          </span>
          <span className="text-secondary text-lg font-bold font-body">T</span>
        </div>
      </div>

      <div className="bg-surface-container p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline">
            Volume Over Time
          </p>
          <div className="flex gap-1">
            {['week', 'month'].map((v) => (
              <button
                key={v}
                onClick={() => setVolumeView(v)}
                className={`px-3 py-1 text-[9px] font-bold uppercase font-headline transition-colors rounded flex items-center justify-center h-6 ${
                  volumeView === v
                    ? 'bg-[#0e639c] text-white'
                    : 'text-on-surface-variant hover:text-white hover:bg-surface-container-low'
                }`}
              >
                {v === 'week' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>
        {hasData ? (
          <VolumeChart data={chartData} />
        ) : (
          <p className="text-on-surface-variant text-sm font-body">No data for this range.</p>
        )}
      </div>

      {data.prs.length > 0 && (
        <div className="bg-surface-container-low p-4">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-3">
            Personal Records
          </p>
          {data.prs.map((pr) => (
            <div key={pr.name} className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
              <div>
                <p className="text-sm font-bold text-white font-headline uppercase tracking-tight">{pr.name}</p>
                <p className="text-[9px] text-on-surface-variant uppercase font-headline mt-0.5">{pr.date}</p>
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
  const [todaySessionId, setTodaySessionId] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [weekActivity, setWeekActivity] = useState(STUB_WEEK_ACTIVITY);
  const [progressData, setProgressData] = useState(STUB_PROGRESS);
  const [progressRange, setProgressRange] = useState('all');

  useEffect(() => {
    fetchSessions()
      .then((sessions) => {
        const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
        const filtered = sessions.filter((s) => s.date !== today);
        setRecentLogs(filtered.slice(0, 3));
        setActivityLogs(sessions);
      })
      .catch(() => {});

    fetch('/api/workouts/week-summary')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length === 7) setWeekActivity(data);
      })
      .catch(() => {});

    fetch('/api/sessions/today')
      .then((r) => r.json())
      .then((sessions) => {
        if (sessions && sessions.length > 0) setTodaySessionId(sessions[0].id);
      })
      .catch(() => {});

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
              status: data.status,
            });
          });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/workouts/progress?range=${progressRange}`)
      .then((r) => r.json())
      .then((data) => setProgressData(mapProgress(data)))
      .catch(() => {});
  }, [progressRange]);

  async function handleDeleteSession(dateId) {
    try {
      const res = await fetch(`/api/sessions/${dateId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
      setActivityLogs((prev) => prev.filter((l) => l.id !== dateId));
      setRecentLogs((prev) => prev.filter((l) => l.id !== dateId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete session.');
    }
  }

  return (
    <main
      className="pb-24 px-4 max-w-7xl mx-auto"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}
    >
      <div className="mb-6">
        <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white">
          HOME
        </h1>
      </div>

      <div className="flex border-b border-outline-variant/20 mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-sm font-bold tracking-widest uppercase font-headline px-4 relative transition-colors ${
              activeTab === tab
                ? 'text-white border-b-2 border-[#0e639c]'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'DASHBOARD' && (
        <>
          <NextWorkoutBanner workout={nextWorkout} todaySessionId={todaySessionId} />
          <section className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold tracking-widest uppercase font-headline">
                Previous workouts
              </h2>
              <button
                onClick={() => setActiveTab('ACTIVITIES')}
                className="text-[10px] text-[#0e639c] cursor-pointer hover:underline uppercase font-bold font-headline"
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

      {activeTab === 'ACTIVITIES' && (
        <ActivitiesTab logs={activityLogs} onDelete={handleDeleteSession} />
      )}

      {activeTab === 'PROGRESS' && (
        <ProgressTab
          data={progressData}
          range={progressRange}
          onRangeChange={setProgressRange}
        />
      )}
    </main>
  );
}