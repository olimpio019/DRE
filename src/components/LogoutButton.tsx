'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export default function LogoutButton() {
  const { logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Saindo...' : 'Sair'}
    </button>
  )
} 