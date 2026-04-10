/**
 * useSessions
 *
 * Data access hooks — fetch and transform /api/sessions data
 * into the shape expected by HomePage and WorkoutSummaryPage.
 *
 * All API calls go through the VITE_API_URL env var.
 * Falls back to http://localhost:8000 for local dev.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Format a YYYY-MM-DD string to "Apr 7, 2026"
 */
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Transform a raw /api/sessions item into the shape
 * expected by WorkoutLogCard and ActivitiesTab in HomePage.
 */
function transformSession(raw) {
  return {
    id: raw.date,
    tag: 'STRENGTH',
    name: raw.muscle_groups?.length
      ? raw.muscle_groups.join(' + ')
      : raw.day + ' Session',
    date: formatDate(raw.date),
    durationMin: 60,
    totalVolumeKg: Math.round(raw.total_volume_kg),
    avgHrBpm: 0,
    exercises: raw.muscle_groups?.join(', ') || '',
  };
}

/**
 * Transform raw /api/sessions/{date} array into the shape
 * expected by WorkoutSummaryPage.
 */
function transformSessionDetail(dateStr, rawExercises) {
  const totalVolume = rawExercises.reduce(
    (acc, ex) => acc + ex.sets * ex.reps * ex.weight_kg,
    0
  );

  const totalSets = rawExercises.reduce((acc, ex) => acc + ex.sets, 0);

  // Group by muscle group for load distribution
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

  // Group rows by exercise name, expand sets
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
    // Expand sets: each row represents N identical sets
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
    day: new Date(dateStr).toLocaleDateString('en-AU', { weekday: 'long' }),
    tag: 'STRENGTH',
    durationMin: 60,
    totalVolumeKg: Math.round(totalVolume),
    setsDone: totalSets,
    intensityPct: 80,
    loadDistribution,
    exercises: Object.values(exerciseMap),
  };
}

/**
 * Fetch recent sessions list
 * Returns transformed array for HomePage recentLogs / activityLogs props
 */
export async function fetchSessions(limit = 20) {
  const res = await fetch(`${API_BASE}/api/sessions?limit=${limit}`);
  if (!res.ok) throw new Error(`fetchSessions failed: ${res.status}`);
  const data = await res.json();
  return data.map(transformSession);
}

/**
 * Fetch single session detail by date string YYYY-MM-DD
 * Returns transformed object for WorkoutSummaryPage session prop
 */
export async function fetchSessionDetail(dateStr) {
  const res = await fetch(`${API_BASE}/api/sessions/${dateStr}`);
  if (!res.ok) throw new Error(`fetchSessionDetail failed: ${res.status}`);
  const data = await res.json();
  return transformSessionDetail(dateStr, data);
}