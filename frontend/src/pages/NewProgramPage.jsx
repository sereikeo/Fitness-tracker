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

function getMuscleColor(mg) {
  return MUSCLE_COLORS[mg] ?? DEFAULT_MUSCLE_COLOR;
}

function ExerciseEntry({ index, entry, allExercises, usedIds, onChange, onRemove }) {
  const [search, setSearch] = useState(entry.name || '');
  const [showResults, setShowResults] = useState(false);

  const filtered = allExercises
    .filter((e) => !usedIds.has(e.id) || e.id === entry.exerciseId)
    .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  function selectExercise(ex) {
    setSearch(ex.name);
    setShowResults(false);
    onChange(index, { ...entry, exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscle_group });
  }

  return (
    <div className="bg-surface-container mb-3 p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-on-surface-variant font-headline w-5 text-right shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 relative">
          <div className="bg-surface-container-low border-b border-outline focus-within:border-primary transition-colors px-2 py-1.5">
            <input
              type="text"
              placeholder="Search exercise..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowResults(true);
                if (!e.target.value) onChange(index, { ...entry, exerciseId: '', name: '', muscleGroup: '' });
              }}
              onFocus={() => setShowResults(true)}
              className="w-full bg-transparent text-white text-sm font-body outline-none placeholder:text-on-surface-variant/40"
            />
          </div>
          {showResults && search && !entry.exerciseId && (
            <div className="absolute z-10 left-0 right-0 bg-surface-container-high max-h-40 overflow-y-auto border border-outline-variant/30">
              {filtered.length === 0 && (
                <p className="text-on-surface-variant text-xs font-body px-3 py-2">No matches.</p>
              )}
              {filtered.map((ex) => {
                const colors = getMuscleColor(ex.muscle_group);
                return (
                  <button
                    key={ex.id}
                    onClick={() => selectExercise(ex)}
                    className="w-full text-left px-3 py-2 hover:bg-surface-container transition-colors flex items-center gap-2"
                  >
                    <span className={`${colors.bg} ${colors.text} text-[9px] font-bold px-1.5 py-0.5 uppercase font-headline shrink-0`}>
                      {ex.muscle_group || 'General'}
                    </span>
                    <span className="text-sm font-black text-white uppercase font-headline tracking-tight">{ex.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(index)}
          className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {entry.exerciseId && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-7">
          {/* Sets */}
          <div className="flex items-center gap-1">
            <p className="text-[9px] text-on-surface-variant uppercase font-headline mr-1">Sets</p>
            <button onClick={() => onChange(index, { ...entry, defaultSets: Math.max(1, entry.defaultSets - 1) })}
              className="w-6 h-6 border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-xs text-on-surface-variant">remove</span>
            </button>
            <span className="text-white font-bold font-body w-5 text-center text-sm">{entry.defaultSets}</span>
            <button onClick={() => onChange(index, { ...entry, defaultSets: entry.defaultSets + 1 })}
              className="w-6 h-6 border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-xs text-on-surface-variant">add</span>
            </button>
          </div>

          {/* Reps */}
          <div className="flex items-center gap-1">
            <p className="text-[9px] text-on-surface-variant uppercase font-headline mr-1">Reps</p>
            <button onClick={() => onChange(index, { ...entry, defaultReps: Math.max(0, entry.defaultReps - 1) })}
              className="w-6 h-6 border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-xs text-on-surface-variant">remove</span>
            </button>
            <span className="text-white font-bold font-body w-5 text-center text-sm">{entry.defaultReps}</span>
            <button onClick={() => onChange(index, { ...entry, defaultReps: entry.defaultReps + 1 })}
              className="w-6 h-6 border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-xs text-on-surface-variant">add</span>
            </button>
          </div>

          {/* Weight */}
          <div className="flex items-center gap-1">
            <p className="text-[9px] text-on-surface-variant uppercase font-headline mr-1">Weight</p>
            <button onClick={() => onChange(index, { ...entry, defaultWeight: Math.max(0, parseFloat((entry.defaultWeight - 2.5).toFixed(1))) })}
              className="w-6 h-6 border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-xs text-on-surface-variant">remove</span>
            </button>
            <span className="text-white font-bold font-body w-10 text-center text-sm">{entry.defaultWeight}</span>
            <button onClick={() => onChange(index, { ...entry, defaultWeight: parseFloat((entry.defaultWeight + 2.5).toFixed(1)) })}
              className="w-6 h-6 border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-xs text-on-surface-variant">add</span>
            </button>
            <span className="text-[9px] text-on-surface-variant uppercase font-headline ml-1">KG</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewProgramPage() {
  const navigate = useNavigate();
  const [allExercises, setAllExercises] = useState([]);
  const [programName, setProgramName] = useState('');
  const [entries, setEntries] = useState([{ exerciseId: '', name: '', muscleGroup: '', defaultSets: 3, defaultReps: 10, defaultWeight: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/exercises')
      .then((r) => r.json())
      .then((data) => setAllExercises(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function handleChangeEntry(index, updated) {
    setEntries((prev) => prev.map((e, i) => (i === index ? updated : e)));
  }

  function handleRemoveEntry(index) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddEntry() {
    setEntries((prev) => [...prev, { exerciseId: '', name: '', muscleGroup: '', defaultSets: 3, defaultReps: 10, defaultWeight: 0 }]);
  }

  const usedIds = new Set(entries.map((e) => e.exerciseId).filter(Boolean));
  const filled = entries.filter((e) => e.exerciseId !== '');
  const canSave = programName.trim().length > 0 && filled.length > 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const programRes = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: programName.trim() }),
      });
      if (!programRes.ok) throw new Error(`HTTP ${programRes.status}`);
      const { id: programId } = await programRes.json();

      for (let i = 0; i < filled.length; i++) {
        const res = await fetch(`/api/programs/${programId}/exercises`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_id: programId,
            exercise_id: filled[i].exerciseId,
            default_sets: filled[i].defaultSets,
            default_reps: filled[i].defaultReps,
            default_weight_kg: filled[i].defaultWeight,
            order: i + 1,
          }),
        });
        if (!res.ok) throw new Error(`Failed to add exercise ${i + 1}: HTTP ${res.status}`);
      }

      navigate(`/plans/programs/${programId}`);
    } catch (e) {
      setError(e.message || 'Failed to save program. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="pb-24 px-4 max-w-7xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
      <div className="mb-6">
        <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white">New Program</h1>
      </div>

      <div className="bg-surface-container-low p-4 mb-4">
        <p className="text-[10px] text-primary font-bold tracking-tighter mb-3 uppercase font-headline">Program Name</p>
        <div className="border-b-2 border-outline focus-within:border-primary transition-colors pb-1">
          <input
            type="text"
            placeholder="Enter program title..."
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            className="w-full bg-transparent text-white text-base font-bold font-body outline-none placeholder:text-on-surface-variant/40"
          />
        </div>
      </div>

      <div className="bg-surface-container-low p-4 mb-4">
        <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-3">Exercises</p>
        {entries.map((entry, i) => (
          <ExerciseEntry
            key={i}
            index={i}
            entry={entry}
            allExercises={allExercises}
            usedIds={usedIds}
            onChange={handleChangeEntry}
            onRemove={handleRemoveEntry}
          />
        ))}
        <button
          onClick={handleAddEntry}
          className="w-full border border-outline-variant/30 py-2 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors mt-2"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-sm">add</span>
          <span className="text-on-surface-variant text-xs font-black tracking-[0.15em] font-headline uppercase">Add Exercise</span>
        </button>
      </div>

      {error && <p className="text-error text-sm font-body mb-4">{error}</p>}

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className={`w-full py-3 flex items-center justify-center gap-2 transition-colors ${
          canSave && !saving ? 'bg-primary hover:bg-primary-container' : 'bg-surface-container-highest cursor-not-allowed'
        }`}
      >
        <span className={`text-sm font-black tracking-[0.2em] font-headline uppercase ${canSave && !saving ? 'text-on-primary' : 'text-on-surface-variant'}`}>
          {saving ? 'Saving...' : 'Save Program'}
        </span>
        {canSave && !saving && <span className="material-symbols-outlined text-on-primary text-sm">check</span>}
      </button>
    </main>
  );
}