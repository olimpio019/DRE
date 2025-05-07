'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  cost: number
  stock: number
  createdAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const { data: session } = useSession()

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.id}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar produtos');
      }

      const data = await response.json();
      setProducts(data);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchProducts();
    }
  }, [session, refreshKey]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const cost = formData.get('cost') as string;
    const stock = formData.get('stock') as string;
    const minStock = formData.get('minStock') as string;

    // Validação dos dados
    if (!name || !description || !price || !cost || !stock || !minStock) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    // Remover R$ e espaços do preço e substituir vírgula por ponto
    const cleanPrice = price.replace('R$', '').trim().replace(',', '.');
    const numericPrice = parseFloat(cleanPrice);

    if (isNaN(numericPrice) || numericPrice < 0) {
      setError('O preço de venda deve ser um número positivo');
      return;
    }

    // Remover R$ e espaços do custo e substituir vírgula por ponto
    const cleanCost = cost.replace('R$', '').trim().replace(',', '.');
    const numericCost = parseFloat(cleanCost);

    if (isNaN(numericCost) || numericCost < 0) {
      setError('O custo unitário deve ser um número positivo');
      return;
    }

    const numericStock = parseInt(stock, 10);
    if (isNaN(numericStock) || !Number.isInteger(numericStock) || numericStock < 0) {
      setError('A quantidade em estoque deve ser um número inteiro positivo');
      return;
    }

    const numericMinStock = parseInt(minStock, 10);
    if (isNaN(numericMinStock) || !Number.isInteger(numericMinStock) || numericMinStock < 0) {
      setError('A quantidade mínima deve ser um número inteiro positivo');
      return;
    }

    const productData = {
      name,
      description,
      price: numericPrice,
      cost: numericCost,
      stock: numericStock,
      minStock: numericMinStock
    };

    try {
      setLoading(true);
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.id}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cadastrar produto');
      }

      // Limpa o formulário
      if (e.currentTarget && typeof e.currentTarget.reset === 'function') {
        e.currentTarget.reset();
      }
      setError('');
      
      // Mostra mensagem de sucesso
      alert('Produto cadastrado com sucesso!');
      
      // Força atualização da lista
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      setError(error instanceof Error ? error.message : 'Erro ao cadastrar produto');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cadastro de Produtos</h1>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Atualizar Lista
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Preço de Venda
          </label>
          <input
            type="text"
            id="price"
            name="price"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
            Custo Unitário
          </label>
          <input
            type="text"
            id="cost"
            name="cost"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
            Quantidade em Estoque
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            min="0"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="minStock" className="block text-sm font-medium text-gray-700">
            Quantidade Mínima
          </label>
          <input
            type="number"
            id="minStock"
            name="minStock"
            min="0"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cadastrar Produto
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Lista de Produtos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Custo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margem de Lucro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                let profitMargin = 0;
                if (product.cost > 0) {
                  profitMargin = ((product.price - product.cost) / product.cost) * 100;
                }
                const profitMarginClass = profitMargin >= 0 
                  ? "text-green-600" 
                  : "text-red-600";
                
                return (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {product.cost.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${profitMarginClass}`}>
                      {product.cost > 0 ? `${profitMargin.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 