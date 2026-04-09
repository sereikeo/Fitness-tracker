import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoutinesPage() {
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [routineName, setRoutineName] = useState('');
  const [day, setDay] = useState('Monday');
  const [exerciseRows, setExerciseRows] = useState([{ exercise_id: '', muscle_group: '', default_sets: 3, order: 1 }]);
  const [scheduleRoutineId, setScheduleRoutineId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeks, setWeeks] = useState(6);
  const [routineError, setRoutineError] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);

  useEffect(() => {
    fetch('/api/exercises')
      .then(r => r.json())
      .then(data => setExercises(data))
      .catch(err => console.error('Failed to fetch exercises:', err));

    fetch('/api/routines')
      .then(r => r.json())
      .then(data => setRoutines(data))
      .catch(err => console.error('Failed to fetch routines:', err));
  }, []);

  const addExerciseRow = () => {
    setExerciseRows(prev => [...prev, { exercise_id: '', muscle_group: '', default_sets: 3, order: prev.length + 1 }]);
  };

  const removeExerciseRow = (index) => {
    setExerciseRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateExerciseRow = (index, field, value) => {
    setExerciseRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleRoutineSave = async () => {
    try {
      const routineResponse = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: routineName, day })
      });
      if (!routineResponse.ok) throw new Error(await routineResponse.text());
      const routineData = await routineResponse.json();
      const exercisePromises = exerciseRows.map((row, index) => fetch(`/api/routines/${routineData.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...row, order: index + 1 })
      }));
      await Promise.all(exercisePromises);
      setRoutineError('Routine saved successfully!');
    } catch (err) {
      setRoutineError(err.message);
    }
  };

  const handleSchedule = async () => {
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routine_id: scheduleRoutineId, start_date: startDate, weeks })
      });
      if (!response.ok) throw new Error(await response.text());
      setScheduleError('Schedule created successfully!');
    } catch (err) {
      setScheduleError(err.message);
    }
  };

if (exercises.length === 0) return <p className="text-gray-400 mt-8 text-center">Loading...</p>;
return (
  <div className="bg-gray-900 text-white min-h-screen p-4">
    <h2 className="text-white text-xl font-semibold mb-6">Routine Builder</h2>
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-1">Routine Name</label>
      <input
        type="text"
        value={routineName}
        onChange={e => setRoutineName(e.target.value)}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 w-full focus:outline-none focus:border-orange-500"
      />
    </div>
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-1">Day</label>
      <select
        value={day}
        onChange={e => setDay(e.target.value)}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 w-full focus:outline-none focus:border-orange-500"
      >
        <option value="Monday">Monday</option>
        <option value="Thursday">Thursday</option>
      </select>
    </div>
    <div className="mb-4">
      {exerciseRows.map((row, index) => (
        <div key={index} className="flex items-center mb-2">
          <select
            value={row.exercise_id}
            onChange={e => {
              const exercise = exercises.find(ex => ex.id === e.target.value);
              updateExerciseRow(index, 'exercise_id', e.target.value);
              updateExerciseRow(index, 'muscle_group', exercise?.muscle_group || '');
            }}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 w-full mr-2 focus:outline-none focus:border-orange-500"
          >
            <option value="">Select Exercise</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <input
            type="text"
            readOnly
            value={row.muscle_group}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 w-full mr-2 focus:outline-none focus:border-orange-500"
          />
          <input
            type="number"
            value={row.default_sets}
            onChange={e => updateExerciseRow(index, 'default_sets', parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 w-full mr-2 focus:outline-none focus:border-orange-500"
          />
          <input
            type="number"
            value={row.order}
            onChange={e => updateExerciseRow(index, 'order', parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 w-full mr-2 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={() => removeExerciseRow(index)}
            disabled={exerciseRows.length === 1}
            className="text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
    <button onClick={addExerciseRow} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded mb-4">
      + Add exercise
    </button>
    {routineError && <p className={`text-${routineError.includes('success') ? 'green' : 'red'}-400 text-sm mb-3`}>{routineError}</p>}
    <button onClick={handleRoutineSave} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded font-medium transition-colors">
      Save routine
    </button>

    <h2 className="text-white text-xl font-semibold mt-12 mb-6">Routine Scheduler</h2>
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-1">Select Routine</label>
      <select
        value={scheduleRoutineId}
        onChange={e => setScheduleRoutineId(e.target.value)}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 w-full focus:outline-none focus:border-orange-500"
      >
        <option value="">Select Routine</option>
        {routines.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
    </div>
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-1">Start Date</label>
      <input
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 w-full focus:outline-none focus:border-orange-500"
      />
    </div>
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-1">Number of Weeks</label>
      <input
        type="number"
        value={weeks}
        onChange={e => setWeeks(parseInt(e.target.value))}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 w-full focus:outline-none focus:border-orange-500"
      />
    </div>
    {scheduleError && <p className={`text-${scheduleError.includes('success') ? 'green' : 'red'}-400 text-sm mb-3`}>{scheduleError}</p>}
    <button onClick={handleSchedule} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded font-medium transition-colors">
      Schedule
    </button>
  </div>
);
}