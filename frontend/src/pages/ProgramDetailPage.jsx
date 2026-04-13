import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

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

function getMuscleColor(mg) {
  return MUSCLE_COLORS[mg] ?? DEFAULT_MUSCLE_COLOR;
}

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
      if (delta > 0) return;
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

  return ref;
}

function useDragReorder(exercises, setExercises, onReorderComplete) {
  const listRef = useRef(null);
  const dragIndex = useRef(null);
  const dragEl = useRef(null);
  const exercisesRef = useRef(exercises);
  useEffect(() => { exercisesRef.current = exercises; }, [exercises]);

  const getHandleRef = (index) => (el) => {
    if (!el) return;
    el._dragCleanup?.();

    let ghost = null;
    let startY = 0;

    function onTouchStart(e) {
      dragIndex.current = index;
      dragEl.current = el.closest('[data-exercise-row]');
      if (!dragEl.current) return;

      const rect = dragEl.current.getBoundingClientRect();
      startY = e.touches[0].clientY - rect.top;

      ghost = dragEl.current.cloneNode(true);
      ghost.style.position = 'fixed';
      ghost.style.left = rect.left + 'px';
      ghost.style.top = rect.top + 'px';
      ghost.style.width = rect.width + 'px';
      ghost.style.opacity = '0.95';
      ghost.style.transform = 'scale(1.03)';
      ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
      ghost.style.zIndex = '1000';
      ghost.style.pointerEvents = 'none';
      ghost.style.transition = 'none';
      document.body.appendChild(ghost);

      dragEl.current.style.opacity = '0.3';
      window.addEventListener('touchend', cleanupGhost, { once: true });
      window.addEventListener('touchcancel', cleanupGhost, { once: true });
      e.stopPropagation();
    }
    function cleanupGhost() {
      if (ghost) { ghost.remove(); ghost = null; }
      if (dragEl.current) { dragEl.current.style.opacity = '1'; }
    }

    function onTouchMove(e) {
      if (dragIndex.current === null) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (ghost) ghost.style.top = (touch.clientY - startY) + 'px';
      const list = listRef.current;
      if (!list) return;
      const rows = [...list.querySelectorAll('[data-exercise-row]')];
      let newIndex = dragIndex.current;
      rows.forEach((row, i) => {
        const rect = row.getBoundingClientRect();
        const threshold = rect.height * 0.05;
        if (touch.clientY > rect.top + threshold && touch.clientY < rect.bottom - threshold) newIndex = i;
      });
      if (newIndex !== dragIndex.current) {
        const reordered = [...exercisesRef.current];
        const [moved] = reordered.splice(dragIndex.current, 1);
        reordered.splice(newIndex, 0, moved);
        dragIndex.current = newIndex;
        setExercises(reordered);
      }
    }
    function onTouchEnd() {
      cleanupGhost();
      dragEl.current = null;
      onReorderComplete();
      dragIndex.current = null;
    }

    function cleanup() {
      if (ghost) { ghost.remove(); ghost = null; }
      if (dragEl.current) { dragEl.current.style.opacity = '1'; }
      dragEl.current = null;
      dragIndex.current = null;
      window.removeEventListener('touchend', cleanup);
      window.removeEventListener('touchcancel', cleanup);
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', (e) => { onTouchEnd(); window.removeEventListener('touchend', cleanup); window.removeEventListener('touchcancel', cleanup); });
    el.addEventListener('touchcancel', cleanup);
    el._dragCleanup = () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', cleanup);
      cleanup();
    };
  };

  return { listRef, getHandleRef };
}

function Stepper({ label, value, onDec, onInc, suffix, step = 1 }) {
  return (
    <div className="flex items-center gap-1">
      <p className="text-[9px] text-on-surface-variant uppercase font-headline w-20">{label}</p>
      <button onClick={onDec} className="w-7 h-7 border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container transition-colors">
        <span className="material-symbols-outlined text-sm text-on-surface-variant">remove</span>
      </button>
      <span className="text-white font-bold font-body w-10 text-center">{value}</span>
      <button onClick={onInc} className="w-7 h-7 border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container transition-colors">
        <span className="material-symbols-outlined text-sm text-on-surface-variant">add</span>
      </button>
      {suffix && <span className="text-[9px] text-on-surface-variant uppercase font-headline ml-1">{suffix}</span>}
    </div>
  );
}

function ExerciseRow({ ex, index, programId, editMode, onDelete, onUpdated, dragHandleRef }) {
  const ref = useSwipeToDelete(onDelete);
  const handleRef = useRef(null);
  const colors = getMuscleColor(ex.muscle_group);

  useEffect(() => {
    const el = handleRef.current;
    if (!el || !dragHandleRef) return;
    dragHandleRef(el);
    return () => dragHandleRef(null);
  }, [dragHandleRef]);
  const [expanded, setExpanded] = useState(false);
  const [sets, setSets] = useState(ex.default_sets);
  const [reps, setReps] = useState(ex.default_reps || 0);
  const [weight, setWeight] = useState(ex.default_weight_kg || 0);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/programs/${programId}/exercises/${ex.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_sets: sets, default_weight_kg: weight, default_reps: reps }),
      });
      if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
      onUpdated(ex.id, { default_sets: sets, default_weight_kg: weight, default_reps: reps });
      setExpanded(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update exercise.');
    } finally {
      setSaving(false);
    }
  }

  if (!editMode) {
    return (
      <div className="bg-surface-container-low mb-2 p-3 flex items-center gap-3">
        <span className="text-[10px] text-on-surface-variant font-bold font-headline w-4">{index + 1}</span>
        <div className="flex-1">
          <span className={`${colors.bg} ${colors.text} text-[9px] font-bold px-1.5 py-0.5 uppercase mb-1 inline-block font-headline`}>
            {ex.muscle_group || 'General'}
          </span>
          <p className="text-sm font-black text-white uppercase font-headline tracking-tight">{ex.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-on-surface-variant uppercase font-headline">Default</p>
          <p className="text-sm font-bold text-white font-body">
            {ex.default_sets}<span className="text-[9px] text-on-surface-variant ml-1">sets</span>
          </p>
          {ex.default_reps > 0 && (
            <p className="text-sm font-bold text-white font-body">
              {ex.default_reps}<span className="text-[9px] text-on-surface-variant ml-1">reps</span>
            </p>
          )}
          {ex.default_weight_kg > 0 && (
            <p className="text-sm font-bold text-white font-body">
              {ex.default_weight_kg}<span className="text-[9px] text-on-surface-variant ml-1">kg</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-2 overflow-hidden">
      <div className="absolute inset-0 bg-[#d93025] flex items-center justify-end pr-4">
        <span className="material-symbols-outlined text-on-error">delete</span>
      </div>
      <div className="relative bg-surface-container-low">
        <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded((e) => !e)}>
          <span
            ref={handleRef}
            data-drag-handle
            className="material-symbols-outlined text-on-surface-variant touch-none cursor-grab select-none flex items-center justify-center"
            style={{ WebkitUserSelect: 'none', userSelect: 'none', fontSize: '1.5rem', padding: '8px', margin: '-8px', marginRight: '4px' }}
          >drag_indicator</span>
          <div className="flex-1 flex items-center gap-3">
            <div ref={ref} className="flex-1 flex items-center gap-3">
            <span className={`${colors.bg} ${colors.text} text-[9px] font-bold px-1.5 py-0.5 uppercase mb-1 inline-block font-headline`}>
              {ex.muscle_group || 'General'}
            </span>
            <p className="text-sm font-black text-white uppercase font-headline tracking-tight">{ex.name}</p>
          </div>
          <div className="text-right mr-2">
            <p className="text-[9px] text-on-surface-variant uppercase font-headline">Default</p>
            <p className="text-sm font-bold text-white font-body">
              {sets}<span className="text-[9px] text-on-surface-variant ml-1">sets</span>
            </p>
            {reps > 0 && (
              <p className="text-sm font-bold text-white font-body">
                {reps}<span className="text-[9px] text-on-surface-variant ml-1">reps</span>
              </p>
            )}
            {weight > 0 && (
              <p className="text-sm font-bold text-white font-body">
                {weight}<span className="text-[9px] text-on-surface-variant ml-1">kg</span>
              </p>
            )}
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="px-3 pb-3 border-t border-outline-variant/10 pt-3 space-y-3">
            <Stepper label="Default sets" value={sets} onDec={() => setSets((s) => Math.max(1, s - 1))} onInc={() => setSets((s) => s + 1)} />
            <Stepper label="Default reps" value={reps} onDec={() => setReps((r) => Math.max(0, r - 1))} onInc={() => setReps((r) => r + 1)} />
            <Stepper label="Default weight" value={weight}
              onDec={() => setWeight((w) => Math.max(0, parseFloat((w - 2.5).toFixed(1))))}
              onInc={() => setWeight((w) => parseFloat((w + 2.5).toFixed(1)))}
              suffix="KG" />
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving}
                className="bg-emerald-600 px-4 py-2 hover:bg-emerald-700 transition-colors disabled:opacity-50">
                <span className="text-white text-xs font-black tracking-widest font-headline uppercase">
                  {saving ? '...' : 'Save'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddExercisePanel({ programId, existingIds, onAdded }) {
  const [allExercises, setAllExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [defaultSets, setDefaultSets] = useState(3);
  const [defaultReps, setDefaultReps] = useState(10);
  const [defaultWeight, setDefaultWeight] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/exercises')
      .then((r) => r.json())
      .then((list) => setAllExercises(Array.isArray(list) ? list : []));
  }, []);

  const filtered = allExercises
    .filter((e) => !existingIds.has(e.id))
    .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  const selected = allExercises.find((e) => e.id === selectedId);

  async function handleAdd() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/programs/${programId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          exercise_id: selectedId,
          default_sets: defaultSets,
          default_reps: defaultReps,
          default_weight_kg: defaultWeight,
          order: 99,
        }),
      });
      if (!res.ok) throw new Error(`POST failed: ${res.status}`);
      const data = await res.json();
      onAdded({
        id: data.id,
        name: selected.name,
        exercise_id: selectedId,
        muscle_group: selected.muscle_group,
        default_sets: defaultSets,
        default_reps: defaultReps,
        default_weight_kg: defaultWeight,
        order: 99,
      });
      setSelectedId('');
      setSearch('');
      setDefaultSets(3);
      setDefaultReps(10);
      setDefaultWeight(0);
    } catch (err) {
      console.error(err);
      alert('Failed to add exercise.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-container-low p-4 mt-4">
      <p className="text-[10px] text-on-surface-variant uppercase font-bold font-headline mb-3">Add Exercise</p>

      <div className="bg-surface-container border-b border-outline focus-within:border-[#0e639c] transition-colors px-3 py-2 mb-3">
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedId(''); }}
          className="w-full bg-transparent text-white text-base font-body outline-none placeholder:text-on-surface-variant/40"
        />
      </div>

      {search && !selectedId && (
        <div className="mb-3 max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-on-surface-variant text-xs font-body px-1">No matches.</p>
          )}
          {filtered.map((ex) => {
            const colors = getMuscleColor(ex.muscle_group);
            return (
              <button key={ex.id} onClick={() => { setSelectedId(ex.id); setSearch(ex.name); }}
                className="w-full text-left p-2 hover:bg-surface-container transition-colors flex items-center gap-2">
                <span className={`${colors.bg} ${colors.text} text-[9px] font-bold px-1.5 py-0.5 uppercase font-headline`}>
                  {ex.muscle_group || 'General'}
                </span>
                <span className="text-sm font-black text-white uppercase font-headline tracking-tight">{ex.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {selectedId && (
        <div className="mt-2 space-y-3">
          <Stepper label="Default sets" value={defaultSets} onDec={() => setDefaultSets((s) => Math.max(1, s - 1))} onInc={() => setDefaultSets((s) => s + 1)} />
          <Stepper label="Default reps" value={defaultReps} onDec={() => setDefaultReps((r) => Math.max(0, r - 1))} onInc={() => setDefaultReps((r) => r + 1)} />
          <Stepper label="Default weight" value={defaultWeight}
            onDec={() => setDefaultWeight((w) => Math.max(0, parseFloat((w - 2.5).toFixed(1))))}
            onInc={() => setDefaultWeight((w) => parseFloat((w + 2.5).toFixed(1)))}
            suffix="KG" />
          <div className="flex justify-end">
            <button onClick={handleAdd} disabled={saving}
              className="bg-emerald-600 px-4 py-2 flex items-center gap-1 hover:bg-emerald-700 transition-colors disabled:opacity-50">
              <span className="text-white text-xs font-black tracking-widest font-headline uppercase">
                {saving ? '...' : 'Add'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProgramDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/programs/${id}`).then((r) => r.json()),
      fetch(`/api/programs/${id}/exercises`).then((r) => r.json()),
    ])
      .then(([prog, exList]) => {
        setProgram(prog);
        setExercises(Array.isArray(exList) ? exList : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDeleteExercise(exerciseRowId) {
    try {
      const res = await fetch(`/api/programs/${id}/exercises/${exerciseRowId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
      setExercises((prev) => prev.filter((e) => e.id !== exerciseRowId));
    } catch (err) {
      console.error(err);
      alert('Failed to remove exercise.');
    }
  }

  function handleExerciseUpdated(exerciseRowId, changes) {
    setExercises((prev) => prev.map((e) => (e.id === exerciseRowId ? { ...e, ...changes } : e)));
  }

  async function handleDeleteProgram() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
      navigate('/plans');
    } catch (err) {
      console.error(err);
      alert('Failed to delete program.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  function handleExerciseAdded(newEx) {
    setExercises((prev) => [...prev, newEx]);
  }

  async function handleReorder() {
    try {
      await fetch(`/api/programs/${id}/exercises/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: exercises.map((e) => e.id) }),
      });
    } catch (err) {
      console.error('Reorder failed', err);
    }
  }

  const { listRef, getHandleRef } = useDragReorder(exercises, setExercises, handleReorder);

  const existingExerciseIds = new Set(exercises.map((e) => e.exercise_id));

  if (loading) {
    return (
      <main className="pb-24 px-4 max-w-7xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
        <p className="text-on-surface-variant text-sm font-body">Loading...</p>
      </main>
    );
  }

  if (!program) {
    return (
      <main className="pb-24 px-4 max-w-7xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
        <p className="text-on-surface-variant text-sm font-body">Program not found.</p>
      </main>
    );
  }

  return (
    <main className="pb-24 px-4 max-w-7xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/plans', { state: { tab: 'PROGRAMS' } })}
          className="w-8 h-8 border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">arrow_back</span>
        </button>
        <div className="flex-1">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold font-headline">Program</p>
          <h1 className="text-3xl font-headline font-black tracking-tighter uppercase text-white">{program.name}</h1>
        </div>
        <button onClick={() => setEditMode((e) => !e)}
          className={`w-8 h-8 border flex items-center justify-center transition-colors ${
            editMode ? 'border-[#0e639c] bg-[#0e639c]/10' : 'border-outline-variant/30 hover:bg-surface-container'
          }`}>
          <span className="material-symbols-outlined text-sm text-on-surface-variant">
            {editMode ? 'check' : 'edit'}
          </span>
        </button>
      </div>

      <div className="bg-surface-container-low p-3 mb-4">
        <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">Exercises</p>
        <p className="text-xl font-black text-white font-body tracking-tighter">{exercises.length}</p>
      </div>

      {editMode && (
        <p className="text-[10px] text-on-surface-variant font-headline uppercase mb-3">
          Tap exercise to edit defaults — swipe left to remove
        </p>
      )}

      {exercises.length === 0 && (
        <p className="text-on-surface-variant text-sm font-body mb-4">No exercises yet.</p>
      )}

      <div ref={listRef}>
        {exercises.map((ex, i) => (
          <div key={ex.id} data-exercise-row="">
            <ExerciseRow
              ex={ex}
              index={i}
              programId={id}
              editMode={editMode}
              dragHandleRef={editMode ? getHandleRef(i) : null}
              onDelete={() => handleDeleteExercise(ex.id)}
              onUpdated={handleExerciseUpdated}
            />
          </div>
        ))}
      </div>

      {editMode && (
        <AddExercisePanel programId={id} existingIds={existingExerciseIds} onAdded={handleExerciseAdded} />
      )}

      {editMode && (
        <div className="mt-6">
          {confirmDelete ? (
            <div className="bg-surface-container-low p-4">
              <p className="text-sm text-white font-body mb-4">
                Delete <span className="font-bold">{program.name}</span>? This cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDeleteProgram} disabled={deleting}
                  className="bg-error py-3 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50">
                  <span className="text-on-error text-sm font-black tracking-[0.2em] font-headline uppercase">
                    {deleting ? 'Deleting...' : 'Delete'}
                  </span>
                </button>
                <button onClick={() => setConfirmDelete(false)} disabled={deleting}
                  className="border border-outline-variant/30 py-3 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-50">
                  <span className="text-on-surface-variant text-sm font-black tracking-[0.2em] font-headline uppercase">Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full border border-error/30 py-3 flex items-center justify-center gap-2 hover:bg-error/10 transition-colors">
              <span className="material-symbols-outlined text-error/70 text-sm">delete</span>
              <span className="text-error/70 text-sm font-black tracking-[0.2em] font-headline uppercase">Delete Program</span>
            </button>
          )}
        </div>
      )}
    </main>
  );
}