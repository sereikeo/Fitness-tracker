import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/',         label: 'HOME',     icon: 'home'         },
  { to: '/workouts', label: 'WORKOUTS', icon: 'fitness_center'},
  { to: '/plans',    label: 'PLANS',    icon: 'event_note'   },
  { to: '/1rm-calc', label: '1RM CALC', icon: 'calculate'    },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-[#131313] bg-opacity-90 backdrop-blur-xl border-t border-white/5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-3 px-4 h-16 flex-1 transition-all duration-150 active:scale-95 ${
              isActive ? 'text-[#0e639c] bg-white/5' : 'text-white/40 hover:text-white'
            }`
          }
        >
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
          <span className="font-['Space_Grotesk'] text-[10px] font-bold tracking-widest uppercase mt-1">
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
