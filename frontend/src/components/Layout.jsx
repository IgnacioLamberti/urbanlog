import { Outlet, NavLink } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import { useCurrentUser } from '../hooks/useCurrentUser'

const baseNavItems = [
  { to: '/', label: 'Dashboard', icon: '▦', exact: true },
  { to: '/map', label: 'Mapa', icon: '◎' },
  { to: '/incidents', label: 'Incidentes', icon: '◈' },
  { to: '/incidents/new', label: 'Nuevo Reporte', icon: '+' },
]

const roleNavItems = {
  moderator: [{ to: '/moderation', label: 'Moderación', icon: '✓' }],
  operator: [],
  admin: [
    { to: '/moderation', label: 'Moderación', icon: '✓' },
    { to: '/admin/users', label: 'Usuarios', icon: '☺' },
  ],
}

export default function Layout() {
  const { signOut } = useClerk()
  const { data: user } = useCurrentUser()

  const navItems = [...baseNavItems, ...(roleNavItems[user?.role] || [])]

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0f1e' }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col" style={{
        background: '#0d1117',
        borderRight: '1px solid #1f2937'
      }}>
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: '#1f2937' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
              UL
            </div>
            <div>
              <p className="font-bold text-white text-sm tracking-wide">UrbanLog</p>
              <p className="text-xs" style={{ color: '#4b5563' }}>Sistema de Incidentes</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))',
                border: '1px solid rgba(14,165,233,0.2)',
                color: '#38bdf8'
              } : {}}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t" style={{ borderColor: '#1f2937' }}>
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
              {user?.imageUrl ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs truncate capitalize" style={{ color: '#4b5563' }}>{user?.role}</p>
            </div>
          </div>
          <button onClick={() => signOut({ redirectUrl: '/login' })} className="w-full btn-secondary text-xs py-2">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
