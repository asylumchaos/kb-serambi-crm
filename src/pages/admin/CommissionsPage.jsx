import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal, StatusBadge, EmptyState, Spinner, PageHeader, StatCard, ConfirmDialog } from '../../components/ui'
import { Plus, Banknote, TrendingUp, Clock, CheckCircle, Pencil, Trash2, ChevronDown } from 'lucide-react'

const EMPTY_FORM = {
  lead_id: '', agent_id: '', project_id: '',
  sale_price: '', commission_rate: '2', commission_amount: '',
  payment_status: 'pending', sale_date: ''
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState([])
  const [leads, setLeads]             = useState([])
  const [agents, setAgents]           = useState([])
  const [projects, setProjects]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [statusFilter, setStatus]     = useState('')
  const [modal, setModal]             = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [confirmId, setConfirmId]     = useState(null)
  const [deleting, setDeleting]       = useState(false)

  const fetchCommissions = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('commissions')
      .select('*, leads(client_name), agents(name), projects(name)')
      .order('created_at', { ascending: false })
    if (statusFilter) q = q.eq('payment_status', statusFilter)
    const { data } = await q
    setCommissions(data ?? [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchCommissions() }, [fetchCommissions])
  useEffect(() => {
    supabase.from('leads').select('id, client_name').then(({ data }) => setLeads(data ?? []))
    supabase.from('agents').select('id, name').then(({ data }) => setAgents(data ?? []))
    supabase.from('projects').select('id, name, default_commission_rate').then(({ data }) => setProjects(data ?? []))
  }, [])

  // Summary stats
  const total   = commissions.reduce((s, c) => s + Number(c.commission_amount ?? 0), 0)
  const paid    = commissions.filter(c => c.payment_status === 'paid').reduce((s, c) => s + Number(c.commission_amount ?? 0), 0)
  const pending = commissions.filter(c => c.payment_status === 'pending').reduce((s, c) => s + Number(c.commission_amount ?? 0), 0)

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  function openEdit(c) {
    setEditing(c)
    setForm({
      lead_id: c.lead_id ?? '', agent_id: c.agent_id ?? '', project_id: c.project_id ?? '',
      sale_price: c.sale_price ?? '', commission_rate: c.commission_rate ?? '2',
      commission_amount: c.commission_amount ?? '', payment_status: c.payment_status ?? 'pending',
      sale_date: c.sale_date ?? ''
    })
    setModal(true)
  }

  function calcCommission(price, rate) {
    if (!price || !rate) return ''
    return (Number(price) * Number(rate) / 100).toFixed(2)
  }

  function handleProjectChange(projectId) {
    const proj = projects.find(p => p.id === projectId)
    const rate = proj?.default_commission_rate ?? form.commission_rate
    const amount = calcCommission(form.sale_price, rate)
    setForm(p => ({ ...p, project_id: projectId, commission_rate: rate, commission_amount: amount }))
  }

  function handlePriceChange(price) {
    const amount = calcCommission(price, form.commission_rate)
    setForm(p => ({ ...p, sale_price: price, commission_amount: amount }))
  }

  function handleRateChange(rate) {
    const amount = calcCommission(form.sale_price, rate)
    setForm(p => ({ ...p, commission_rate: rate, commission_amount: amount }))
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      ...form,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      commission_rate: form.commission_rate ? Number(form.commission_rate) : 2,
      commission_amount: form.commission_amount ? Number(form.commission_amount) : null,
      lead_id: form.lead_id || null,
      agent_id: form.agent_id || null,
      project_id: form.project_id || null,
      sale_date: form.sale_date || null,
    }
    if (editing) await supabase.from('commissions').update(payload).eq('id', editing.id)
    else await supabase.from('commissions').insert(payload)
    setSaving(false); setModal(false); fetchCommissions()
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('commissions').delete().eq('id', confirmId)
    setDeleting(false); setConfirmId(null); fetchCommissions()
  }

  async function markPaid(id) {
    await supabase.from('commissions').update({ payment_status: 'paid' }).eq('id', id)
    fetchCommissions()
  }

  const rm = v => `RM ${Number(v).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`

  return (
    <div>
      <PageHeader
        title="Pengurusan Komisyen"
        action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Rekod Komisyen</button>}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Jumlah Komisyen" value={rm(total)} icon={Banknote} color="gold" />
        <StatCard label="Telah Dibayar" value={rm(paid)} icon={CheckCircle} color="green" />
        <StatCard label="Belum Dibayar" value={rm(pending)} icon={Clock} color="red" />
      </div>

      {/* Filter */}
      <div className="relative w-fit mb-4">
        <select className="input pr-8 appearance-none" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="pending">Belum Bayar</option>
          <option value="partial">Separa Bayar</option>
          <option value="paid">Dibayar</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-900/60 border-b border-navy-700">
              <tr>
                <th className="th">Ejen</th>
                <th className="th hidden sm:table-cell">Klien</th>
                <th className="th hidden md:table-cell">Projek</th>
                <th className="th">Harga Jualan</th>
                <th className="th hidden md:table-cell">Kadar %</th>
                <th className="th">Komisyen</th>
                <th className="th">Status</th>
                <th className="th w-28">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8}><Spinner /></td></tr>
                : commissions.length === 0
                  ? <tr><td colSpan={8}><EmptyState icon={Banknote} message="Tiada rekod komisyen" /></td></tr>
                  : commissions.map(c => (
                    <tr key={c.id} className="tr">
                      <td className="td font-medium text-white">{c.agents?.name ?? '—'}</td>
                      <td className="td hidden sm:table-cell text-gray-300">{c.leads?.client_name ?? '—'}</td>
                      <td className="td hidden md:table-cell text-gray-300">{c.projects?.name ?? '—'}</td>
                      <td className="td text-gray-300">{c.sale_price ? rm(c.sale_price) : '—'}</td>
                      <td className="td hidden md:table-cell text-gray-300">{c.commission_rate ?? 2}%</td>
                      <td className="td font-semibold text-gold-400">{c.commission_amount ? rm(c.commission_amount) : '—'}</td>
                      <td className="td"><StatusBadge status={c.payment_status} /></td>
                      <td className="td">
                        <div className="flex items-center gap-1">
                          {c.payment_status !== 'paid' && (
                            <button onClick={() => markPaid(c.id)} className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Tandakan dibayar">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmId(c.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Komisyen' : 'Rekod Komisyen Baru'}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Ejen</label>
            <select className="input" value={form.agent_id} onChange={e => setForm(p => ({ ...p, agent_id: e.target.value }))}>
              <option value="">— Pilih Ejen —</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lead / Klien</label>
            <select className="input" value={form.lead_id} onChange={e => setForm(p => ({ ...p, lead_id: e.target.value }))}>
              <option value="">— Pilih Lead —</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.client_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Projek</label>
            <select className="input" value={form.project_id} onChange={e => handleProjectChange(e.target.value)}>
              <option value="">— Pilih Projek —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tarikh Jualan</label>
            <input type="date" className="input" value={form.sale_date} onChange={e => setForm(p => ({ ...p, sale_date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Harga Jualan (RM) *</label>
            <input type="number" className="input" value={form.sale_price} onChange={e => handlePriceChange(e.target.value)} />
          </div>
          <div>
            <label className="label">Kadar Komisyen (%)</label>
            <input type="number" step="0.25" min="0" max="10" className="input" value={form.commission_rate} onChange={e => handleRateChange(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Jumlah Komisyen (RM)</label>
            <input type="number" className="input bg-gold-500/5 border-gold-500/30 text-gold-300 font-semibold"
              value={form.commission_amount}
              onChange={e => setForm(p => ({ ...p, commission_amount: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">Dikira automatik. Boleh ubah suai.</p>
          </div>
          <div>
            <label className="label">Status Bayaran</label>
            <select className="input" value={form.payment_status} onChange={e => setForm(p => ({ ...p, payment_status: e.target.value }))}>
              <option value="pending">Belum Bayar</option>
              <option value="partial">Separa Bayar</option>
              <option value="paid">Dibayar</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !form.sale_price}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete}
        loading={deleting} title="Padam Rekod" message="Rekod komisyen ini akan dipadam. Teruskan?"
      />
    </div>
  )
}
