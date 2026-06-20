import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Building2 } from 'lucide-react'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError('E-mel atau kata laluan tidak sah.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-navy-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gold-500/10 border border-gold-500/30 rounded-2xl mb-4">
            <Building2 className="w-7 h-7 text-gold-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">KB Serambi CRM</h1>
          <p className="text-gray-400 text-sm mt-1">Sistem Pengurusan Hartanah</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Log Masuk</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mel</label>
              <input
                type="email"
                className="input"
                placeholder="nama@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Kata Laluan</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading
                ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" /> Sedang masuk...</span>
                : 'Log Masuk'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} KB Serambi Bina Sdn Bhd
        </p>
      </div>
    </div>
  )
}
