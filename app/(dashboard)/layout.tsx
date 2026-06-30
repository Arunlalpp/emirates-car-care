import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session) redirect('/login')

    return (
        <div className="min-h-screen" style={{ background: 'var(--surface-0)' }}>
            <main className="pb-24 lg:pb-6 lg:pl-64">
                {children}
            </main>
            <BottomNav />
        </div>
    )
}
