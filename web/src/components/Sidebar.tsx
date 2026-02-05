import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Moon, CalendarDays, Utensils, Activity } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/sleep', icon: Moon, label: 'Sleep' },
  { to: '/daily', icon: CalendarDays, label: 'Daily' },
  { to: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { to: '/habits', icon: Activity, label: 'Habits' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-bg-secondary border-r border-border-default flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border-default">
        <h1 className="text-xl font-bold tracking-tight text-accent">
          ⛵ Theseus
        </h1>
        <p className="text-xs mt-1 text-text-muted">
          Brick by brick
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-white hover:bg-bg-card'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border-default text-xs text-text-muted">
        v0.1.0 — Replace yourself
      </div>
    </aside>
  )
}
