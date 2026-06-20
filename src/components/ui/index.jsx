// Modal
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-navy-800 border border-navy-600 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

// Stat card
export function StatCard({ label, value, icon: Icon, color = 'gold', sub }) {
  const colors = {
    gold:   'text-gold-400 bg-gold-500/10 border-gold-500/20',
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red:    'text-red-400 bg-red-500/10 border-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  }
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white leading-none">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// Status badge
const STATUS_STYLES = {
  new:         'bg-blue-500/15 text-blue-300 border border-blue-500/20',
  contacted:   'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20',
  interested:  'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20',
  viewing:     'bg-purple-500/15 text-purple-300 border border-purple-500/20',
  negotiating: 'bg-orange-500/15 text-orange-300 border border-orange-500/20',
  booked:      'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20',
  sold:        'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
  lost:        'bg-red-500/15 text-red-300 border border-red-500/20',
  active:      'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
  inactive:    'bg-gray-500/15 text-gray-400 border border-gray-500/20',
  pending:     'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20',
  paid:        'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
  partial:     'bg-blue-500/15 text-blue-300 border border-blue-500/20',
  upcoming:    'bg-blue-500/15 text-blue-300 border border-blue-500/20',
  completed:   'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
}

const STATUS_LABELS = {
  new: 'Baru', contacted: 'Dihubungi', interested: 'Berminat',
  viewing: 'Lawatan', negotiating: 'Rundingan', booked: 'Ditempah',
  sold: 'Dijual', lost: 'Hilang', active: 'Aktif', inactive: 'Tidak Aktif',
  pending: 'Belum Bayar', paid: 'Dibayar', partial: 'Separa',
  upcoming: 'Akan Datang', completed: 'Selesai',
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? 'bg-gray-500/15 text-gray-400'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// Empty state
export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-gray-500" />
      </div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}

// Loading spinner
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Page header
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// Confirm dialog
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-navy-800 border border-navy-600 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={onConfirm} className="btn-danger" disabled={loading}>
            {loading ? 'Memadam...' : 'Padam'}
          </button>
        </div>
      </div>
    </div>
  )
}
