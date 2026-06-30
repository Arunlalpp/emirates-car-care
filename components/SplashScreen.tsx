'use client'

import { useEffect, useState } from 'react'

export default function SplashScreen() {
    const [phase, setPhase] = useState<'show' | 'fade' | 'hidden'>('show')

    useEffect(() => {
        if (sessionStorage.getItem('ecc_splash')) {
            setPhase('hidden')
            return
        }
        const fadeTimer = setTimeout(() => setPhase('fade'), 1800)
        const hideTimer = setTimeout(() => {
            setPhase('hidden')
            sessionStorage.setItem('ecc_splash', '1')
        }, 2300)
        return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
    }, [])

    if (phase === 'hidden') return null

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
            style={{
                background: 'linear-gradient(160deg, #0D0D0D 0%, #141414 60%, #1A1408 100%)',
                transition: 'opacity 0.5s ease',
                opacity: phase === 'fade' ? 0 : 1,
                pointerEvents: phase === 'fade' ? 'none' : 'auto',
            }}
        >
            {/* Ambient glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(200,164,74,0.12) 0%, transparent 70%)' }}
            />

            <div className="flex flex-col items-center gap-4 animate-scaleIn">
                {/* Logo icon */}
                <div
                    className="w-20 h-20 rounded-[22px] flex items-center justify-center animate-goldPulse"
                    style={{
                        background: 'linear-gradient(145deg, #1E1A0E, #2A230F)',
                        border: '1px solid rgba(200,164,74,0.4)',
                        boxShadow: '0 8px 40px rgba(200,164,74,0.15)',
                    }}
                >
                    <svg width="44" height="44" viewBox="0 0 38 38" fill="none">
                        <path d="M7 26H5a1.5 1.5 0 01-1.5-1.5v-4.5a1.5 1.5 0 01.08-.49L6 15.5 8.5 10H29.5L32 15.5l1.92 4.51a1.5 1.5 0 01.08.49v4.5A1.5 1.5 0 0132.5 26H31" stroke="#C8A44A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 26a3 3 0 006 0m12 0a3 3 0 006 0" stroke="#C8A44A" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M7 26h6m6 0h6" stroke="#C8A44A" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M4.5 20h29" stroke="#C8A44A" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="10" cy="26" r="1.5" fill="#C8A44A" />
                        <circle cx="28" cy="26" r="1.5" fill="#C8A44A" />
                    </svg>
                </div>

                <div className="text-center">
                    <h1
                        className="text-[26px] font-bold text-white"
                        style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.12em' }}
                    >
                        EMIRATES
                    </h1>
                    <p
                        className="text-[11px] font-semibold mt-0.5"
                        style={{ color: '#C8A44A', letterSpacing: '0.35em' }}
                    >
                        CAR CARE
                    </p>
                </div>

                {/* Loading dots */}
                <div className="flex gap-1.5 mt-2">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                                background: '#C8A44A',
                                animation: `fadeIn 0.4s ease ${i * 0.15}s both, logoFloat 1.2s ease-in-out ${i * 0.15}s infinite`,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
