import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { StatCard, StatusBadge, Spinner } from '../../components/ui'
import { Users, CalendarDays, Banknote, Clock, TrendingUp } from 'lucide-react'

export default function AgentDashboard() {
  const { user } = useAuth()
  const [agentId, setAgentId]   = useState(null)
  const [stats, setStats]       = useState(null)
  const [recentLeads, setRecentLeads] = useState([])
  const [todayFollowups, setTodayFollowups] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('agents').select('id').eq('profile_id', user.id).single()
      .then(({ data }) => {
        if (data) setAgentId(data.id)
        else setLoading(false)
      })
  }, [user])

  useEffect(() => {
    if (!agentId) return
    fetchData()
  }, [agentId])

  async function fetchData() {
    const today = new Date().toISOString().slice(0, 10)

    const [
      { count: totalLeads },
      { count: activeLeads },
      { count: soldLeads },
      { data: commData },
      { data: recent },
      { data: followups },
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('agent_id', agentId),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('agent_id', agentId).not('status', 'in', '("sold","lost")'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('agent_id', agentId).eq('status', 'sold'),
      supabase.from('commissions').select('commission_amount, payment_status').eq('agent_id', agentId),
      supabase.from('leads').select('id, client_name, status, projects(name)').eq('agent_id', agentId).order('created_at', { ascending: false }).limit(5),
      supabase.from('followups').select('id, followup_date, followup_time, method, leads(client_name)').eq('agent_id', agentId).eq('followup_date', today).eq('outcome', 'pending'),
    ])

    const totalComm  = (commData ?? []).reduce((s, c) => s + Number(c.commission_amount ?? 0), 0)
    const paidComm   = (commData ?? []).filter(c => c.payment_status === 'paid').reduce((s, c) => s + Number(c.commission_amount ?? 0), 0)

    setStats({ totalLeads, activeLeads, soldLeads, totalComm, paidComm })
    setRecentLeads(recent ?? [])
    setTodayFollowups(followups ?? [])
    setLoading(false)
  }

  if (loading) return <Spinner />

  const STATUS_LABELS = {
    new:'Baru', contacted:'Dihubungi', interested:'Berminat', viewing:'Lawatan',
    negotiating:'Rundingan', booked:'Ditempah', sold:'Dijual', lost:'Hilang'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard Saya</h1>
        <p className="text-gray-400 text-sm mt-0.5">Prestasi dan aktiviti anda</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Jumlah Lead" value={stats?.totalLeads ?? 0} icon={Users} color="blue" />
        <StatCard label="Lead Aktif" value={stats?.activeLeads ?? 0} icon={TrendingUp} color="gold" />
        <StatCard label="Jualan Berjaya" value={stats?.soldLeads ?? 0} icon={TrendingUp} color="green" />
        <StatCard
          label="Jumlah Komisyen"
          value={`RM ${(stats?.totalComm ?? 0).toLocaleString('ms-MY', { minimumFractionDigits: 0 })}`}
          icon={Banknote} color="gold"
        />
        <StatCard
          label="Komisyen Diterima"
          value={`RM ${(stats?.paidComm ?? 0).toLocaleString('ms-MY', { minimumFractionDigits: 0 })}`}
          icon={Banknote} color="green"
        />
        <StatCard label="Followup Hari Ini" value={todayFollowups.length} icon={CalendarDays} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Lead Terkini Saya</h2>
          {recentLeads.length === 0
            ? <p className="text-sm text-gray-500 text-center py-8">Belum ada lead</p>
            : <div className="space-y-2">
                {recentLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between py-2 border-b border-navy-700/60 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{lead.client_name}</p>
                      <p className="text-xs text-gray-400">{lead.projects?.name ?? '—'}</p>
                    </div>
                    <StatusBadge status={lead.status} />
                  </div>
                ))}
              </div>
          }
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Followup Hari Ini</h2>
            <span className="badge bg-gold-500/15 text-gold-300">{todayFollowups.length}</span>
          </div>
          {todayFollowups.length === 0
            ? <p className="text-sm text-gray-500 text-center py-8">Tiada followup hari ini</p>
            : <div className="space-y-2">
                {todayFollowups.map(f => (
                  <div key={f.id} className="flex items-start gap-3 py-2 border-b border-navy-700/60 last:border-0">
                    <div className="w-7 h-7 bg-gold-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{f.leads?.client_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">
                        {f.method}{f.followup_time ? ` · ${f.followup_time}` : ''}
                      </p>
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
