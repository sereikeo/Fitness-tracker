import { useState } from 'react';

/*
 * WorkoutsPage
 *
 * Props (all optional — renders stub data when not provided):
 *   workout      {object|null}  - active workout session
 *                                 { name, exercises: [{ id, name, sets: [{ weight, reps, done }] }] }
 *   onFinish     {function}     - called when workout is finished
 *   onCancel     {function}     - called when workout is cancelled
 *
 * Wiring target:
 *   workout      <- GET /api/schedule/today + GET /api/routines/{id}/exercises
 *   onFinish     -> POST /api/workouts
 *   onCancel     -> no-op / navigate back
 */

const STUB_WORKOUT = {
  name: 'Hypertrophy A Pull',
  exercises: [
    {
      id: '1',
      name: 'Barbell Row',
      tag: 'Main Lift',
      sets: [
        { weight: 80, reps: 12, done: true },
        { weight: 80, reps: 12, done: true },
        { weight: 80, reps: 12, done: false },
        { weight: 80, reps: 12, done: false },
      ],
    },
    {
      id: '2',
      name: 'Lat Pulldown',
      tag: 'Accessory',
      sets: [
        { weight: 0, reps: 0, done: false },
        { weight: 0, reps: 0, done: false },
        { weight: 0, reps: 0, done: false },
      ],
    },
  ],
};

function SetRow({ set, setIndex, onUpdate }) {
  return (
    <div className={`flex items-center gap-3 py-2 border-b border-outline-variant/10 ${set.done ? 'opacity-50' : ''}`}>
      <span className="text-[10px] text-on-surface-variant font-bold font-headline w-4">
        {setIndex + 1}
      </span>

      {/* Weight input */}
      <div className="flex-1 bg-surface-container border-b border-outline focus-within:border-primary transition-colors px-2 py-1">
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

      {/* Reps input */}
      <div className="flex-1 bg-surface-container border-b border-outline focus-within:border-primary transition-colors px-2 py-1">
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

      {/* Done toggle */}
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
  return (
    <div className="bg-surface-container-low mb-4">
      {/* Exercise header */}
      <div className="p-3 border-b border-outline-variant/10">
        <div className="flex justify-between items-start">
          <div>
            <span className="bg-surface-container-highest text-on-surface-variant text-[9px] font-bold px-1.5 py-0.5 uppercase mb-1 inline-block font-headline">
              {exercise.tag}
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

      {/* Column headers */}
      <div className="flex items-center gap-3 px-3 pt-2 pb-1">
        <span className="text-[9px] text-on-surface-variant uppercase font-headline w-4">#</span>
        <span className="flex-1 text-[9px] text-on-surface-variant uppercase font-headline text-right">KG</span>
        <span className="text-[9px] text-on-surface-variant uppercase font-headline w-6"></span>
        <span className="flex-1 text-[9px] text-on-surface-variant uppercase font-headline text-right">REPS</span>
        <span className="text-[9px] text-on-surface-variant uppercase font-headline w-6"></span>
        <span className="w-8"></span>
      </div>

      {/* Sets */}
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

export default function WorkoutsPage({
  workout = STUB_WORKOUT,
  onFinish,
  onCancel,
}) {
  const [exercises, setExercises] = useState(
    workout?.exercises ?? STUB_WORKOUT.exercises
  );

  const workoutName = workout?.name ?? STUB_WORKOUT.name;

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const doneSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.done).length,
    0
  );
  const totalVolume = exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets
        .filter((s) => s.done)
        .reduce((a, s) => a + s.weight * s.reps, 0),
    0
  );

  function handleUpdateSet(exerciseId, setIndex, field, value) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) =>
                i === setIndex ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );
  }

  return (
    <main
      className="pb-24 px-4 max-w-7xl mx-auto"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}
    >
      {/* Header */}
      <div className="mb-4">
        <p className="text-[10px] text-primary font-bold tracking-tighter mb-1 uppercase font-headline">
          Active Workout
        </p>
        <h1 className="text-3xl font-headline font-black tracking-tighter uppercase text-white">
          {workoutName}
        </h1>
      </div>

      {/* Live stats bar */}
      <div className="bg-surface-container-low p-3 mb-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">
            Total Volume
          </p>
          <p className="text-lg font-black text-white font-body tracking-tighter">
            {totalVolume.toLocaleString()}
            <span className="text-[10px] text-secondary ml-1">KG</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">
            Sets Done
          </p>
          <p className="text-lg font-black text-white font-body tracking-tighter">
            {doneSets}
            <span className="text-[10px] text-on-surface-variant ml-1">/ {totalSets}</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">
            Exercises
          </p>
          <p className="text-lg font-black text-white font-body tracking-tighter">
            {exercises.length}
          </p>
        </div>
      </div>

      {/* Exercise blocks */}
      {exercises.map((exercise) => (
        <ExerciseBlock
          key={exercise.id}
          exercise={exercise}
          onUpdateSet={handleUpdateSet}
        />
      ))}

      {/* Finish / Cancel */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={() => onFinish?.({ exercises, totalVolume })}
          className="bg-primary py-3 flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
        >
          <span className="text-on-primary text-sm font-black tracking-[0.2em] font-headline uppercase">
            Finish
          </span>
          <span className="material-symbols-outlined text-on-primary text-sm">check_circle</span>
        </button>
        <button
          onClick={() => onCancel?.()}
          className="border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
        >
          <span className="text-on-surface-variant text-sm font-black tracking-[0.2em] font-headline uppercase">
            Cancel
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
        </button>
      </div>
    </main>
  );
}