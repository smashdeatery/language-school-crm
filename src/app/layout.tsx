import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Language School CRM',
  description: 'Manage students, courses, attendance and teachers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
