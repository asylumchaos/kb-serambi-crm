import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, EmptyState, Spinner, PageHeader } from '../../components/ui'
import { Search, Users, Pencil, ChevronDown } from 'lucide-react'

const STATUSES = ['','new','contacted','interested','viewing','negotiating','booked','sold','lost']
const STATUS_LABELS = {
  '':'Semua', new:'Baru', contacted:'Dihubungi', interested:'Berminat',
  viewing:'Lawatan', negotiating:'Rundingan', booked:'Ditempah', sold:'Dijual', lost:'Hilang'
}

export default function AgentLeads() {
  const { user } = useAuth()
  const [agentId, setAgentId]     = useState(null)
  const [leads, setLeads]         = useState([])
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('')
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState({ status: '', notes: '', contact_method: '', preferred_location: '' })
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('agents').select('id').eq('profile_id', user.id).single()
      .then(({ data }) => { if (data) setAgentId(data.id) })
    supabase.from('projects').select('id, name').then(({ data }) => setProjects(data ?? []))
  }, [user])

  const fetchLeads = useCallback(async () => {
    if (!agentId) return
    setLoading(true)
    let q = supabase
      .from('leads')
      .select('*, projects(name)')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
    if (statusFilter) q = q.eq('status', statusFilter)
    if (search) q = q.ilike('client_name', `%${search}%`)
    const { data } = await q
    setLeads(data ?? [])
    setLoading(false)
  }, [agentId, search, statusFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  function openEdit(lead) {
    setEditing(lead)
    setForm({
      status: lead.status ?? 'new',
      notes: lead.notes ?? '',
      contact_method: lead.contact_method ?? '',
      preferred_location: lead.preferred_location ?? '',
    })
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('leads').update(form).eq('id', editing.id)
    setSaving(false); setModal(false); fetchLeads()
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader title="Lead Saya" subtitle={`${leads.length} lead`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Cari nama klien..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <select className="input pr-8 appearance-none" value={statusFilter} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-900/60 border-b border-navy-700">
              <tr>
                <th className="th">Nama Klien</th>
                <th className="th hidden sm:table-cell">Telefon</th>
                <th className="th hidden md:table-cell">Projek</th>
                <th className="th">Status</th>
                <th className="th hidden md:table-cell">Bajet</th>
                <th className="th w-16">Edit</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6}><Spinner /></td></tr>
                : leads.length === 0
                  ? <tr><td colSpan={6}><EmptyState icon={Users} message="Tiada lead ditemui" /></td></tr>
                  : leads.map(lead => (
                    <tr key={lead.id} className="tr">
                      <td className="td">
                        <p className="font-medium text-white">{lead.client_name}</p>
                        <p className="text-xs text-gray-400 sm:hidden">{lead.phone}</p>
                      </td>
                      <td className="td hidden sm:table-cell text-gray-300">{lead.phone}</td>
                      <td className="td hidden md:table-cell text-gray-300">{lead.projects?.name ?? '—'}</td>
                      <td className="td"><StatusBadge status={lead.status} /></td>
                      <td className="td hidden md:table-cell text-gray-300">
                        {lead.budget ? `RM ${Number(lead.budget).toLocaleString()}` : '—'}
                      </td>
                      <td className="td">
                        <button onClick={() => openEdit(lead)} className="p-1.5 text-gray-400 hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal — agents can only update status, notes, contact_method */}
      <Modal open={modal} onClose={() => setModal(false)} title={`Kemaskini Lead: ${editing?.client_name}`}>
        <div className="space-y-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
              {STATUSES.slice(1).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Cara Hubungi</label>
            <select className="input" value={form.contact_method} onChange={e => f('contact_method', e.target.value)}>
              {['WhatsApp','Call','Email','Visit'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lokasi Pilihan</label>
            <input className="input" value={form.preferred_location} onChange={e => f('preferred_location', e.target.value)} />
          </div>
          <div>
            <label className="label">Nota</label>
            <textarea className="input" rows={4} value={form.notes} onChange={e => f('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
