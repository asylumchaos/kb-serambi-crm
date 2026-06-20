import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Users, CalendarDays, Banknote, LogOut, Building2, Menu } from 'lucide-react'

const nav = [
  { to: '/agent',            label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/agent/leads',      label: 'Lead Saya',  icon: Users },
  { to: '/agent/followups',  label: 'Followup',   icon: CalendarDays },
  { to: '/agent/commissions',label: 'Komisyen',   icon: Banknote },
]

export default function AgentLayout() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-navy-950">
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-60 bg-navy-900 border-r border-navy-700
        flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-navy-700">
          <div className="w-8 h-8 bg-gold-500/15 border border-gold-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-gold-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">KB Serambi</p>
            <p className="text-xs text-gold-400 truncate">Portal Ejen</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                 ${isActive ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20' : 'text-gray-400 hover:text-gray-100 hover:bg-navy-700/60'}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-navy-700 p-3">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 text-xs font-bold">
                {profile?.full_name?.[0]?.toUpperCase() ?? 'E'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'Ejen'}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            Log Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-navy-900 border-b border-navy-700">
          <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white">KB Serambi CRM</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
