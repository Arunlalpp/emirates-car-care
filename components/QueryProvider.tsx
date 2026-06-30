'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30 * 1000,   // cached data stays fresh for 30s — no re-fetch on tab switch
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    }))
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
