"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const saleSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  items: z.array(z.object({
    productId: z.string().min(1, "Produto é obrigatório"),
    quantity: z.number().min(1, "Quantidade deve ser maior que zero"),
    price: z.number().min(0, "Preço deve ser maior que zero"),
  })).min(1, "Pelo menos um item é obrigatório"),
});

type SaleFormData = z.infer<typeof saleSchema>;

export default function SalesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [{
        productId: "",
        quantity: 1,
        price: 0,
      }]
    }
  });

  const fetchSales = async () => {
    try {
      const response = await fetch("/api/sales");
      if (!response.ok) {
        throw new Error("Erro ao buscar vendas");
      }
      const salesData = await response.json();
      setSales(salesData);
    } catch (error) {
      console.error(error);
      alert("Erro ao buscar vendas");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [productsResponse, clientsResponse] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/clients")
        ]);

        if (!productsResponse.ok || !clientsResponse.ok) {
          throw new Error("Erro ao buscar dados");
        }

        const productsData = await productsResponse.json();
        const clientsData = await clientsResponse.json();

        setProducts(productsData);
        setClients(clientsData);
        await fetchSales();
      } catch (error) {
        console.error(error);
        alert("Erro ao buscar dados");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const onSubmit = async (data: SaleFormData) => {
    try {
      setLoading(true);
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao registrar venda");
      }

      await fetchSales();
      reset();
      setSelectedProduct(null);
      alert("Venda registrada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao registrar venda");
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Registro de Vendas</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cliente
                </label>
                <select
                  {...register("clientId")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Produto
                </label>
                <select
                  {...register("items.0.productId")}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProduct(product);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - R$ {product.price.toFixed(2)}
                    </option>
                  ))}
                </select>
                {errors.items?.[0]?.productId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.items[0].productId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade
                </label>
                <input
                  {...register("items.0.quantity", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.items?.[0]?.quantity && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.items[0].quantity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Preço Unitário
                </label>
                <input
                  {...register("items.0.price", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  value={selectedProduct?.price || 0}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Registrar Venda
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Histórico de Vendas
              </h3>
              <div className="mt-5">
                <div className="flex flex-col">
                  <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Data
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cliente
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Produto
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantidade
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sales.map((sale) => (
                              <tr key={sale.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(sale.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {clients.find(c => c.id === sale.clientId)?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {products.find(p => p.id === sale.items?.[0]?.productId)?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {sale.items?.[0]?.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  R$ {sale.total?.toFixed(2)}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 