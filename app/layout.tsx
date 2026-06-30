import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import SplashScreen from '@/components/SplashScreen'
import QueryProvider from '@/components/QueryProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Emirates Car Care',
    description: 'Professional auto-workshop management',
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Emirates Car Care' },
    icons: {
        icon: [
            { url: '/logo.svg', type: 'image/svg+xml' },
            { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        ],
        apple: '/icon-192.png',
    },
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
        <html lang="en" className="h-full" data-theme="dark" suppressHydrationWarning>
            <head>
                {/* Apply saved theme before first paint — prevents flash */}
                <script dangerouslySetInnerHTML={{
                    __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
                }} />
                <script dangerouslySetInnerHTML={{
                    __html: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')`
                }} />
            </head>
            <body className={`${geist.className} h-full`} suppressHydrationWarning>
                <ThemeProvider>
                    <SessionProvider>
                        <QueryProvider>
                            <SplashScreen />
                            {children}
                        </QueryProvider>
                    </SessionProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
