"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name || !email || !password) {
      setError('Preencha todos os campos.')
      return
    }

    try {
      console.log("Tentando registrar usuário:", { name, email });
      
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json();
      console.log("Resposta do servidor:", { status: res.status, data });

      if (!res.ok) {
        setError(data.error || 'Erro ao registrar usuário.')
        return
      }

      console.log("Usuário registrado com sucesso:", data);
      setSuccess('Usuário registrado com sucesso! Você já pode fazer login.')
      setName('')
      setEmail('')
      setPassword('')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      console.error("Erro ao registrar usuário:", err);
      setError('Erro ao registrar usuário. Por favor, tente novamente.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold mb-4">Registrar novo usuário</h1>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-2 rounded">{success}</div>}
        <input
          type="text"
          placeholder="Nome"
          className="w-full p-2 border rounded"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="E-mail"
          className="w-full p-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          className="w-full p-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
        >
          Registrar
        </button>
        <p className="text-center text-sm mt-2">
          Já tem conta? <a href="/login" className="text-indigo-600 hover:underline">Entrar</a>
        </p>
      </form>
    </div>
  )
} 