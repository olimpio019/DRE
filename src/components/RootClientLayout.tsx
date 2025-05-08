'use client'

import ClientLayout from './ClientLayout'

export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
} 