import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import SplashScreen from '@/components/SplashScreen'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Emirates Car Care',
    description: 'Professional auto-workshop management',
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Emirates Car Care' },
}

export const viewport: Viewport = {
    themeColor: '#0D0D0D',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="h-full">
            <head>
                <script dangerouslySetInnerHTML={{
                    __html: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')`
                }} />
            </head>
            <body className={`${geist.className} h-full bg-slate-50`} suppressHydrationWarning>
                <SessionProvider>
                    <SplashScreen />
                    {children}
                </SessionProvider>
            </body>
        </html>
    )
}
