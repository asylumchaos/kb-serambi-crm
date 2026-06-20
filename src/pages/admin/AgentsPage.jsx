import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal, StatusBadge, EmptyState, Spinner, PageHeader, ConfirmDialog } from '../../components/ui'
import { Plus, Search, Pencil, Trash2, UserCheck, ChevronDown } from 'lucide-react'

const EMPTY_FORM = { name:'', phone:'', email:'', ren_number:'', agency:'', focus_area:'', status:'active' }

export default function AgentsPage() {
  const [agents, setAgents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatus] = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('agents').select('*').order('created_at', { ascending: false })
    if (statusFilter) q = q.eq('status', statusFilter)
    if (search) q = q.ilike('name', `%${search}%`)
    const { data } = await q
    setAgents(data ?? [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  function openEdit(agent) {
    setEditing(agent)
    setForm({ name: agent.name ?? '', phone: agent.phone ?? '', email: agent.email ?? '',
      ren_number: agent.ren_number ?? '', agency: agent.agency ?? '',
      focus_area: agent.focus_area ?? '', status: agent.status ?? 'active' })
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    if (editing) await supabase.from('agents').update(form).eq('id', editing.id)
    else await supabase.from('agents').insert(form)
    setSaving(false); setModal(false); fetchAgents()
  }

  async function handleStatusChange(id, status) {
    await supabase.from('agents').update({ status }).eq('id', id)
    fetchAgents()
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('agents').delete().eq('id', confirmId)
    setDeleting(false); setConfirmId(null); fetchAgents()
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Pengurusan Ejen"
        subtitle={`${agents.length} ejen dijumpai`}
        action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Tambah Ejen</button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Cari nama ejen..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <select className="input pr-8 appearance-none" value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-900/60 border-b border-navy-700">
              <tr>
                <th className="th">Nama Ejen</th>
                <th className="th hidden sm:table-cell">Telefon</th>
                <th className="th hidden md:table-cell">No. REN</th>
                <th className="th hidden lg:table-cell">Agensi</th>
                <th className="th">Status</th>
                <th className="th w-32">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6}><Spinner /></td></tr>
                : agents.length === 0
                  ? <tr><td colSpan={6}><EmptyState icon={UserCheck} message="Tiada ejen ditemui" /></td></tr>
                  : agents.map(agent => (
                    <tr key={agent.id} className="tr">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-300 text-xs font-bold">{agent.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{agent.name}</p>
                            <p className="text-xs text-gray-400">{agent.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td hidden sm:table-cell text-gray-300">{agent.phone}</td>
                      <td className="td hidden md:table-cell text-gray-300">{agent.ren_number || '—'}</td>
                      <td className="td hidden lg:table-cell text-gray-300">{agent.agency || '—'}</td>
                      <td className="td"><StatusBadge status={agent.status} /></td>
                      <td className="td">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStatusChange(agent.id, agent.status === 'active' ? 'inactive' : 'active')}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              agent.status === 'active'
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {agent.status === 'active' ? 'Nyahaktif' : 'Aktifkan'}
                          </button>
                          <button onClick={() => openEdit(agent)} className="p-1.5 text-gray-400 hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmId(agent.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Ejen' : 'Tambah Ejen Baru'}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Nama *</label><input className="input" value={form.name} onChange={e => f('name', e.target.value)} /></div>
          <div><label className="label">No. Telefon</label><input className="input" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
          <div><label className="label">E-mel</label><input type="email" className="input" value={form.email} onChange={e => f('email', e.target.value)} /></div>
          <div><label className="label">No. Lesen REN</label><input className="input" value={form.ren_number} onChange={e => f('ren_number', e.target.value)} /></div>
          <div><label className="label">Agensi</label><input className="input" value={form.agency} onChange={e => f('agency', e.target.value)} /></div>
          <div><label className="label">Kawasan Fokus</label><input className="input" value={form.focus_area} onChange={e => f('focus_area', e.target.value)} /></div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !form.name}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete}
        loading={deleting} title="Padam Ejen" message="Ejen ini akan dipadam. Teruskan?"
      />
    </div>
  )
}
