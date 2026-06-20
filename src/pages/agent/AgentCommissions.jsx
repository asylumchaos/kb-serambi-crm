import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge, EmptyState, Spinner, PageHeader, StatCard } from '../../components/ui'
import { Banknote, CheckCircle, Clock, TrendingUp } from 'lucide-react'

export default function AgentCommissions() {
  const { user } = useAuth()
  const [agentId, setAgentId]       = useState(null)
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [statusFilter, setStatus]     = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('agents').select('id').eq('profile_id', user.id).single()
      .then(({ data }) => { if (data) setAgentId(data.id) })
  }, [user])

  const fetchCommissions = useCallback(async () => {
    if (!agentId) return
    setLoading(true)
    let q = supabase
      .from('commissions')
      .select('*, leads(client_name), projects(name)')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
    if (statusFilter) q = q.eq('payment_status', statusFilter)
    const { data } = await q
    setCommissions(data ?? [])
    setLoading(false)
  }, [agentId, statusFilter])

  useEffect(() => { fetchCommissions() }, [fetchCommissions])

  const total   = commissions.reduce((s, c) => s + Number(c.commission_amount ?? 0), 0)
  const paid    = commissions.filter(c => c.payment_status === 'paid').reduce((s, c) => s + Number(c.commission_amount ?? 0), 0)
  const pending = commissions.filter(c => c.payment_status !== 'paid').reduce((s, c) => s + Number(c.commission_amount ?? 0), 0)
  const rm = v => `RM ${Number(v).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`

  return (
    <div>
      <PageHeader title="Komisyen Saya" subtitle="Rekod jualan dan komisyen anda" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Jumlah Komisyen" value={rm(total)} icon={Banknote} color="gold" />
        <StatCard label="Telah Diterima" value={rm(paid)} icon={CheckCircle} color="green" />
        <StatCard label="Belum Diterima" value={rm(pending)} icon={Clock} color="red" />
      </div>

      <div className="relative w-fit mb-4">
        <select className="input pr-8 appearance-none" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="pending">Belum Bayar</option>
          <option value="partial">Separa Bayar</option>
          <option value="paid">Dibayar</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-900/60 border-b border-navy-700">
              <tr>
                <th className="th">Klien</th>
                <th className="th hidden sm:table-cell">Projek</th>
                <th className="th hidden md:table-cell">Tarikh Jualan</th>
                <th className="th">Harga Jualan</th>
                <th className="th hidden md:table-cell">Kadar %</th>
                <th className="th">Komisyen</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7}><Spinner /></td></tr>
                : commissions.length === 0
                  ? <tr><td colSpan={7}><EmptyState icon={Banknote} message="Belum ada rekod komisyen" /></td></tr>
                  : commissions.map(c => (
                    <tr key={c.id} className="tr">
                      <td className="td font-medium text-white">{c.leads?.client_name ?? '—'}</td>
                      <td className="td hidden sm:table-cell text-gray-300">{c.projects?.name ?? '—'}</td>
                      <td className="td hidden md:table-cell text-gray-300">{c.sale_date ?? '—'}</td>
                      <td className="td text-gray-300">{c.sale_price ? rm(c.sale_price) : '—'}</td>
                      <td className="td hidden md:table-cell text-gray-300">{c.commission_rate ?? 2}%</td>
                      <td className="td font-semibold text-gold-400">{c.commission_amount ? rm(c.commission_amount) : '—'}</td>
                      <td className="td"><StatusBadge status={c.payment_status} /></td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
