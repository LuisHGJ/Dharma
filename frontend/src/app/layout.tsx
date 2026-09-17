import type { Metadata } from 'next'
import './globals.css'
import Sidebar from './components/Sidebar'

export const metadata: Metadata = {
  title: 'Dharma',
  description: 'Dharma Frontend',
  icons: {
    icon: '/dharma.webp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  )
}
