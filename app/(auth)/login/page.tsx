'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    )
}

function Spinner() {
    return (
        <span className="inline-block w-4 h-4 border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] rounded-full animate-spin" />
    )
}

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [form, setForm] = useState({ email: '', password: '' })

    async function handleLogin(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const result = await signIn('credentials', {
            email: form.email,
            password: form.password,
            redirect: false,
        })
        if (result?.error) {
            setError('Invalid email or password. Please try again.')
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'linear-gradient(160deg, #0D0D0D 0%, #141414 60%, #1A1408 100%)' }}
        >
            {/* Ambient gold glow */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(200,164,74,0.08) 0%, transparent 70%)' }}
            />

            <div className="w-full max-w-sm relative animate-fadeInUp">

                {/* Logo */}
                <div className="text-center mb-8 animate-scaleIn">
                    <div
                        className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center mx-auto mb-5 animate-logoFloat"
                        style={{ background: 'linear-gradient(145deg, #1E1A0E, #2A230F)', border: '1px solid rgba(200,164,74,0.35)', boxShadow: '0 8px 32px rgba(200,164,74,0.12)' }}
                    >
                        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                            <path d="M7 26H5a1.5 1.5 0 01-1.5-1.5v-4.5a1.5 1.5 0 01.08-.49L6 15.5 8.5 10H29.5L32 15.5l1.92 4.51a1.5 1.5 0 01.08.49v4.5A1.5 1.5 0 0132.5 26H31" stroke="#C8A44A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 26a3 3 0 006 0m12 0a3 3 0 006 0" stroke="#C8A44A" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M7 26h6m6 0h6" stroke="#C8A44A" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M4.5 20h29" stroke="#C8A44A" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="10" cy="26" r="1.5" fill="#C8A44A" />
                            <circle cx="28" cy="26" r="1.5" fill="#C8A44A" />
                        </svg>
                    </div>

                    <h1
                        className="text-[28px] font-bold tracking-[0.12em] text-white"
                        style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.12em' }}
                    >
                        EMIRATES
                    </h1>
                    <p
                        className="text-[11px] font-medium tracking-[0.35em] mt-1"
                        style={{ color: '#C8A44A', letterSpacing: '0.35em' }}
                    >
                        CAR CARE
                    </p>
                </div>

                {/* Card */}
                <div
                    className="rounded-3xl p-6 animate-fadeIn delay-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                >
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white">Welcome back</h2>
                        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Sign in to continue</p>
                    </div>

                    {error && (
                        <div
                            className="text-xs rounded-xl px-4 py-3 mb-5 animate-fadeIn"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-[10px] font-semibold mb-1.5 tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>
                                EMAIL
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <input
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(200,164,74,0.5)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-[10px] font-semibold mb-1.5 tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>
                                PASSWORD
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="w-full pl-10 pr-12 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(200,164,74,0.5)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                                    style={{ color: 'rgba(255,255,255,0.35)' }}
                                >
                                    <EyeIcon open={showPw} />
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-gold w-full py-4 rounded-2xl text-sm font-bold tracking-widest mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ color: '#0D0D0D', letterSpacing: '0.15em' }}
                        >
                            {loading ? <><Spinner /> SIGNING IN</> : 'SIGN IN'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[11px] mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    © 2026 Emirates Car Care. All rights reserved.
                </p>
            </div>
        </div>
    )
}
