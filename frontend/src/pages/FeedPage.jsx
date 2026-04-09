import React, { useEffect, useState } from 'react';
import SessionCard from '../components/SessionCard';

export default function FeedPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scheduledSession, setScheduledSession] = useState(null);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(data => { setSessions(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });

    fetch('/api/schedule/today')
      .then(r => r.json())
      .then(data => {
        if (data) {
          fetch('/api/routines')
            .then(res => res.json())
            .then(routines => {
              const routine = routines.find(r => r.id === data.routine_id);
              setScheduledSession({ ...data, routineName: routine?.name || 'Today\'s workout' });
            });
        }
      })
      .catch(err => console.error('Failed to fetch scheduled session:', err));
  }, []);

  if (loading) return <p className="text-gray-400 mt-8 text-center">Loading...</p>;
  if (error) return <p className="text-red-400 mt-8 text-center">Error: {error}</p>;

  return (
    <div className="max-w-2xl mx-auto mt-6">
      {scheduledSession && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3">
          <h3 className="text-white font-medium mb-2">Scheduled Workout Today</h3>
          <p className="text-gray-400 text-sm mb-1">{scheduledSession.routineName}</p>
          <button
            onClick={() => window.location.href = `/log?routine_id=${scheduledSession.routine_id}&schedule_id=${scheduledSession.id}`}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Load workout
          </button>
        </div>
      )}
      {sessions.length === 0 ? (
        <p className="text-gray-400 mt-8 text-center">No sessions logged yet.</p>
      ) : (
        sessions.map(s => <SessionCard key={s.date} {...s} />)
      )}
    </div>
  );
}
