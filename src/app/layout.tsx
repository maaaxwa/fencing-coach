import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fencing Coach AI',
  description: 'AI-powered épée fencing coach',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <nav className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-blue-400 hover:text-blue-300">
              ⚔ Fencing Coach
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/notes" className="text-gray-300 hover:text-white transition-colors">
                Notes
              </Link>
              <Link href="/videos" className="text-gray-300 hover:text-white transition-colors">
                Videos
              </Link>
              <Link href="/reports" className="text-gray-300 hover:text-white transition-colors">
                Reports
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-white transition-colors">
                Profile
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
