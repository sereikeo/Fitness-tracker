import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MUSCLE_COLORS = {
  'Chest':     { bg: 'bg-blue-900/40',    text: 'text-blue-300' },
  'Back':      { bg: 'bg-emerald-900/40', text: 'text-emerald-300' },
  'Shoulders': { bg: 'bg-violet-900/40',  text: 'text-violet-300' },
  'Biceps':    { bg: 'bg-cyan-900/40',    text: 'text-cyan-300' },
  'Triceps':   { bg: 'bg-orange-900/40',  text: 'text-orange-300' },
  'Legs':      { bg: 'bg-yellow-900/40',  text: 'text-yellow-300' },
  'Core':      { bg: 'bg-rose-900/40',    text: 'text-rose-300' },
};
const DEFAULT_MUSCLE_COLOR = { bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' };

function getMuscleColor(muscleGroup) {
  return MUSCLE_COLORS[muscleGroup] ?? DEFAULT_MUSCLE_COLOR;
}

function SetRow({ set, setIndex, onUpdate }) {
  return (
    <div className={`flex items-center gap-3 py-2 border-b border-outline-variant/10 ${set.done ? 'opacity-50' : ''}`}>
      <span className="text-[10px] text-on-surface-variant font-bold font-headline w-4">
        {setIndex + 1}
      </span>
      <div className="flex-1 bg-surface-container border-b border-outline focus-within:border-[#0e639c] transition-colors px-2 py-1">
        <input
          type="number"
          inputMode="decimal"
          value={set.weight || ''}
          placeholder="0"
          onChange={(e) => onUpdate(setIndex, 'weight', parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent text-white text-sm font-bold font-body outline-none placeholder:text-on-surface-variant/40 text-right"
        />
      </div>
      <span className="text-[9px] text-on-surface-variant uppercase font-headline">KG</span>
      <div className="flex-1 bg-surface-container border-b border-outline focus-within:border-[#0e639c] transition-colors px-2 py-1">
        <input
          type="number"
          inputMode="numeric"
          value={set.reps || ''}
          placeholder="0"
          onChange={(e) => onUpdate(setIndex, 'reps', parseInt(e.target.value) || 0)}
          className="w-full bg-transparent text-white text-sm font-bold font-body outline-none placeholder:text-on-surface-variant/40 text-right"
        />
      </div>
      <span className="text-[9px] text-on-surface-variant uppercase font-headline">REPS</span>
      <button
        onClick={() => onUpdate(setIndex, 'done', !set.done)}
        className={`w-8 h-8 flex items-center justify-center transition-colors ${
          set.done
            ? 'bg-secondary text-on-secondary'
            : 'border border-outline-variant/30 text-on-surface-variant hover:border-secondary hover:text-secondary'
        }`}
      >
        <span className="material-symbols-outlined text-sm">
          {set.done ? 'check' : 'radio_button_unchecked'}
        </span>
      </button>
    </div>
  );
}

function ExerciseBlock({ exercise, onUpdateSet }) {
  const colors = getMuscleColor(exercise.muscleGroup);
  return (
    <div className="bg-surface-container-low mb-4">
      <div className="p-3 border-b border-outline-variant/10">
        <div className="flex justify-between items-start">
          <div>
            <span className={`${colors.bg} ${colors.text} text-[9px] font-bold px-1.5 py-0.5 uppercase mb-1 inline-block font-headline`}>
              {exercise.muscleGroup || 'General'}
            </span>
            <h3 className="text-base font-black text-white uppercase font-headline tracking-tight">
              {exercise.name}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-on-surface-variant uppercase font-headline">
              {exercise.sets.filter((s) => s.done).length}/{exercise.sets.length} sets
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 px-3 pt-2 pb-1">
        <span className="text-[9px] text-on-surface-variant uppercase font-headline w-4">#</span>
        <span className="flex-1 text-[9px] text-on-surface-variant uppercase font-headline text-right">KG</span>
        <span className="text-[9px] text-on-surface-variant uppercase font-headline w-6"></span>
        <span className="flex-1 text-[9px] text-on-surface-variant uppercase font-headline text-right">REPS</span>
        <span className="text-[9px] text-on-surface-variant uppercase font-headline w-6"></span>
        <span className="w-8"></span>
      </div>
      <div className="px-3 pb-3">
        {exercise.sets.map((set, i) => (
          <SetRow
            key={i}
            set={set}
            setIndex={i}
            onUpdate={(idx, field, val) => onUpdateSet(exercise.id, idx, field, val)}
          />
        ))}
      </div>
    </div>
  );
}

function apiExerciseToWorkoutExercise(ex, exerciseLibrary) {
  const libEntry = exerciseLibrary[ex.exercise_id];
  const weight = ex.last_weight_kg ?? ex.default_weight_kg ?? 0;
  const reps = ex.last_reps ?? ex.default_reps ?? 0;
  return {
    id: ex.id,
    name: ex.name,
    exercise_id: ex.exercise_id,
    muscleGroup: libEntry?.muscle_group ?? ex.muscle_group ?? 'General',
    sets: Array.from({ length: ex.default_sets || 3 }, () => ({
      weight,
      reps,
      done: false,
    })),
  };
}

function CompletedSessionTile({ session, onClick }) {
  const muscleLabel = session.muscle_groups?.length
    ? session.muscle_groups.join(' + ')
    : 'Workout';
  return (
    <button
      onClick={onClick}
      className="w-full bg-surface-container-low p-4 mb-3 flex items-center justify-between hover:bg-surface-container transition-colors text-left"
    >
      <div>
        <p className="text-[10px] text-[#0e639c] font-bold tracking-tighter uppercase font-headline mb-1">Completed</p>
        <p className="text-base font-black text-white tracking-tight font-headline uppercase">{muscleLabel}</p>
        <p className="text-[9px] text-on-surface-variant uppercase font-headline mt-1">
          {session.exercise_count} exercises · {session.total_volume_kg.toLocaleString()} KG
        </p>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
    </button>
  );
}

export default function WorkoutsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workoutName, setWorkoutName] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [exerciseLibrary, setExerciseLibrary] = useState({});
  const [scheduledDate, setScheduledDate] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [adhocLoading, setAdhocLoading] = useState(false);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [scheduledWorkout, setScheduledWorkout] = useState(null);
  const [showProgramExercises, setShowProgramExercises] = useState(null);
  const [programExercises, setProgramExercises] = useState([]);
  

  useEffect(() => {
    let exerciseMap = {};

    fetch('/api/exercises')
      .then((r) => r.json())
      .then((list) => {
        list.forEach((ex) => { exerciseMap[ex.id] = ex; });
        setExerciseLibrary(exerciseMap);
        return fetch('/api/sessions/today');
      })
      .then((r) => r.json())
      .then((sessions) => {
        if (sessions && sessions.length > 0) {
          setCompletedSessions(sessions);
        }
        return fetch('/api/schedule/today')
          .then((r) => r.json())
          .then((schedule) => {
            return fetch('/api/programs')
              .then((r) => r.json())
              .then((programList) => {
                setPrograms(Array.isArray(programList) ? programList : []);
                if (!schedule || !schedule.routine_id) return;
                const program = programList.find((p) => p.id === schedule.routine_id);
                if (program) setScheduledWorkout(program);
                // Only auto-load the workout if nothing completed today
                if (schedule.status !== 'Completed') {
                  setScheduledDate(schedule.scheduled_date);
                  return fetch(`/api/programs/${schedule.routine_id}/exercises`)
                    .then((r) => r.json())
                    .then((exList) => {
                      setWorkoutName(program?.name ?? "Today's Workout");
                      setExercises(
                        Array.isArray(exList)
                          ? exList.map((ex) => apiExerciseToWorkoutExercise(ex, exerciseMap))
                          : []
                      );
                    });
                }
              });
          });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleStartAdhoc(program) {
    setAdhocLoading(true);
    try {
      const res = await fetch(`/api/programs/${program.id}/exercises`);
      if (!res.ok) throw new Error(`GET exercises failed: ${res.status}`);
      const exList = await res.json();
      setWorkoutName(program.name);
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setExercises(
        Array.isArray(exList)
          ? exList.map((ex) => apiExerciseToWorkoutExercise(ex, exerciseLibrary))
          : []
      );
    } catch (err) {
      console.error(err);
      alert('Failed to load program exercises.');
    } finally {
      setAdhocLoading(false);
    }
  }

  async function handleViewProgramExercises(programId) {
    try {
      const res = await fetch(`/api/programs/${programId}/exercises`);
      if (!res.ok) throw new Error(`GET exercises failed: ${res.status}`);
      const exList = await res.json();
      setProgramExercises(exList);
      setShowProgramExercises(programId);
    } catch (err) {
      console.error(err);
      alert('Failed to load program exercises.');
    }
  }

  function handleUpdateSet(exerciseId, setIndex, field, value) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)) }
          : ex
      )
    );
  }

  async function handleFinish() {
    const date = scheduledDate ?? new Date().toISOString().split('T')[0];
    const exerciseRows = [];

    exercises.forEach((ex) => {
      const doneSets = ex.sets.filter((s) => s.done && s.reps > 0);
      if (doneSets.length === 0) return;
      const grouped = {};
      doneSets.forEach((s) => {
        const key = `${s.weight}|${s.reps}`;
        if (!grouped[key]) grouped[key] = { weight: s.weight, reps: s.reps, count: 0 };
        grouped[key].count += 1;
      });
      Object.values(grouped).forEach(({ weight, reps, count }) => {
        exerciseRows.push({ exercise_id: ex.exercise_id, sets: count, reps, weight_kg: weight, notes: '' });
      });
    });

    if (exerciseRows.length === 0) {
      alert('No completed sets to log. Mark sets as done before finishing.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, exercises: exerciseRows }),
      });
      if (!res.ok) throw new Error(`POST /api/sessions failed: ${res.status}`);

      const session = await res.json();

      // Append to completed sessions and clear active workout
      setCompletedSessions((prev) => [...prev, {
        id: session.id,
        date: session.date,
        exercise_count: session.exercise_count,
        total_volume_kg: session.total_volume_kg,
        muscle_groups: [],
      }]);
      setWorkoutName(null);
      setExercises([]);
      setScheduledDate(null);

      navigate(`/workouts/${session.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save session. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  }

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const doneSets = exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);
  const totalVolume = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.done).reduce((a, s) => a + s.weight * s.reps, 0),
    0
  );

  if (loading) {
    return (
      <main className="pb-24 px-4 max-w-7xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
        <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white mb-6">WORKOUTS</h1>
        <p className="text-on-surface-variant text-sm font-body">Loading...</p>
      </main>
    );
  }

  // Active workout view
  if (workoutName) {
    return (
      <main className="pb-24 px-4 max-w-7xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
        <div className="mb-4">
          <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white mb-2">WORKOUTS</h1>
          <p className="text-[10px] text-[#0e639c] font-bold tracking-tighter uppercase font-headline">Active Workout</p>
          <p className="text-xl font-black text-white tracking-tight font-headline uppercase mt-1">{workoutName}</p>
        </div>

        <div className="bg-surface-container-low p-3 mb-6 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">Total Volume</p>
            <p className="text-lg font-black text-white font-body tracking-tighter">
              {totalVolume.toLocaleString()}<span className="text-[10px] text-secondary ml-1">KG</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">Sets Done</p>
            <p className="text-lg font-black text-white font-body tracking-tighter">
              {doneSets}<span className="text-[10px] text-on-surface-variant ml-1">/ {totalSets}</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">Exercises</p>
            <p className="text-lg font-black text-white font-body tracking-tighter">{exercises.length}</p>
          </div>
        </div>

        {exercises.length === 0 && (
          <p className="text-on-surface-variant text-sm font-body">No exercises in this program yet.</p>
        )}
        {exercises.map((exercise) => (
          <ExerciseBlock key={exercise.id} exercise={exercise} onUpdateSet={handleUpdateSet} />
        ))}

        {exercises.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="bg-emerald-600 py-3 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <span className="text-white text-sm font-black tracking-[0.2em] font-headline uppercase">
                {submitting ? 'Saving...' : 'Finish'}
              </span>
              <span className="material-symbols-outlined text-white text-sm">check_circle</span>
            </button>
            <button
              onClick={() => {
                setWorkoutName(null);
                setExercises([]);
                setScheduledDate(null);
              }}
              disabled={submitting}
              className="border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              <span className="text-on-surface-variant text-sm font-black tracking-[0.2em] font-headline uppercase">Cancel</span>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
            </button>
          </div>
        )}
      </main>
    );
  }

  // Default view — completed sessions + scheduled workout + adhoc picker
  return (
    <main className="pb-24 px-4 max-w-7xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
      <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white mb-6">WORKOUTS</h1>

      {completedSessions.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold font-headline mb-3">Today</p>
          {completedSessions.map((session) => (
            <CompletedSessionTile
              key={session.id}
              session={session}
              onClick={() => navigate(`/workouts/${session.id}`)}
            />
          ))}
        </div>
      )}

      <div>
        <p className="text-[10px] text-on-surface-variant uppercase font-bold font-headline mb-3">
          {completedSessions.length > 0 ? 'Start another workout' : 'Start a workout'}
        </p>
        {scheduledWorkout && completedSessions.length === 0 && (
          <button
            onClick={() => handleStartAdhoc(scheduledWorkout)}
            disabled={adhocLoading}
            className="w-full bg-surface-container-low p-4 mb-2 flex items-center justify-between hover:bg-surface-container transition-colors disabled:opacity-50 text-left border-l-2 border-[#0e639c]"
          >
            <div>
              <p className="text-[9px] text-[#0e639c] font-bold uppercase font-headline mb-1">Scheduled for today</p>
              <p className="text-sm font-black text-white uppercase font-headline tracking-tight">{scheduledWorkout.name}</p>
            </div>
            <span className="material-symbols-outlined text-[#0e639c] text-sm">play_arrow</span>
          </button>
        )}
        {programs.length === 0 && !scheduledWorkout && (
          <p className="text-on-surface-variant text-sm font-body">No programs found. Create one in Plans first.</p>
        )}
        {programs.map((program) => (
          <div key={program.id} className="mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewProgramExercises(program.id);
              }}
              disabled={adhocLoading}
              className="w-full bg-surface-container-low p-4 flex items-center justify-between hover:bg-surface-container transition-colors disabled:opacity-50 text-left"
            >
              <p className="text-sm font-black text-white uppercase font-headline tracking-tight">{program.name}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartAdhoc(program);
              }}
              disabled={adhocLoading}
              className="bg-emerald-600 text-white p-2 hover:bg-emerald-700 transition-colors rounded"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
            </button>
            </button>
            {showProgramExercises === program.id && (
              <div className="bg-surface-container p-4 mt-2 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-black text-white uppercase font-headline tracking-tight">Program Exercises</h3>
                  <button 
                    onClick={() => setShowProgramExercises(null)}
                    className="text-on-surface-variant hover:text-white"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                {programExercises.length > 0 ? (
                  <div className="space-y-3">
                    {programExercises.map((exercise, index) => (
                      <div key={index} className="bg-surface-container-low p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-base font-black text-white uppercase font-headline tracking-tight">{exercise.name}</h4>
                            <p className="text-sm text-on-surface-variant">{exercise.muscle_group || 'General'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-on-surface-variant">Sets: {exercise.default_sets || 3}</p>
                            <p className="text-xs text-on-surface-variant">Reps: {exercise.default_reps || 10}</p>
                            <p className="text-xs text-on-surface-variant">Weight: {exercise.default_weight_kg || 0} kg</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-on-surface-variant">No exercises found for this program.</p>
                )}
              </div>
            )}
          </div>
        ))}
        
        {showProgramExercises && (
          <div className="bg-surface-container p-4 mt-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-black text-white uppercase font-headline tracking-tight">Program Exercises</h3>
              <button 
                onClick={() => setShowProgramExercises(null)}
                className="text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {programExercises.length > 0 ? (
              <div className="space-y-3">
                {programExercises.map((exercise, index) => (
                  <div key={index} className="bg-surface-container-low p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-black text-white uppercase font-headline tracking-tight">{exercise.name}</h4>
                        <p className="text-sm text-on-surface-variant">{exercise.muscle_group || 'General'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-on-surface-variant">Sets: {exercise.default_sets || 3}</p>
                        <p className="text-xs text-on-surface-variant">Reps: {exercise.default_reps || 10}</p>
                        <p className="text-xs text-on-surface-variant">Weight: {exercise.default_weight_kg || 0} kg</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-on-surface-variant">No exercises found for this program.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}