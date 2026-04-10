import { useState } from 'react';
import { Link } from 'react-router-dom';

/*
 * PlansPage
 *
 * Two sub-tabs: PLANS and PROGRAMS
 *
 * Props (all optional — renders stub data when not provided):
 *   plans      {array}  - [{ id, name, muscleGroup, program, sets }]
 *   programs   {array}  - [{ id, name, exercises: [{ name }] }]
 *   onAddPlan  {fn}     - navigate to new plan form
 *   onAddProg  {fn}     - navigate to new program form
 *
 * Wiring targets:
 *   plans    <- GET /api/routines
 *   programs <- GET /api/routines/programs (or equivalent)
 */

const STUB_PLANS = [
  {
    id: '1',
    name: 'Upper Body',
    muscleGroup: 'STRENGTH',
    program: 'Upper Body',
    sets: '3 SETS × 5-6 REPS',
    sets2: '3 SETS × 5-6 REPS',
  },
  {
    id: '2',
    name: 'Lower Body',
    muscleGroup: 'STRENGTH',
    program: 'Lower Body',
    sets: '3 SETS × 5-6 REPS',
    sets2: '3 SETS × 8-10 REPS',
  },
];

const STUB_PROGRAMS = [
  {
    id: '1',
    name: 'Upper Body',
    exercises: [
      { name: 'Bench Press' },
      { name: 'Overhead Press' },
      { name: 'Lateral Raises' },
    ],
  },
  {
    id: '2',
    name: 'Legs',
    exercises: [
      { name: 'Squat' },
      { name: 'Leg Press' },
      { name: 'Calf Raises' },
    ],
  },
  {
    id: '3',
    name: 'Pull',
    exercises: [
      { name: 'Deadlift' },
      { name: 'Pull Ups' },
    ],
  },
];

const TABS = ['PLANS', 'PROGRAMS'];

function PlanCard({ plan }) {
  return (
    <div className="bg-surface-container-low p-4 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="bg-surface-container-highest text-secondary text-[9px] font-bold px-1.5 py-0.5 uppercase mb-2 inline-block font-headline">
            {plan.muscleGroup}
          </span>
          <h3 className="text-lg font-black text-white uppercase font-headline tracking-tight">
            {plan.name}
          </h3>
        </div>
        <Link
          to={`/plans/${plan.id}`}
          className="w-8 h-8 border border-outline-variant/30 flex items-center justify-center hover:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined text-sm text-on-surface-variant">
            chevron_right
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-container p-2">
          <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">
            Program
          </p>
          <p className="text-xs text-white font-bold font-body">{plan.program}</p>
          <p className="text-[9px] text-on-surface-variant font-body mt-0.5">{plan.sets}</p>
        </div>
        <div className="bg-surface-container p-2">
          <p className="text-[9px] text-on-surface-variant uppercase font-bold font-headline mb-1">
            Volume
          </p>
          <p className="text-xs text-white font-bold font-body">{plan.program}</p>
          <p className="text-[9px] text-on-surface-variant font-body mt-0.5">{plan.sets2}</p>
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ program }) {
  return (
    <div className="bg-surface-container-low p-4 mb-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-black text-white uppercase font-headline tracking-tight">
          {program.name}
        </h3>
        <Link
          to={`/plans/programs/${program.id}`}
          className="w-8 h-8 border border-outline-variant/30 flex items-center justify-center hover:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined text-sm text-on-surface-variant">
            chevron_right
          </span>
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        {program.exercises.map((ex, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1 h-1 bg-secondary" />
            <span className="text-xs text-on-surface-variant font-body">{ex.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlansPage({
  plans = STUB_PLANS,
  programs = STUB_PROGRAMS,
  onAddPlan,
  onAddProg,
}) {
  const [activeTab, setActiveTab] = useState('PLANS');

  return (
    <main
      className="pb-24 px-4 max-w-7xl mx-auto"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-5xl font-headline font-black tracking-tighter uppercase text-white">
          Plans
        </h1>
      </div>

      {/* Sub-nav tabs */}
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

      {/* Plans tab */}
      {activeTab === 'PLANS' && (
        <>
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}

          <button
            onClick={() => onAddPlan?.()}
            className="w-full border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors mt-2"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-sm">add</span>
            <span className="text-on-surface-variant text-sm font-black tracking-[0.2em] font-headline uppercase">
              Add New Plan
            </span>
          </button>
        </>
      )}

      {/* Programs tab */}
      {activeTab === 'PROGRAMS' && (
        <>
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}

          <button
            onClick={() => onAddProg?.()}
            className="w-full border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors mt-2"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-sm">add</span>
            <span className="text-on-surface-variant text-sm font-black tracking-[0.2em] font-headline uppercase">
              Add New Program
            </span>
          </button>
        </>
      )}
    </main>
  );
}