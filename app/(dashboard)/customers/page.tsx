'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { useDebouncedValue } from '@/lib/hooks'

interface Customer {
    _id: string
    name: string
    phone: string
    email?: string
}

async function fetchCustomers(q: string) {
    const res = await fetch(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    if (!res.ok) throw new Error('Failed to fetch')
    const j = await res.json()
    return j.data as Customer[]
}

export default function CustomersPage() {
    const [query, setQuery] = useState('')
    const debouncedQuery = useDebouncedValue(query, 300)

    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers', debouncedQuery],
        queryFn: () => fetchCustomers(debouncedQuery),
    })

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="pt-12 pb-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-400 font-medium">Directory</p>
                    <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
                </div>
                <Link
                    href="/customers/new"
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#C8A44A' }}
                >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </Link>
            </div>

            <div className="relative mb-4">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                    placeholder="Search by name, phone, email..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                {query && (
                    <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 bg-slate-100 rounded w-32" />
                                    <div className="h-3 bg-slate-100 rounded w-24" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : customers.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">👥</span>
                    </div>
                    <p className="font-semibold text-slate-800">
                        {query ? 'No customers found' : 'No customers yet'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        {query ? 'Try a different search' : 'Add your first customer to get started'}
                    </p>
                    {!query && (
                        <Link href="/customers/new" className="mt-5 inline-block btn-gold px-6 py-3 rounded-2xl text-sm font-semibold" style={{ color: '#0A0C10' }}>
                            Add Customer
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium mb-3">{customers.length} customer{customers.length !== 1 ? 's' : ''}</p>
                    {customers.map(c => (
                        <Link
                            key={c._id}
                            href={`/customers/${c._id}`}
                            className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 active:scale-[0.98] transition-transform"
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(200,164,74,0.15)', border: '1px solid rgba(200,164,74,0.25)' }}>
                                <span className="font-bold text-sm" style={{ color: '#C8A44A' }}>{c.name[0].toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                            </div>
                            <svg className="text-slate-200 shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    ))}
                </div>
            )}

            <Link
                href="/customers/new"
                className="fixed bottom-24 right-5 w-14 h-14 btn-gold rounded-2xl flex items-center justify-center shadow-lg lg:hidden"
            >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0A0C10" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </Link>
        </div>
    )
}
