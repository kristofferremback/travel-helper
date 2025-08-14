import './globals.css'
import React from 'react'
import ClientLayout from './layout.client'

export const metadata = {
  title: 'Aurora Transit ✨ - Cosmic Journey Planner',
  description: 'Navigate Stockholm\'s transit galaxy with cosmic precision - find the fastest routes through space and time',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-violet-900 via-fuchsia-800 to-cyan-900 text-gray-900 relative overflow-x-hidden">
        {/* Cosmic background elements */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-xl animate-aurora-pulse"></div>
          <div className="absolute top-20 right-20 w-96 h-96 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-xl animate-aurora-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl animate-aurora-pulse animation-delay-4000"></div>
          <div className="absolute bottom-40 right-10 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-aurora-pulse animation-delay-1000"></div>
        </div>
        <ClientLayout>
          {children}
        </ClientLayout>
        <footer className="mt-16 py-8 text-center relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl inline-block px-6 py-3 shadow-lg">
            <div className="text-sm text-violet-200 font-medium mb-1">
              Built with cosmic precision ✨
            </div>
            <div className="text-xs text-violet-300/80">
              Powered by SL APIs • Journey through Stockholm's transit galaxy
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
