import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal, StatusBadge, EmptyState, Spinner, PageHeader, ConfirmDialog } from '../../components/ui'
import { Plus, Search, Pencil, Trash2, FolderKanban } from 'lucide-react'

const EMPTY_FORM = {
  name: '', location: '', property_type: 'Banglo',
  price_from: '', price_to: '', default_commission_rate: '2',
  status: 'active'
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (search) q = q.ilike('name', `%${search}%`)
    const { data } = await q
    setProjects(data ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  function openEdit(p) {
    setEditing(p)
    setForm({
      name: p.name ?? '', location: p.location ?? '',
      property_type: p.property_type ?? 'Banglo',
      price_from: p.price_from ?? '', price_to: p.price_to ?? '',
      default_commission_rate: p.default_commission_rate ?? '2',
      status: p.status ?? 'active'
    })
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      ...form,
      price_from: form.price_from ? Number(form.price_from) : null,
      price_to: form.price_to ? Number(form.price_to) : null,
      default_commission_rate: form.default_commission_rate ? Number(form.default_commission_rate) : 2,
    }
    if (editing) await supabase.from('projects').update(payload).eq('id', editing.id)
    else await supabase.from('projects').insert(payload)
    setSaving(false); setModal(false); fetchProjects()
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('projects').delete().eq('id', confirmId)
    setDeleting(false); setConfirmId(null); fetchProjects()
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Pengurusan Projek"
        subtitle={`${projects.length} projek`}
        action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Tambah Projek</button>}
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9 max-w-sm" placeholder="Cari projek..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <Spinner /> : projects.length === 0
        ? <EmptyState icon={FolderKanban} message="Tiada projek ditemui" />
        : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <div key={p.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.location || '—'}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-navy-900/60 rounded-lg p-2">
                    <p className="text-gray-500 mb-0.5">Jenis</p>
                    <p className="text-gray-200 font-medium">{p.property_type || '—'}</p>
                  </div>
                  <div className="bg-navy-900/60 rounded-lg p-2">
                    <p className="text-gray-500 mb-0.5">Komisyen</p>
                    <p className="text-gold-400 font-semibold">{p.default_commission_rate ?? 2}%</p>
                  </div>
                  <div className="bg-navy-900/60 rounded-lg p-2 col-span-2">
                    <p className="text-gray-500 mb-0.5">Harga</p>
                    <p className="text-gray-200 font-medium">
                      {p.price_from ? `RM ${Number(p.price_from).toLocaleString()}` : '—'}
                      {p.price_from && p.price_to ? ' – ' : ''}
                      {p.price_to ? `RM ${Number(p.price_to).toLocaleString()}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-1">
                  <button onClick={() => openEdit(p)} className="btn-secondary flex-1 justify-center text-xs py-1.5">
                    <Pencil className="w-3.5 h-3.5" />Edit
                  </button>
                  <button onClick={() => setConfirmId(p.id)} className="btn-danger justify-center text-xs py-1.5 px-3">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Projek' : 'Tambah Projek Baru'}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Nama Projek *</label>
            <input className="input" value={form.name} onChange={e => f('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Lokasi</label>
            <input className="input" value={form.location} onChange={e => f('location', e.target.value)} />
          </div>
          <div>
            <label className="label">Jenis Hartanah</label>
            <select className="input" value={form.property_type} onChange={e => f('property_type', e.target.value)}>
              {['Banglo','Teres','Semi-D','Kondominium','Apartment','Lot Tanah'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Harga Dari (RM)</label>
            <input type="number" className="input" value={form.price_from} onChange={e => f('price_from', e.target.value)} />
          </div>
          <div>
            <label className="label">Harga Hingga (RM)</label>
            <input type="number" className="input" value={form.price_to} onChange={e => f('price_to', e.target.value)} />
          </div>
          <div>
            <label className="label">Kadar Komisyen (%)</label>
            <input type="number" step="0.25" min="0" max="10" className="input" value={form.default_commission_rate} onChange={e => f('default_commission_rate', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">Aktif</option>
              <option value="upcoming">Akan Datang</option>
              <option value="completed">Selesai</option>
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
        loading={deleting} title="Padam Projek" message="Projek ini akan dipadam. Teruskan?"
      />
    </div>
  )
}
