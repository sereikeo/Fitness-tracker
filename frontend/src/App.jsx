import { Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';

// ---------------------------------------------------------------------------
// Existing pages — kept until rebuilt with new UI
// ---------------------------------------------------------------------------
import RoutinesPage from './pages/RoutinesPage';
import LogPage from './pages/LogPage';
import SessionPage from './pages/SessionPage';
import OneRMCalcPage from './pages/OneRMCalcPage';
import WorkoutsPage from './pages/WorkoutsPage';
import PlansPage from './pages/PlansPage';
import WorkoutSummaryPage from './pages/WorkoutSummaryPage';
import NewPlanPage from './pages/NewPlanPage';
import NewProgramPage from './pages/NewProgramPage';
import PlanDetailPage from './pages/PlanDetailPage';
import ProgramDetailPage from './pages/ProgramDetailPage';

// ---------------------------------------------------------------------------
// Placeholder pages — replace with real components as they are built
// ---------------------------------------------------------------------------
function PlaceholderPage({ title }) {
  return (
    <main className="pt-12 pb-24 px-4">
      <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white mb-4">
        {title}
      </h1>
      <p className="text-on-surface-variant text-sm font-body">Coming soon.</p>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Layout shell — BottomNav persists across all routes
// ---------------------------------------------------------------------------
function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary/30">
      {children}
      <BottomNav />
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <Layout>
      <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workouts/active" element={<WorkoutsPage />} />
          <Route path="/workouts/:id" element={<WorkoutSummaryPage />} />
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/plans/new" element={<NewPlanPage />} />
          <Route path="/plans/:id" element={<PlanDetailPage />} />
          <Route path="/plans/programs/new" element={<NewProgramPage />} />
          <Route path="/plans/programs/:id" element={<ProgramDetailPage />} />
          <Route path="/1rm-calc" element={<OneRMCalcPage />} />

          {/* Legacy routes — remove as pages are rebuilt */}
          <Route path="/log" element={<LogPage />} />
          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="/session/:date" element={<SessionPage />} />
        </Routes>
    </Layout>
  );
}
