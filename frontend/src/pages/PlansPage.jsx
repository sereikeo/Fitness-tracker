import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TABS = ['PLANS', 'PROGRAMS', 'EXERCISES'];

function useSwipeToDelete(onDelete) {
  const ref = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiped = useRef(false);
  const THRESHOLD = 80;

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
      if (delta > 0) return; // only left swipe
      currentX.current = delta;
      el.style.transform = `translateX(${Math.max(delta, -100)}px)`;
    }

    function onTouchEnd() {
      if (currentX.current < -THRESHOLD) {
        swiped.current = true;
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
      {/* Red delete strip behind */}
      <div className="absolute inset-0 bg-error flex items-center justify-end pr-4">
        <span className="material-symbols-outlined text-on-error">delete</span>
      </div>
      {/* Card */}
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
      {/* Red delete strip behind */}
      <div className="absolute inset-0 bg-error flex items-center justify-end pr-4">
        <span className="material-symbols-outlined text-on-error">delete</span>
      </div>
      {/* Card */}
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

function ExerciseRow({ exercise, handleEditExercise, handleDeleteExercise }) {
  const [localName, setLocalName] = useState(exercise.name);
  const [localMuscleGroup, setLocalMuscleGroup] = useState(exercise.muscle_group);
  const { ref, didSwipe } = useSwipeToDelete(() => handleDeleteExercise(exercise.id));

  const handleSave = () => {
    if (localName !== exercise.name || localMuscleGroup !== exercise.muscle_group) {
      handleEditExercise(exercise.id, localName, localMuscleGroup);
    }
  };

  return (
    <div className="relative mb-3 overflow-hidden">
      {/* Red delete strip behind */}
      <div className="absolute inset-0 bg-error flex items-center justify-end pr-4">
        <span className="material-symbols-outlined text-on-error">delete</span>
      </div>
      {/* Card */}
      <div
        ref={ref}
        className="relative bg-surface-container-low p-4 cursor-pointer hover:bg-surface-container transition-colors"
      >
        <div className="flex justify-between items-center">
          <div>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleSave}
              className="bg-surface-container border border-outline-variant/30 text-white text-sm font-body px-3 py-2 w-full mb-1"
            />
            <input
              type="text"
              value={localMuscleGroup}
              onChange={(e) => setLocalMuscleGroup(e.target.value)}
              onBlur={handleSave}
              className="bg-surface-container border border-outline-variant/30 text-white text-sm font-body px-3 py-2 w-full"
            />
          </div>
          <button onClick={handleSave} className="bg-primary text-on-primary text-sm font-bold px-4 py-2 rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ExerciseEditor({ handleAddExercise }) {
  const [exerciseName, setExerciseName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const res = await fetch('/api/exercises');
      if (!res.ok) throw new Error(`fetchExercises failed: ${res.status}`);
      const data = await res.json();
      setExercises(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load exercises.');
      setLoading(false);
    }
  };

  const handleEditExercise = async (id, updatedName, updatedMuscleGroup) => {
    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updatedName, muscle_group: updatedMuscleGroup }),
      });
      if (!res.ok) throw new Error(`editExercise failed: ${res.status}`);
      setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, name: updatedName, muscle_group: updatedMuscleGroup } : ex)));
    } catch (err) {
      console.error(err);
      setError('Failed to edit exercise.');
    }
  };

  const handleDeleteExercise = async (id) => {
    try {
      const res = await fetch(`/api/exercises/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`deleteExercise failed: ${res.status}`);
      setExercises(exercises.filter((ex) => ex.id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete exercise.');
    }
  };

  return (
    <div>
      {error && <p className="text-error text-sm font-body">{error}</p>}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Exercise Name"
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          className="bg-surface-container border border-outline-variant/30 text-white text-sm font-body px-3 py-2 w-full mb-1"
        />
        <input
          type="text"
          placeholder="Muscle Group"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="bg-surface-container border border-outline-variant/30 text-white text-sm font-body px-3 py-2 w-full mb-1"
        />
        <button onClick={handleAddExercise} className="bg-primary text-on-primary text-sm font-bold px-4 py-2 rounded">
          Add Exercise
        </button>
      </div>
      {loading ? (
        <p className="text-on-surface-variant text-sm font-body">Loading...</p>
      ) : (
        <>
          {exercises.length === 0 && (
            <p className="text-on-surface-variant text-sm font-body mb-4">No exercises yet.</p>
          )}
          {exercises.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              handleEditExercise={handleEditExercise}
              handleDeleteExercise={handleDeleteExercise}
            />
          ))}
        </>
      )}
    </div>
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

  const handleAddExercise = async () => {
    if (!exerciseName.trim() || !muscleGroup.trim()) return;
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: exerciseName, muscle_group: muscleGroup }),
      });
      if (!res.ok) throw new Error(`addExercise failed: ${res.status}`);
      const newExercise = await res.json();
      setExercises([...exercises, newExercise]);
      setExerciseName('');
      setMuscleGroup('');
    } catch (err) {
      console.error(err);
      setError('Failed to add exercise.');
    }
  };

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

      {!loading && activeTab === 'EXERCISES' && (
        <>
          <ExerciseEditor handleAddExercise={handleAddExercise} />
        </>
      )}
    </main>
  );
}
