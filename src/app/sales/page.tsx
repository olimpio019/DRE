'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Sale {
  id: string
  clientId: string
  total: number
  createdAt: string
  client: {
    name: string
    email: string
  }
  items: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
    }
  }[]
}

interface Client {
  id: string
  name: string
  email: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface SaleItem {
  productId: string
  quantity: number
  price: number
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [salesRes, clientsRes, productsRes] = await Promise.all([
          fetch('/api/sales'),
          fetch('/api/clients'),
          fetch('/api/products')
        ])
        
        if (!salesRes.ok || !clientsRes.ok || !productsRes.ok) {
          throw new Error('Erro ao carregar dados')
        }

        const [salesData, clientsData, productsData] = await Promise.all([
          salesRes.json(),
          clientsRes.json(),
          productsRes.json()
        ])

        setSales(salesData)
        setClients(clientsData)
        setProducts(productsData)
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError('Erro ao carregar dados. Por favor, tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const handleAddItem = () => {
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    if (product.stock < quantity) {
      setError(`Estoque insuficiente. Disponível: ${product.stock}`)
      return
    }

    setSaleItems([...saleItems, {
      productId: selectedProduct,
      quantity,
      price: product.price
    }])
    setSelectedProduct('')
    setQuantity(1)
  }

  const handleRemoveItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const handleCreateSale = async () => {
    try {
      if (!selectedClient) {
        setError('Selecione um cliente')
        return
      }

      if (saleItems.length === 0) {
        setError('Adicione pelo menos um item')
        return
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClient,
          items: saleItems
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const newSale = await response.json()
      setSales([newSale, ...sales])
      setSuccess('Venda criada com sucesso!')
      setSelectedClient('')
      setSaleItems([])
      
      // Atualizar produtos após a venda
      const productsRes = await fetch('/api/products')
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }
    } catch (err) {
      console.error('Erro ao criar venda:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar venda')
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  const total = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Registro de Vendas</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Nova Venda</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Produto</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - R$ {product.price.toFixed(2)} (Estoque: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={handleAddItem}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Adicionar Item
              </button>

              {saleItems.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">Itens da Venda</h3>
                  <div className="mt-2 space-y-2">
                    {saleItems.map((item, index) => {
                      const product = products.find(p => p.id === item.productId)
                      return (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span>
                            {product?.name} - {item.quantity}x - R$ {item.price.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remover
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 text-right">
                    <p className="text-lg font-medium">
                      Total: R$ {total.toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleCreateSale}
                      className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Finalizar Venda
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Histórico de Vendas</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Itens
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.client?.name || 'Cliente não encontrado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.client?.email || 'Email não disponível'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          R$ {sale.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {sale.items.map((item) => (
                            <div key={item.id}>
                              {item.quantity}x {item.product?.name || 'Produto não encontrado'} - R$ {item.price.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 