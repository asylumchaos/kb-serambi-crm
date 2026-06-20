import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal, StatusBadge, EmptyState, Spinner, PageHeader, ConfirmDialog } from '../../components/ui'
import { Plus, Search, Pencil, Trash2, Users, ChevronDown } from 'lucide-react'

const STATUSES = ['','new','contacted','interested','viewing','negotiating','booked','sold','lost']
const STATUS_LABELS = {
  '':'Semua Status', new:'Baru', contacted:'Dihubungi', interested:'Berminat',
  viewing:'Lawatan', negotiating:'Rundingan', booked:'Ditempah', sold:'Dijual', lost:'Hilang'
}

const EMPTY_FORM = {
  client_name:'', phone:'', email:'', project_id:'', agent_id:'',
  budget:'', preferred_location:'', contact_method:'WhatsApp', status:'new',
  source:'manual', notes:''
}

export default function LeadsPage() {
  const [leads, setLeads]       = useState([])
  const [agents, setAgents]     = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatus] = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('leads')
      .select('*, projects(name), agents(name)')
      .order('created_at', { ascending: false })
    if (statusFilter) q = q.eq('status', statusFilter)
    if (search) q = q.ilike('client_name', `%${search}%`)
    const { data } = await q
    setLeads(data ?? [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])
  useEffect(() => {
    supabase.from('agents').select('id, name').eq('status','active').then(({ data }) => setAgents(data ?? []))
    supabase.from('projects').select('id, name').eq('status','active').then(({ data }) => setProjects(data ?? []))
  }, [])

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  function openEdit(lead) {
    setEditing(lead)
    setForm({
      client_name: lead.client_name ?? '', phone: lead.phone ?? '',
      email: lead.email ?? '', project_id: lead.project_id ?? '',
      agent_id: lead.agent_id ?? '', budget: lead.budget ?? '',
      preferred_location: lead.preferred_location ?? '',
      contact_method: lead.contact_method ?? 'WhatsApp',
      status: lead.status ?? 'new', source: lead.source ?? 'manual',
      notes: lead.notes ?? ''
    })
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      ...form,
      budget: form.budget ? Number(form.budget) : null,
      project_id: form.project_id || null,
      agent_id: form.agent_id || null,
    }
    if (editing) {
      await supabase.from('leads').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('leads').insert(payload)
    }
    setSaving(false); setModal(false); fetchLeads()
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('leads').delete().eq('id', confirmId)
    setDeleting(false); setConfirmId(null); fetchLeads()
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Pengurusan Lead"
        subtitle={`${leads.length} lead dijumpai`}
        action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Tambah Lead</button>}
      />

      {/* Filters */}
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

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-900/60 border-b border-navy-700">
              <tr>
                <th className="th">Nama Klien</th>
                <th className="th hidden sm:table-cell">Telefon</th>
                <th className="th hidden md:table-cell">Projek</th>
                <th className="th hidden lg:table-cell">Ejen</th>
                <th className="th">Status</th>
                <th className="th hidden md:table-cell">Bajet</th>
                <th className="th w-20">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7}><Spinner /></td></tr>
                : leads.length === 0
                  ? <tr><td colSpan={7}><EmptyState icon={Users} message="Tiada lead ditemui" /></td></tr>
                  : leads.map(lead => (
                    <tr key={lead.id} className="tr">
                      <td className="td">
                        <p className="font-medium text-white">{lead.client_name}</p>
                        <p className="text-xs text-gray-400 sm:hidden">{lead.phone}</p>
                      </td>
                      <td className="td hidden sm:table-cell text-gray-300">{lead.phone}</td>
                      <td className="td hidden md:table-cell text-gray-300">{lead.projects?.name ?? '—'}</td>
                      <td className="td hidden lg:table-cell text-gray-300">{lead.agents?.name ?? '—'}</td>
                      <td className="td"><StatusBadge status={lead.status} /></td>
                      <td className="td hidden md:table-cell text-gray-300">
                        {lead.budget ? `RM ${Number(lead.budget).toLocaleString()}` : '—'}
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(lead)} className="p-1.5 text-gray-400 hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmId(lead.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
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

      {/* Form Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Lead' : 'Tambah Lead Baru'} size="lg">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Nama Klien *</label><input className="input" value={form.client_name} onChange={e => f('client_name', e.target.value)} /></div>
          <div><label className="label">No. Telefon</label><input className="input" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
          <div><label className="label">E-mel</label><input type="email" className="input" value={form.email} onChange={e => f('email', e.target.value)} /></div>
          <div>
            <label className="label">Projek</label>
            <select className="input" value={form.project_id} onChange={e => f('project_id', e.target.value)}>
              <option value="">— Pilih Projek —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ejen</label>
            <select className="input" value={form.agent_id} onChange={e => f('agent_id', e.target.value)}>
              <option value="">— Pilih Ejen —</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
              {STATUSES.slice(1).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div><label className="label">Bajet (RM)</label><input type="number" className="input" value={form.budget} onChange={e => f('budget', e.target.value)} /></div>
          <div><label className="label">Lokasi Pilihan</label><input className="input" value={form.preferred_location} onChange={e => f('preferred_location', e.target.value)} /></div>
          <div>
            <label className="label">Cara Hubungi</label>
            <select className="input" value={form.contact_method} onChange={e => f('contact_method', e.target.value)}>
              {['WhatsApp','Call','Email','Visit'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Sumber</label>
            <select className="input" value={form.source} onChange={e => f('source', e.target.value)}>
              {['manual','google_form','referral','social_media','walk_in'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">Nota</label><textarea className="input" rows={3} value={form.notes} onChange={e => f('notes', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !form.client_name}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete}
        loading={deleting} title="Padam Lead"
        message="Lead ini akan dipadam secara kekal. Teruskan?"
      />
    </div>
  )
}
