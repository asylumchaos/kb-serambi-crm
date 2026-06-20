import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { StatCard, Spinner } from '../../components/ui'
import { Users, UserCheck, TrendingUp, CheckCircle, FolderKanban, Banknote, Clock, AlertCircle } from 'lucide-react'

const PIPELINE = ['new','contacted','interested','viewing','negotiating','booked','sold','lost']
const PIPELINE_LABELS = {
  new:'Baru', contacted:'Dihubungi', interested:'Berminat', viewing:'Lawatan',
  negotiating:'Rundingan', booked:'Ditempah', sold:'Dijual', lost:'Hilang'
}
const PIPE_COLORS = {
  new:'bg-blue-500', contacted:'bg-cyan-500', interested:'bg-yellow-500',
  viewing:'bg-purple-500', negotiating:'bg-orange-500', booked:'bg-indigo-500',
  sold:'bg-emerald-500', lost:'bg-red-500'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [pipeline, setPipeline] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [todayFollowups, setTodayFollowups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const today = new Date().toISOString().slice(0,10)

    const [
      { count: totalLeads },
      { count: newLeads },
      { count: interestedLeads },
      { count: soldLeads },
      { count: totalAgents },
      { data: commData },
      { data: pipeData },
      { data: recent },
      { data: followups },
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status','new'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status','interested'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status','sold'),
      supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status','active'),
      supabase.from('commissions').select('commission_amount, payment_status'),
      supabase.from('leads').select('status'),
      supabase.from('leads').select('id, client_name, phone, status, created_at, projects(name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('followups').select('id, followup_date, method, leads(client_name), agents(name)').eq('followup_date', today).eq('outcome','pending'),
    ])

    const totalComm = (commData ?? []).reduce((s, r) => s + Number(r.commission_amount), 0)
    const pipeMap = {}
    for (const s of PIPELINE) pipeMap[s] = 0
    for (const r of pipeData ?? []) pipeMap[r.status] = (pipeMap[r.status] ?? 0) + 1

    setStats({ totalLeads, newLeads, interestedLeads, soldLeads, totalAgents, totalComm })
    setPipeline(PIPELINE.map(s => ({ status: s, count: pipeMap[s] })))
    setRecentLeads(recent ?? [])
    setTodayFollowups(followups ?? [])
    setLoading(false)
  }

  if (loading) return <Spinner />

  const maxPipe = Math.max(...pipeline.map(p => p.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gambaran keseluruhan sistem CRM</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Jumlah Lead" value={stats.totalLeads} icon={Users} color="blue" />
        <StatCard label="Lead Baru" value={stats.newLeads} icon={AlertCircle} color="cyan" />
        <StatCard label="Berminat" value={stats.interestedLeads} icon={TrendingUp} color="gold" />
        <StatCard label="Dijual" value={stats.soldLeads} icon={CheckCircle} color="green" />
        <StatCard label="Ejen Aktif" value={stats.totalAgents} icon={UserCheck} color="purple" />
        <StatCard
          label="Jumlah Komisyen"
          value={`RM ${stats.totalComm.toLocaleString('ms-MY', { minimumFractionDigits: 0 })}`}
          icon={Banknote}
          color="gold"
        />
      </div>

      {/* Pipeline */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Pipeline Lead</h2>
        <div className="space-y-2.5">
          {pipeline.map(({ status, count }) => (
            <div key={status} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-24 flex-shrink-0">{PIPELINE_LABELS[status]}</span>
              <div className="flex-1 bg-navy-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${PIPE_COLORS[status]}`}
                  style={{ width: `${(count / maxPipe) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-200 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent leads */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Lead Terkini</h2>
          {recentLeads.length === 0
            ? <p className="text-sm text-gray-500 text-center py-6">Tiada lead</p>
            : <div className="space-y-2">
                {recentLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between py-2 border-b border-navy-700/60 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{lead.client_name}</p>
                      <p className="text-xs text-gray-400">{lead.projects?.name ?? '—'}</p>
                    </div>
                    <span className={`badge text-xs ${
                      lead.status === 'new' ? 'bg-blue-500/15 text-blue-300' :
                      lead.status === 'sold' ? 'bg-emerald-500/15 text-emerald-300' :
                      'bg-yellow-500/15 text-yellow-300'
                    }`}>{PIPELINE_LABELS[lead.status] ?? lead.status}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Today followups */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Followup Hari Ini</h2>
            <span className="badge bg-gold-500/15 text-gold-300">{todayFollowups.length}</span>
          </div>
          {todayFollowups.length === 0
            ? <p className="text-sm text-gray-500 text-center py-6">Tiada followup hari ini</p>
            : <div className="space-y-2">
                {todayFollowups.map(f => (
                  <div key={f.id} className="flex items-start gap-3 py-2 border-b border-navy-700/60 last:border-0">
                    <div className="w-7 h-7 bg-gold-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{f.leads?.client_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{f.agents?.name ?? '—'} · {f.method}</p>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}
