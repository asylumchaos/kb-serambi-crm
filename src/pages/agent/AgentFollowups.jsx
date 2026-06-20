import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, EmptyState, Spinner, PageHeader } from '../../components/ui'
import { Plus, CalendarDays, CheckCircle, Clock, Pencil } from 'lucide-react'

const EMPTY_FORM = {
  lead_id: '', followup_date: '', followup_time: '',
  method: 'WhatsApp', outcome: 'pending', notes: '', next_followup_date: ''
}

export default function AgentFollowups() {
  const { user } = useAuth()
  const [agentId, setAgentId]       = useState(null)
  const [leads, setLeads]           = useState([])
  const [followups, setFollowups]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('upcoming')
  const [modal, setModal]           = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('agents').select('id').eq('profile_id', user.id).single()
      .then(({ data }) => { if (data) setAgentId(data.id) })
  }, [user])

  useEffect(() => {
    if (!agentId) return
    supabase.from('leads').select('id, client_name').eq('agent_id', agentId)
      .then(({ data }) => setLeads(data ?? []))
    fetchFollowups()
  }, [agentId])

  const fetchFollowups = useCallback(async () => {
    if (!agentId) return
    setLoading(true)
    const { data } = await supabase
      .from('followups')
      .select('*, leads(client_name, phone)')
      .eq('agent_id', agentId)
      .order('followup_date', { ascending: true })
    setFollowups(data ?? [])
    setLoading(false)
  }, [agentId])

  useEffect(() => { fetchFollowups() }, [fetchFollowups])

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  function openEdit(f) {
    setEditing(f)
    setForm({
      lead_id: f.lead_id ?? '', followup_date: f.followup_date ?? '',
      followup_time: f.followup_time ?? '', method: f.method ?? 'WhatsApp',
      outcome: f.outcome ?? 'pending', notes: f.notes ?? '',
      next_followup_date: f.next_followup_date ?? ''
    })
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      ...form,
      agent_id: agentId,
      lead_id: form.lead_id || null,
      followup_time: form.followup_time || null,
      next_followup_date: form.next_followup_date || null,
    }
    if (editing) await supabase.from('followups').update(payload).eq('id', editing.id)
    else await supabase.from('followups').insert(payload)
    setSaving(false); setModal(false); fetchFollowups()
  }

  async function markDone(id) {
    await supabase.from('followups').update({ outcome: 'completed' }).eq('id', id)
    fetchFollowups()
  }

  const ff = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const today      = new Date().toISOString().slice(0, 10)
  const upcoming   = followups.filter(f => f.outcome === 'pending')
  const completed  = followups.filter(f => f.outcome !== 'pending')
  const todayList  = upcoming.filter(f => f.followup_date === today)
  const list       = tab === 'upcoming' ? upcoming : completed

  return (
    <div>
      <PageHeader
        title="Followup Saya"
        action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Tambah Followup</button>}
      />

      {/* Today alert */}
      {todayList.length > 0 && (
        <div className="mb-4 flex items-start gap-3 bg-gold-500/10 border border-gold-500/25 rounded-xl p-4">
          <Clock className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gold-300">Peringatan Hari Ini</p>
            <p className="text-xs text-gold-400/80 mt-0.5">
              Anda mempunyai <strong>{todayList.length}</strong> followup hari ini:
              {' '}{todayList.map(f => f.leads?.client_name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-navy-900 p-1 rounded-xl w-fit">
        {[
          { id: 'upcoming', label: `Akan Datang (${upcoming.length})`, icon: Clock },
          { id: 'completed', label: `Selesai (${completed.length})`, icon: CheckCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${tab === id ? 'bg-navy-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-900/60 border-b border-navy-700">
              <tr>
                <th className="th">Klien</th>
                <th className="th">Tarikh</th>
                <th className="th hidden sm:table-cell">Kaedah</th>
                <th className="th">Status</th>
                <th className="th hidden md:table-cell">Nota</th>
                <th className="th w-24">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6}><Spinner /></td></tr>
                : list.length === 0
                  ? <tr><td colSpan={6}><EmptyState icon={CalendarDays} message="Tiada followup" /></td></tr>
                  : list.map(f => (
                    <tr key={f.id} className={`tr ${f.followup_date === today && f.outcome === 'pending' ? 'bg-gold-500/5' : ''}`}>
                      <td className="td">
                        <p className="font-medium text-white">{f.leads?.client_name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{f.leads?.phone}</p>
                      </td>
                      <td className="td text-gray-300">
                        {f.followup_date ?? '—'}
                        {f.followup_time && <span className="block text-xs text-gold-400">{f.followup_time}</span>}
                      </td>
                      <td className="td hidden sm:table-cell text-gray-300">{f.method}</td>
                      <td className="td"><StatusBadge status={f.outcome} /></td>
                      <td className="td hidden md:table-cell text-gray-400 max-w-xs truncate">{f.notes || '—'}</td>
                      <td className="td">
                        <div className="flex items-center gap-1">
                          {f.outcome === 'pending' && (
                            <button onClick={() => markDone(f.id)} className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Selesai">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => openEdit(f)} className="p-1.5 text-gray-400 hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Followup' : 'Tambah Followup Baru'}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Lead / Klien</label>
            <select className="input" value={form.lead_id} onChange={e => ff('lead_id', e.target.value)}>
              <option value="">— Pilih Lead —</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.client_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tarikh *</label>
            <input type="date" className="input" value={form.followup_date} onChange={e => ff('followup_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Masa</label>
            <input type="time" className="input" value={form.followup_time} onChange={e => ff('followup_time', e.target.value)} />
          </div>
          <div>
            <label className="label">Kaedah</label>
            <select className="input" value={form.method} onChange={e => ff('method', e.target.value)}>
              {['WhatsApp','Call','Email','Visit','Meeting'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Hasil</label>
            <select className="input" value={form.outcome} onChange={e => ff('outcome', e.target.value)}>
              <option value="pending">Belum Selesai</option>
              <option value="completed">Selesai</option>
              <option value="interested">Berminat</option>
              <option value="not_ready">Belum Bersedia</option>
              <option value="lost">Hilang</option>
            </select>
          </div>
          <div>
            <label className="label">Followup Seterusnya</label>
            <input type="date" className="input" value={form.next_followup_date} onChange={e => ff('next_followup_date', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Nota</label>
            <textarea className="input" rows={3} value={form.notes} onChange={e => ff('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !form.followup_date}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
