import { Inter } from 'next/font/google'
import './globals.css'
import RootClientLayout from '@/components/RootClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Sistema de Gestão',
  description: 'Sistema de gestão de vendas e estoque',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <RootClientLayout>
          {children}
        </RootClientLayout>
      </body>
    </html>
  )
} 