import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Moon, CalendarDays, Utensils, Activity } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/sleep', icon: Moon, label: 'Sleep' },
  { to: '/daily', icon: CalendarDays, label: 'Journal' },
  { to: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { to: '/habits', icon: Activity, label: 'Habits' },
]

function SidebarLink({ to, icon: Icon, label }: { to: string; icon: typeof LayoutDashboard; label: string }) {
  const location = useLocation()
  const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: '8px',
        fontSize: '13px', fontWeight: active ? 500 : 400,
        color: active ? '#f0f0f2' : '#5a5a66',
        backgroundColor: active ? '#1a1a24' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
      }}
    >
      <Icon size={16} strokeWidth={active ? 2 : 1.5} />
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100vh', width: '220px',
      backgroundColor: '#0c0c10', borderRight: '1px solid #1a1a24',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Brand */}
      <div style={{ padding: '28px 24px 24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Theseus
        </div>
        <div style={{ fontSize: '11px', color: '#5a5a66', marginTop: '4px', letterSpacing: '0.04em' }}>
          Board by board
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {links.map(({ to, icon, label }) => (
          <SidebarLink key={to} to={to} icon={icon} label={label} />
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 24px', fontSize: '10px', color: '#33333f', letterSpacing: '0.02em' }}>
        v0.1.0
      </div>
    </aside>
  )
}
