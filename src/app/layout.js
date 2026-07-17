import './globals.css'
import { AppDataProvider } from '@/contexts/AppDataContext'

export const metadata = {
    title: 'Consumer Workflow V2 — Design',
    description: 'Wonder design export for the consumer workflow revamp',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap"
                />
            </head>
            <body className="relative min-h-screen w-full flex justify-center items-start bg-[#f5f6fb] overflow-x-hidden">
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10"
                    style={{
                        backgroundImage:
                            'radial-gradient(680px circle at 8% 12%, rgba(99,102,241,0.10), transparent 60%), radial-gradient(620px circle at 94% 78%, rgba(124,58,237,0.07), transparent 60%), radial-gradient(1200px circle at 50% -10%, rgba(67,56,202,0.06), transparent 55%)',
                    }}
                ></div>
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]"
                    style={{
                        backgroundImage:
                            'radial-gradient(rgba(30,27,75,0.06) 1px, transparent 1px)',
                        backgroundSize: '22px 22px',
                        maskImage: 'radial-gradient(1000px circle at 50% 0%, black, transparent 75%)',
                        WebkitMaskImage: 'radial-gradient(1000px circle at 50% 0%, black, transparent 75%)',
                    }}
                ></div>
                <div className="w-full flex justify-center">
                    <AppDataProvider>{children}</AppDataProvider>
                </div>
            </body>
        </html>
    )
}
