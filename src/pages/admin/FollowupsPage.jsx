import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal, StatusBadge, EmptyState, Spinner, PageHeader, ConfirmDialog } from '../../components/ui'
import { Plus, CalendarDays, Clock, CheckCircle, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns'
import { ms } from 'date-fns/locale'

const EMPTY_FORM = {
  lead_id: '', agent_id: '', followup_date: '',
  followup_time: '', method: 'WhatsApp', outcome: 'pending', notes: '', next_followup_date: ''
}

export default function FollowupsPage() {
  const [followups, setFollowups] = useState([])
  const [leads, setLeads]         = useState([])
  const [agents, setAgents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('calendar') // calendar | upcoming | completed
  const [calMonth, setCalMonth]   = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const fetchFollowups = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('followups')
      .select('*, leads(client_name, phone), agents(name)')
      .order('followup_date', { ascending: true })
    setFollowups(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchFollowups() }, [fetchFollowups])
  useEffect(() => {
    supabase.from('leads').select('id, client_name').then(({ data }) => setLeads(data ?? []))
    supabase.from('agents').select('id, name').eq('status','active').then(({ data }) => setAgents(data ?? []))
  }, [])

  function openCreate(date = '') {
    setEditing(null)
    setForm({ ...EMPTY_FORM, followup_date: date })
    setModal(true)
  }
  function openEdit(f) {
    setEditing(f)
    setForm({
      lead_id: f.lead_id ?? '', agent_id: f.agent_id ?? '',
      followup_date: f.followup_date ?? '', followup_time: f.followup_time ?? '',
      method: f.method ?? 'WhatsApp', outcome: f.outcome ?? 'pending',
      notes: f.notes ?? '', next_followup_date: f.next_followup_date ?? ''
    })
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      ...form,
      lead_id: form.lead_id || null,
      agent_id: form.agent_id || null,
      followup_time: form.followup_time || null,
      next_followup_date: form.next_followup_date || null,
    }
    if (editing) await supabase.from('followups').update(payload).eq('id', editing.id)
    else await supabase.from('followups').insert(payload)
    setSaving(false); setModal(false); fetchFollowups()
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('followups').delete().eq('id', confirmId)
    setDeleting(false); setConfirmId(null); fetchFollowups()
  }

  async function markDone(id) {
    await supabase.from('followups').update({ outcome: 'completed' }).eq('id', id)
    fetchFollowups()
  }

  const ff = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Calendar helpers
  const monthStart = startOfMonth(calMonth)
  const monthEnd   = endOfMonth(calMonth)
  const calDays    = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDow   = monthStart.getDay()

  function followupsForDay(day) {
    return followups.filter(f => f.followup_date && isSameDay(parseISO(f.followup_date), day))
  }

  const upcoming  = followups.filter(f => f.outcome === 'pending')
  const completed = followups.filter(f => f.outcome !== 'pending')
  const dayFollowups = selectedDay ? followupsForDay(selectedDay) : []

  const TABS = [
    { id: 'calendar', label: 'Kalendar', icon: CalendarDays },
    { id: 'upcoming', label: `Akan Datang (${upcoming.length})`, icon: Clock },
    { id: 'completed', label: `Selesai (${completed.length})`, icon: CheckCircle },
  ]

  return (
    <div>
      <PageHeader
        title="Pengurusan Followup"
        action={<button onClick={() => openCreate()} className="btn-primary"><Plus className="w-4 h-4" />Tambah Followup</button>}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-navy-900 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${tab === id ? 'bg-navy-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Calendar tab */}
      {tab === 'calendar' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="p-1.5 text-gray-400 hover:text-white hover:bg-navy-700 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-semibold text-white capitalize">
                {format(calMonth, 'MMMM yyyy', { locale: ms })}
              </h2>
              <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="p-1.5 text-gray-400 hover:text-white hover:bg-navy-700 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Ahd','Isn','Sel','Rab','Kha','Jum','Sab'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: startDow }).map((_, i) => <div key={`empty-${i}`} />)}
              {calDays.map(day => {
                const dayFus = followupsForDay(day)
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                return (
                  <button key={day.toISOString()} onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`relative p-1.5 rounded-lg text-xs text-center transition-colors min-h-[40px] flex flex-col items-center
                      ${isToday(day) ? 'ring-1 ring-gold-500' : ''}
                      ${isSelected ? 'bg-gold-500/20 text-gold-300' : 'hover:bg-navy-700 text-gray-300'}`}>
                    <span className={`font-medium ${isToday(day) ? 'text-gold-400' : ''}`}>{format(day, 'd')}</span>
                    {dayFus.length > 0 && (
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Day detail */}
          <div className="card">
            {selectedDay ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    {format(selectedDay, 'd MMMM yyyy', { locale: ms })}
                  </h3>
                  <button onClick={() => openCreate(format(selectedDay, 'yyyy-MM-dd'))} className="btn-primary text-xs py-1 px-2">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {dayFus.length === 0
                  ? <p className="text-sm text-gray-500 text-center py-8">Tiada followup</p>
                  : <div className="space-y-2">
                      {dayFus.map(f => (
                        <div key={f.id} className="card-sm">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="text-sm font-medium text-white">{f.leads?.client_name ?? '—'}</p>
                              <p className="text-xs text-gray-400">{f.agents?.name ?? '—'} · {f.method}</p>
                              {f.followup_time && <p className="text-xs text-gold-400 mt-0.5">{f.followup_time}</p>}
                            </div>
                            <StatusBadge status={f.outcome} />
                          </div>
                          {f.notes && <p className="text-xs text-gray-400 mt-2">{f.notes}</p>}
                          <div className="flex gap-2 mt-2">
                            {f.outcome === 'pending' && (
                              <button onClick={() => markDone(f.id)} className="text-xs text-emerald-400 hover:text-emerald-300">✓ Selesai</button>
                            )}
                            <button onClick={() => openEdit(f)} className="text-xs text-gold-400 hover:text-gold-300">Edit</button>
                            <button onClick={() => setConfirmId(f.id)} className="text-xs text-red-400 hover:text-red-300">Padam</button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <CalendarDays className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">Pilih tarikh untuk lihat followup</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming / Completed list */}
      {(tab === 'upcoming' || tab === 'completed') && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-900/60 border-b border-navy-700">
                <tr>
                  <th className="th">Klien</th>
                  <th className="th hidden sm:table-cell">Ejen</th>
                  <th className="th">Tarikh</th>
                  <th className="th hidden md:table-cell">Kaedah</th>
                  <th className="th">Status</th>
                  <th className="th w-24">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <tr><td colSpan={6}><Spinner /></td></tr>
                  : (tab === 'upcoming' ? upcoming : completed).length === 0
                    ? <tr><td colSpan={6}><EmptyState icon={CalendarDays} message="Tiada followup" /></td></tr>
                    : (tab === 'upcoming' ? upcoming : completed).map(f => (
                      <tr key={f.id} className="tr">
                        <td className="td">
                          <p className="font-medium text-white">{f.leads?.client_name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{f.leads?.phone}</p>
                        </td>
                        <td className="td hidden sm:table-cell text-gray-300">{f.agents?.name ?? '—'}</td>
                        <td className="td text-gray-300">
                          {f.followup_date ?? '—'}
                          {f.followup_time && <span className="text-xs text-gold-400 ml-1">{f.followup_time}</span>}
                        </td>
                        <td className="td hidden md:table-cell text-gray-300">{f.method}</td>
                        <td className="td"><StatusBadge status={f.outcome} /></td>
                        <td className="td">
                          <div className="flex items-center gap-1">
                            {f.outcome === 'pending' && (
                              <button onClick={() => markDone(f.id)} className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Tandakan selesai">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => openEdit(f)} className="p-1.5 text-gray-400 hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setConfirmId(f.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
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
      )}

      {/* Form Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Followup' : 'Tambah Followup'}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Lead / Klien</label>
            <select className="input" value={form.lead_id} onChange={e => ff('lead_id', e.target.value)}>
              <option value="">— Pilih Lead —</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.client_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ejen</label>
            <select className="input" value={form.agent_id} onChange={e => ff('agent_id', e.target.value)}>
              <option value="">— Pilih Ejen —</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tarikh Followup *</label>
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

      <ConfirmDialog
        open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete}
        loading={deleting} title="Padam Followup" message="Followup ini akan dipadam. Teruskan?"
      />
    </div>
  )
}
