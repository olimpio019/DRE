'use client'

import { useSession } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export function useApi() {
  const { data: session } = useSession()

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.user) {
      headers['Authorization'] = `Bearer ${session.user.id}`
    }

    return headers
  }

  const apiGet = async (endpoint: string) => {
    try {
      console.log('GET:', `${API_URL}${endpoint}`)
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar dados')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro na requisição GET:', error)
      throw error
    }
  }

  const apiPost = async (endpoint: string, data: any) => {
    try {
      console.log('POST:', `${API_URL}${endpoint}`, data)
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Erro na resposta:', errorData)
        throw new Error(errorData.error || 'Erro ao enviar dados')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro na requisição POST:', error)
      throw error
    }
  }

  const apiPut = async (endpoint: string, data: any) => {
    try {
      console.log('PUT:', `${API_URL}${endpoint}`, data)
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar dados')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro na requisição PUT:', error)
      throw error
    }
  }

  const apiDelete = async (endpoint: string) => {
    try {
      console.log('DELETE:', `${API_URL}${endpoint}`)
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar dados')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro na requisição DELETE:', error)
      throw error
    }
  }

  return {
    apiGet,
    apiPost,
    apiPut,
    apiDelete,
  }
} 