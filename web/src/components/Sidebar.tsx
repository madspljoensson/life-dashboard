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
    <aside className="fixed left-0 top-0 h-screen w-64 border-r flex flex-col"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
      
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
          ⛵ Theseus
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
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
                  ? 'text-white'
                  : 'hover:text-white'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? 'white' : 'var(--text-secondary)',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        v0.1.0 — Replace yourself
      </div>
    </aside>
  )
}
