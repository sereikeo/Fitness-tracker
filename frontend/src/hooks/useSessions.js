const API_BASE = '';

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function transformSession(raw) {
  return {
    id: raw.date,
    tag: 'STRENGTH',
    name: raw.muscle_groups?.length
      ? raw.muscle_groups.join(' + ')
      : raw.day + ' Session',
    date: formatDate(raw.date),
    totalVolumeKg: Math.round(raw.total_volume_kg),
    avgHrBpm: 0,
    exercises: raw.muscle_groups?.join(', ') || '',
  };
}

function transformSessionDetail(dateStr, rawExercises) {
  const totalVolume = rawExercises.reduce(
    (acc, ex) => acc + ex.sets * ex.reps * ex.weight_kg,
    0
  );
  const totalSets = rawExercises.reduce((acc, ex) => acc + ex.sets, 0);

  const volumeByMuscle = {};
  rawExercises.forEach((ex) => {
    const muscle = ex.muscle_group || 'General';
    const vol = ex.sets * ex.reps * ex.weight_kg;
    volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + vol;
  });
  const loadDistribution = Object.entries(volumeByMuscle)
    .map(([muscle, vol]) => ({
      muscle: muscle.toUpperCase(),
      pct: totalVolume > 0 ? Math.round((vol / totalVolume) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  const exerciseMap = {};
  rawExercises.forEach((ex) => {
    if (!exerciseMap[ex.exercise]) {
      exerciseMap[ex.exercise] = {
        id: ex.exercise.toLowerCase().replace(/\s+/g, '-'),
        name: ex.exercise,
        tag: 'Exercise',
        sets: [],
      };
    }
    for (let i = 0; i < ex.sets; i++) {
      exerciseMap[ex.exercise].sets.push({
        weight: ex.weight_kg,
        reps: ex.reps,
      });
    }
  });

  return {
    id: dateStr,
    date: formatDate(dateStr),
    tag: 'STRENGTH',
    totalVolumeKg: Math.round(totalVolume),
    setsDone: totalSets,
    loadDistribution,
    exercises: Object.values(exerciseMap),
  };
}

export async function fetchSessions(limit = 20) {
  const res = await fetch(`${API_BASE}/api/sessions?limit=${limit}`);
  if (!res.ok) throw new Error(`fetchSessions failed: ${res.status}`);
  const data = await res.json();
  return data.map(transformSession);
}

export async function fetchSessionDetail(dateStr) {
  const res = await fetch(`${API_BASE}/api/sessions/${dateStr}`);
  if (!res.ok) throw new Error(`fetchSessionDetail failed: ${res.status}`);
  const data = await res.json();
  return transformSessionDetail(dateStr, data);
}