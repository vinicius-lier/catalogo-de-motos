import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catálogo de Motos',
  description: 'Catálogo de motocicletas para venda',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
} 