'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const STAGES = [
    { key: 'booked',        label: 'Booked',        desc: 'Appointment confirmed',       icon: '📅' },
    { key: 'received',      label: 'Received',       desc: 'Vehicle checked in',          icon: '🚗' },
    { key: 'inspection',    label: 'Inspection',     desc: 'Diagnosing your vehicle',     icon: '🔍' },
    { key: 'in_service',    label: 'In Service',     desc: 'Work in progress',            icon: '🔧' },
    { key: 'quality_check', label: 'Quality Check',  desc: 'Final checks underway',       icon: '✅' },
    { key: 'ready',         label: 'Ready',          desc: 'Ready for pickup',            icon: '🎉' },
    { key: 'delivered',     label: 'Delivered',      desc: 'Handed over',                 icon: '🏁' },
]

export default function TrackPage() {
    const { jobNumber } = useParams<{ jobNumber: string }>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [job, setJob] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [notifState, setNotifState] = useState<'idle' | 'requesting' | 'subscribed' | 'denied' | 'unsupported'>('idle')

    useEffect(() => {
        fetch(`/api/track/${encodeURIComponent(jobNumber)}`)
            .then(r => r.json())
            .then(d => { setJob(d.data ?? null); setLoading(false) })
            .catch(() => setLoading(false))
    }, [jobNumber])

    useEffect(() => {
        if (!('Notification' in window)) { setNotifState('unsupported'); return }
        if (Notification.permission === 'granted') setNotifState('subscribed')
        if (Notification.permission === 'denied') setNotifState('denied')
    }, [])

    async function subscribe() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setNotifState('unsupported'); return
        }
        setNotifState('requesting')
        try {
            const perm = await Notification.requestPermission()
            if (perm !== 'granted') { setNotifState('denied'); return }

            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            })

            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobNumber, subscription: sub.toJSON() }),
            })
            setNotifState('subscribed')
        } catch {
            setNotifState('idle')
        }
    }

    const gold = '#C8A44A'

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#0A0C10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 36, height: 36, border: `3px solid ${gold}33`, borderTopColor: gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!job) {
        return (
            <div style={{ minHeight: '100vh', background: '#0A0C10', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
                <p style={{ color: '#F2F5FA', fontSize: 18, fontWeight: 700 }}>Job Not Found</p>
                <p style={{ color: '#566173', fontSize: 14 }}>Job number <strong style={{ color: gold }}>{jobNumber}</strong> does not exist.</p>
            </div>
        )
    }

    const customer = job.customerId
    const vehicle = job.vehicleId
    const ci = STAGES.findIndex(s => s.key === job.status)

    return (
        <div style={{ minHeight: '100vh', background: '#0A0C10', fontFamily: 'system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ background: '#12151C', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                        <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <div>
                    <p style={{ color: '#F2F5FA', fontSize: 15, fontWeight: 700, margin: 0 }}>Emirates Car Care</p>
                    <p style={{ color: '#566173', fontSize: 11, margin: 0 }}>Vehicle Tracker · Vengara, Kerala</p>
                </div>
            </div>

            <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 40px' }}>
                {/* Job info */}
                <div style={{ background: '#12151C', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
                    <p style={{ color: '#566173', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px' }}>Your Job</p>
                    <p style={{ color: gold, fontFamily: 'monospace', fontWeight: 700, fontSize: 15, margin: '0 0 6px' }}>{job.jobNumber}</p>
                    <p style={{ color: '#F2F5FA', fontWeight: 700, fontSize: 17, margin: '0 0 2px' }}>
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : '—'}
                    </p>
                    <p style={{ color: '#8B9AB0', fontSize: 13, margin: 0 }}>
                        {vehicle?.regNumber}{customer?.name ? ` · ${customer.name}` : ''}
                    </p>
                </div>

                {/* Status timeline */}
                <div style={{ background: '#12151C', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px', marginBottom: 16 }}>
                    <p style={{ color: '#566173', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 16px' }}>Service Progress</p>
                    <div style={{ position: 'relative' }}>
                        {STAGES.map((stage, i) => {
                            const done = i < ci
                            const active = i === ci
                            return (
                                <div key={stage.key} style={{ display: 'flex', gap: 14, marginBottom: 0 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: done ? 'rgba(34,197,94,0.15)' : active ? gold : '#191D28',
                                            border: `2px solid ${done ? '#16a34a' : active ? gold : 'rgba(255,255,255,0.1)'}`,
                                            transition: 'all 0.3s',
                                        }}>
                                            {done ? (
                                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                                    <path d="M3 8l4 4 6-6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            ) : (
                                                <span style={{ fontSize: 16 }}>{stage.icon}</span>
                                            )}
                                        </div>
                                        {i < STAGES.length - 1 && (
                                            <div style={{
                                                width: 2, flexGrow: 1, minHeight: 20, margin: '4px 0',
                                                background: done ? '#16a34a' : 'rgba(255,255,255,0.07)',
                                                borderRadius: 1,
                                            }} />
                                        )}
                                    </div>
                                    <div style={{ paddingBottom: 20, flex: 1 }}>
                                        <p style={{
                                            fontSize: 14, fontWeight: 600, margin: 0, lineHeight: '36px',
                                            color: done ? '#22c55e' : active ? gold : '#566173',
                                        }}>
                                            {stage.label}
                                            {active && <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 8, color: '#8B9AB0' }}>← Current</span>}
                                        </p>
                                        {(active || done) && (
                                            <p style={{ fontSize: 12, color: done ? '#4ade80' : '#8B9AB0', margin: '-12px 0 0' }}>{stage.desc}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Push notification subscribe */}
                <div style={{ background: '#12151C', border: `1px solid ${notifState === 'subscribed' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, padding: '18px' }}>
                    {notifState === 'subscribed' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2}>
                                    <path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ color: '#22c55e', fontWeight: 600, fontSize: 14, margin: 0 }}>Push notifications enabled</p>
                                <p style={{ color: '#566173', fontSize: 12, margin: '2px 0 0' }}>You&apos;ll be notified when your vehicle status changes</p>
                            </div>
                        </div>
                    ) : notifState === 'denied' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 28 }}>🔕</span>
                            <div>
                                <p style={{ color: '#F2F5FA', fontWeight: 600, fontSize: 14, margin: 0 }}>Notifications blocked</p>
                                <p style={{ color: '#566173', fontSize: 12, margin: '2px 0 0' }}>Enable notifications in your browser settings to get updates</p>
                            </div>
                        </div>
                    ) : notifState === 'unsupported' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 28 }}>📱</span>
                            <div>
                                <p style={{ color: '#F2F5FA', fontWeight: 600, fontSize: 14, margin: 0 }}>Add to Home Screen</p>
                                <p style={{ color: '#566173', fontSize: 12, margin: '2px 0 0' }}>Install the app for push notifications</p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(200,164,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={gold} strokeWidth={2}>
                                        <path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div>
                                    <p style={{ color: '#F2F5FA', fontWeight: 600, fontSize: 14, margin: 0 }}>Get status updates</p>
                                    <p style={{ color: '#566173', fontSize: 12, margin: '2px 0 0' }}>Notify me when my car is ready</p>
                                </div>
                            </div>
                            <button
                                onClick={subscribe}
                                disabled={notifState === 'requesting'}
                                style={{
                                    background: gold, color: '#0D0D0D', fontSize: 12, fontWeight: 700,
                                    padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                                    opacity: notifState === 'requesting' ? 0.7 : 1,
                                }}
                            >
                                {notifState === 'requesting' ? '...' : 'Enable'}
                            </button>
                        </div>
                    )}
                </div>

                <p style={{ color: '#566173', fontSize: 11, textAlign: 'center', marginTop: 24 }}>
                    Emirates Car Care · Vengara, Kerala 676304<br />
                    <a href="tel:+910995331384" style={{ color: '#C8A44A' }}>+91 09953 31384</a>
                </p>
            </div>
        </div>
    )
}
