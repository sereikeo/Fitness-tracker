import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TABS = ['PLANS', 'PROGRAMS', 'EXERCISES'];

const MUSCLE_GROUP_STYLES = {
  Chest:     { bg: 'bg-red-900/60',    text: 'text-red-300' },
  Back:      { bg: 'bg-blue-900/60',   text: 'text-blue-300' },
  Shoulders: { bg: 'bg-purple-900/60', text: 'text-purple-300' },
  Biceps:    { bg: 'bg-emerald-900/60',text: 'text-emerald-300' },
  Triceps:   { bg: 'bg-teal-900/60',   text: 'text-teal-300' },
  Legs:      { bg: 'bg-orange-900/60', text: 'text-orange-300' },
  Core:      { bg: 'bg-yellow-900/60', text: 'text-yellow-300' },
};

function getMuscleGroupStyle(muscleGroup) {
  return MUSCLE_GROUP_STYLES[muscleGroup] || { bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' };
}

function useSwipeToDelete(onDelete) {
  const ref = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiped = useRef(false);
  const onDeleteRef = useRef(onDelete);
  const THRESHOLD = 80;

  useEffect(() => {
    onDeleteRef.current = onDelete;
  }, [onDelete]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onTouchStart(e) {
      startX.current = e.touches[0].clientX;
      currentX.current = 0;
      swiped.current = false;
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
        swiped.current = true;
        el.style.transition = 'transform 0.2s ease';
        el.style.transform = 'translateX(-100%)';
        setTimeout(() => onDeleteRef.current(), 200);
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
  }, []);

  return { ref, didSwipe: () => swiped.current };
}

function PlanCard({ plan, programName, onDelete }) {
  const navigate = useNavigate();
  const { ref, didSwipe } = useSwipeToDelete(onDelete);

  function handleClick() {
    if (didSwipe()) return;
    navigate(`/plans/${plan.id}`);
  }

  return (
    <div className="relative mb-3 overflow-hidden">
      <div className="absolute inset-0 bg-error flex items-center justify-end pr-4">
        <span className="material-symbols-outlined text-on-error">delete</span>
      </div>
      <div
        ref={ref}
        onClick={handleClick}
        className="relative bg-surface-container-low p-4 cursor-pointer hover:bg-surface-container transition-colors"
      >
        <div className="mb-3">
          <span className="bg-surface-container-highest text-secondary text-[9px] font-bold px-1.5 py-0.5 uppercase mb-2 inline-block font-headline">
            {plan.day || 'NO DAY SET'}
          </span>
          <h3 className="text-lg font-black text-white uppercase font-headline tracking-tight">
            {plan.name}
          </h3>
        </div>
        <div className="bg-surface-container p-2">
          <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">Program</p>
          <p className="text-xs text-white font-bold font-body">{programName || '—'}</p>
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ program, onDelete }) {
  const navigate = useNavigate();
  const { ref, didSwipe } = useSwipeToDelete(onDelete);

  function handleClick() {
    if (didSwipe()) return;
    navigate(`/plans/programs/${program.id}`);
  }

  return (
    <div className="relative mb-3 overflow-hidden">
      <div className="absolute inset-0 bg-error flex items-center justify-end pr-4">
        <span className="material-symbols-outlined text-on-error">delete</span>
      </div>
      <div
        ref={ref}
        onClick={handleClick}
        className="relative bg-surface-container-low p-4 cursor-pointer hover:bg-surface-container transition-colors"
      >
        <h3 className="text-base font-black text-white uppercase font-headline tracking-tight">
          {program.name}
        </h3>
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, onDelete, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState(exercise.name);
  const [localMuscleGroup, setLocalMuscleGroup] = useState(exercise.muscle_group);
  const { ref, didSwipe } = useSwipeToDelete(onDelete);
  const { bg, text } = getMuscleGroupStyle(exercise.muscle_group);

  function handleClick() {
    if (didSwipe()) return;
    setIsEditing(true);
  }

  function handleSave() {
    onSave(exercise.id, localName, localMuscleGroup);
    setIsEditing(false);
  }

  function handleCancel() {
    setLocalName(exercise.name);
    setLocalMuscleGroup(exercise.muscle_group);
    setIsEditing(false);
  }

  return (
    <div className="relative mb-3 overflow-hidden">
      <div className="absolute inset-0 bg-error flex items-center justify-end pr-4">
        <span className="material-symbols-outlined text-on-error">delete</span>
      </div>
      <div
        ref={ref}
        onClick={!isEditing ? handleClick : undefined}
        className="relative bg-surface-container-low p-4 cursor-pointer hover:bg-surface-container transition-colors"
      >
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="bg-surface-container border border-outline-variant/30 text-white text-sm font-body px-3 py-2 w-full mb-2 placeholder:text-on-surface-variant/50"
            />
            <input
              type="text"
              value={localMuscleGroup}
              onChange={(e) => setLocalMuscleGroup(e.target.value)}
              className="bg-surface-container border border-outline-variant/30 text-white text-sm font-body px-3 py-2 w-full mb-3 placeholder:text-on-surface-variant/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="bg-primary text-on-primary text-xs font-black font-headline tracking-widest uppercase px-4 py-1.5"
              >
                SAVE
              </button>
              <button
                onClick={handleCancel}
                className="text-on-surface-variant text-xs font-black font-headline tracking-widest uppercase px-4 py-1.5"
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white uppercase font-headline tracking-tight">
              {exercise.name}
            </h3>
            <span className={`text-[9px] font-bold font-headline uppercase px-1.5 py-0.5 ${bg} ${text}`}>
              {exercise.muscle_group}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function AddExerciseTile({ onAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscleGroup, setNewMuscleGroup] = useState('');
  const muscleGroups = Object.keys(MUSCLE_GROUP_STYLES);

  async function handleAdd() {
    if (!newName.trim() || !newMuscleGroup) return;
    await onAdd(newName.trim(), newMuscleGroup);
    setNewName('');
    setNewMuscleGroup('');
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-sm">add</span>
        <span className="text-on-surface-variant text-sm font-black tracking-[0.2em] font-headline uppercase">
          Add Exercise
        </span>
      </button>
    );
  }

  return (
    <div className="bg-surface-container-low p-4 mb-6">
      <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-3 tracking-widest">
        New Exercise
      </p>
      <input
        type="text"
        placeholder="Exercise name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className="bg-surface-container border border-outline-variant/30 text-white text-sm font-body px-3 py-2 w-full mb-3 placeholder:text-on-surface-variant/50"
      />
      <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-2 tracking-widest">
        Muscle Group
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {muscleGroups.map((mg) => {
          const { bg, text } = getMuscleGroupStyle(mg);
          const selected = newMuscleGroup === mg;
          return (
            <button
              key={mg}
              onClick={() => setNewMuscleGroup(mg)}
              className={`text-[9px] font-bold font-headline uppercase px-2 py-1 transition-opacity ${bg} ${text} ${
                selected ? 'opacity-100 ring-1 ring-white/30' : 'opacity-40'
              }`}
            >
              {mg}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          className="bg-primary text-on-primary text-xs font-black font-headline tracking-widest uppercase px-4 py-1.5"
        >
          ADD
        </button>
        <button
          onClick={() => { setIsOpen(false); setNewName(''); setNewMuscleGroup(''); }}
          className="text-on-surface-variant text-xs font-black font-headline tracking-widest uppercase px-4 py-1.5"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

function ExercisesTab() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMuscleGroup, setFilterMuscleGroup] = useState(null);
  const muscleGroups = Object.keys(MUSCLE_GROUP_STYLES);

  useEffect(() => {
    fetchExercises();
  }, []);

  async function fetchExercises() {
    try {
      const res = await fetch('/api/exercises');
      if (!res.ok) throw new Error(`fetchExercises failed: ${res.status}`);
      const data = await res.json();
      setExercises(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load exercises.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(name, muscleGroup) {
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, muscle_group: muscleGroup }),
      });
      if (!res.ok) throw new Error(`addExercise failed: ${res.status}`);
      const created = await res.json();
      // API only returns {id} — construct full object from what we sent
      setExercises((prev) =>
  [...prev, { id: created.id, name, muscle_group: muscleGroup }]
    .sort((a, b) => a.name.localeCompare(b.name))
);
    } catch (err) {
      console.error(err);
      setError('Failed to add exercise.');
    }
  }

  async function handleSave(id, name, muscleGroup) {
    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, muscle_group: muscleGroup }),
      });
      if (!res.ok) throw new Error(`editExercise failed: ${res.status}`);
      setExercises((prev) =>
        prev.map((ex) => (ex.id === id ? { ...ex, name, muscle_group: muscleGroup } : ex))
      );
    } catch (err) {
      console.error(err);
      setError('Failed to save exercise.');
    }
  }

  const handleDelete = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/exercises/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`deleteExercise failed: ${res.status}`);
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete exercise.');
    }
  }, []);

  const filteredExercises = filterMuscleGroup
    ? exercises.filter((ex) => ex.muscle_group === filterMuscleGroup)
    : exercises;

  return (
    <>
      {error && <p className="text-error text-sm font-body mb-4">{error}</p>}

      <AddExerciseTile onAdd={handleAdd} />

      {/* Muscle group filter */}
      <div className="mb-4">
        <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-2 tracking-widest">
          Filter
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterMuscleGroup(null)}
            className={`text-[9px] font-bold font-headline uppercase px-2 py-1 border transition-opacity ${
              filterMuscleGroup === null
                ? 'border-white/30 text-white opacity-100'
                : 'border-outline-variant/30 text-on-surface-variant opacity-50'
            }`}
          >
            All
          </button>
          {muscleGroups.map((mg) => {
            const { bg, text } = getMuscleGroupStyle(mg);
            const active = filterMuscleGroup === mg;
            return (
              <button
                key={mg}
                onClick={() => setFilterMuscleGroup(active ? null : mg)}
                className={`text-[9px] font-bold font-headline uppercase px-2 py-1 transition-opacity ${bg} ${text} ${
                  active ? 'opacity-100 ring-1 ring-white/30' : 'opacity-40'
                }`}
              >
                {mg}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-on-surface-variant text-sm font-body">Loading...</p>
      ) : (
        <>
          {filteredExercises.length === 0 && (
            <p className="text-on-surface-variant text-sm font-body mb-4">No exercises.</p>
          )}
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onDelete={() => handleDelete(exercise.id)}
              onSave={handleSave}
            />
          ))}
        </>
      )}
    </>
  );
}

export default function PlansPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('PLANS');
  const [plans, setPlans] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/plans').then((r) => r.json()),
      fetch('/api/programs').then((r) => r.json()),
    ])
      .then(([plansData, programsData]) => {
        setPlans(Array.isArray(plansData) ? plansData : []);
        setPrograms(Array.isArray(programsData) ? programsData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDeletePlan(id) {
    try {
      const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete plan.');
    }
  }

  async function handleDeleteProgram(id) {
    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
      setPrograms((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete program.');
    }
  }

  const programMap = Object.fromEntries(programs.map((p) => [p.id, p.name]));

  return (
    <main
      className="pb-24 px-4 max-w-7xl mx-auto"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}
    >
      <div className="mb-6">
        <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white">
          Plans
        </h1>
      </div>

      <div className="flex border-b border-outline-variant/20 mb-6 overflow-x-auto">
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

      {loading && (
        <p className="text-on-surface-variant text-sm font-body">Loading...</p>
      )}

      {!loading && activeTab === 'PLANS' && (
        <>
          {plans.length === 0 && (
            <p className="text-on-surface-variant text-sm font-body mb-4">No plans yet.</p>
          )}
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              programName={programMap[plan.program_id]}
              onDelete={() => handleDeletePlan(plan.id)}
            />
          ))}
          <button
            onClick={() => navigate('/plans/new')}
            className="w-full border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors mt-2"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-sm">add</span>
            <span className="text-on-surface-variant text-sm font-black tracking-[0.2em] font-headline uppercase">
              Add New Plan
            </span>
          </button>
        </>
      )}

      {!loading && activeTab === 'PROGRAMS' && (
        <>
          {programs.length === 0 && (
            <p className="text-on-surface-variant text-sm font-body mb-4">No programs yet.</p>
          )}
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onDelete={() => handleDeleteProgram(program.id)}
            />
          ))}
          <button
            onClick={() => navigate('/plans/programs/new')}
            className="w-full border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors mt-2"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-sm">add</span>
            <span className="text-on-surface-variant text-sm font-black tracking-[0.2em] font-headline uppercase">
              Add New Program
            </span>
          </button>
        </>
      )}

      {!loading && activeTab === 'EXERCISES' && <ExercisesTab />}
    </main>
  );
}