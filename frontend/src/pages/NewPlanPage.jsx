import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/*
 * NewPlanPage
 *
 * Endpoints:
 *   programs  <- GET /api/programs → [{ id, name }]
 *   onSave    -> POST /api/plans   ← { name, program_id, day }
 */

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function NewPlanPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [planName, setPlanName] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedDay, setSelectedDay] = useState(null); // single day index
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/programs')
      .then((r) => r.json())
      .then((data) => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function toggleDay(index) {
    setSelectedDay((prev) => (prev === index ? null : index));
  }

  async function handleSave() {
    if (!planName.trim() || !selectedProgram || selectedDay === null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName.trim(),
          program_id: selectedProgram,
          day: DAY_FULL[selectedDay],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      navigate('/plans');
    } catch (e) {
      setError('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const canSave =
    planName.trim().length > 0 && selectedProgram !== '' && selectedDay !== null;

  return (
    <main
      className="pb-24 px-4 max-w-7xl mx-auto"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white">
          New Plan
        </h1>
      </div>

      {/* Plan name */}
      <div className="bg-surface-container-low p-4 mb-4">
        <p className="text-[10px] text-[#0e639c] font-bold tracking-tighter mb-3 uppercase font-headline">
          Plan Name
        </p>
        <div className="border-b-2 border-outline focus-within:border-[#0e639c] transition-colors pb-1">
          <input
            type="text"
            placeholder="Enter plan title..."
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-full bg-transparent text-white text-base font-bold font-body outline-none placeholder:text-on-surface-variant/40"
          />
        </div>
      </div>

      {/* Select program */}
      <div className="bg-surface-container-low p-4 mb-4">
        <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-3">
          Select Program
        </p>
        {programs.length === 0 && (
          <p className="text-on-surface-variant text-sm font-body">
            No programs yet. Create a program first.
          </p>
        )}
        <div className="flex flex-col gap-1">
          {programs.map((prog) => (
            <button
              key={prog.id}
              onClick={() => setSelectedProgram(prog.id)}
              className={`flex items-center justify-between p-3 transition-colors ${
                selectedProgram === prog.id
                  ? 'bg-[#0e639c]/10 border-l-2 border-[#0e639c]'
                  : 'bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              <span
                className={`text-sm font-bold font-headline uppercase tracking-tight ${
                  selectedProgram === prog.id ? 'text-[#0e639c]' : 'text-white'
                }`}
              >
                {prog.name}
              </span>
              {selectedProgram === prog.id && (
                <span className="material-symbols-outlined text-[#0e639c] text-sm">check</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Select day — single selection */}
      <div className="bg-surface-container-low p-4 mb-6">
        <p className="text-[10px] text-on-surface-variant font-bold uppercase font-headline mb-3">
          Select Day
        </p>
        <div className="flex gap-2">
          {DAYS.map((day, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={`flex-1 py-2 text-xs font-black font-headline uppercase tracking-tight transition-colors ${
                selectedDay === i
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        {selectedDay !== null && (
          <p className="text-[9px] text-on-surface-variant uppercase font-headline mt-2">
            {DAY_LABELS[selectedDay]}
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm font-body mb-4">{error}</p>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className={`w-full py-3 flex items-center justify-center gap-2 transition-colors ${
          canSave && !saving
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : 'bg-surface-container-highest cursor-not-allowed'
        }`}
      >
        <span
          className={`text-sm font-black tracking-[0.2em] font-headline uppercase ${
            canSave && !saving ? 'text-white' : 'text-on-surface-variant'
          }`}
        >
          {saving ? 'Saving...' : 'Save Plan'}
        </span>
        {canSave && !saving && (
          <span className="material-symbols-outlined text-white text-sm">check</span>
        )}
      </button>
    </main>
  );
}
