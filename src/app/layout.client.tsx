'use client'

import AuthSessionProvider from '@/providers/SessionProvider'
import AuthButton from '@/components/AuthButton'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <div className="border-b border-violet-200/30 bg-white/10 backdrop-blur-md sticky top-0 z-20 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center font-bold text-lg shadow-lg group-hover:shadow-violet-500/25 transition-all duration-200 group-hover:scale-110">
                ✨
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">Aurora Transit</span>
              <div className="text-xs text-violet-200/80 -mt-1">Journey through the cosmos</div>
            </div>
          </a>
          <nav className="text-sm flex items-center gap-6">
            <a className="text-violet-100 hover:text-cyan-200 hover:underline font-medium transition-colors duration-200" href="/">Planner</a>
            <a className="text-violet-100 hover:text-cyan-200 hover:underline font-medium transition-colors duration-200" href="/trips">Trips</a>
            <AuthButton />
          </nav>
        </div>
      </div>
      <main className="max-w-5xl mx-auto p-4 relative z-10">
        {children}
      </main>
    </AuthSessionProvider>
  )
}
