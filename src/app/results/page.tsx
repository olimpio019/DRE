'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface FinancialData {
  date: string
  sales: number
  expenses: number
  profit: number
  operationalExpenses: number
  administrativeExpenses: number
  financialExpenses: number
  otherExpenses: number
  otherRevenues: number
  financialRevenues: number
  serviceRevenues: number
  icms: number
  pisCofins: number
  incomeTax: number
  depreciation: number
  amortization: number
  departmentExpenses: {
    [key: string]: number
  }
  productSales: {
    [key: string]: number
  }
}

interface SummaryData {
  totalSales: number
  totalExpenses: number
  totalProfit: number
  profitMargin: number
  operationalExpenses: number
  administrativeExpenses: number
  financialExpenses: number
  otherExpenses: number
  otherRevenues: number
  financialRevenues: number
  serviceRevenues: number
  totalRevenues: number
  ebitda: number
  ebitdaMargin: number
  netMargin: number
  operationalMargin: number
  roi: number
  roe: number
  assetTurnover: number
  debtRatio: number
  icms: number
  pisCofins: number
  incomeTax: number
  depreciation: number
  amortization: number
  previousPeriod: {
    totalSales: number
    totalExpenses: number
    totalProfit: number
  }
  goals: {
    sales: number
    profit: number
    ebitda: number
  }
  projections: {
    sales: number[]
    expenses: number[]
    profit: number[]
  }
}

interface DepartmentData {
  name: string
  expenses: number
  revenue: number
  profit: number
}

interface ProductData {
  name: string
  sales: number
  cost: number
  profit: number
}

export default function ResultsPage() {
  const [financialData, setFinancialData] = useState<FinancialData[]>([])
  const [summary, setSummary] = useState<SummaryData>({
    totalSales: 0,
    totalExpenses: 0,
    totalProfit: 0,
    profitMargin: 0,
    operationalExpenses: 0,
    administrativeExpenses: 0,
    financialExpenses: 0,
    otherExpenses: 0,
    otherRevenues: 0,
    financialRevenues: 0,
    serviceRevenues: 0,
    totalRevenues: 0,
    ebitda: 0,
    ebitdaMargin: 0,
    netMargin: 0,
    operationalMargin: 0,
    roi: 0,
    roe: 0,
    assetTurnover: 0,
    debtRatio: 0,
    icms: 0,
    pisCofins: 0,
    incomeTax: 0,
    depreciation: 0,
    amortization: 0,
    previousPeriod: {
      totalSales: 0,
      totalExpenses: 0,
      totalProfit: 0
    },
    goals: {
      sales: 0,
      profit: 0,
      ebitda: 0
    },
    projections: {
      sales: [],
      expenses: [],
      profit: []
    }
  })
  const [departments, setDepartments] = useState<DepartmentData[]>([])
  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [selectedView, setSelectedView] = useState('overview')
  const { data: session, status } = useSession()
  const router = useRouter()

  const COLORS = ['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#6366F1', '#EC4899']

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // Buscar dados dos últimos 30 dias
      const [salesResponse, expensesResponse, departmentsResponse, productsResponse] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/expenses'),
        fetch('/api/departments'),
        fetch('/api/products')
      ])

      if (!salesResponse.ok) {
        throw new Error('Erro ao buscar vendas')
      }

      if (!expensesResponse.ok) {
        throw new Error('Erro ao buscar despesas')
      }

      if (!departmentsResponse.ok) {
        throw new Error('Erro ao buscar departamentos')
      }

      if (!productsResponse.ok) {
        throw new Error('Erro ao buscar produtos')
      }

      const salesData = await salesResponse.json()
      const expensesData = await expensesResponse.json()
      const departmentsData = await departmentsResponse.json()
      const productsData = await productsResponse.json()

      // Processar dados para o gráfico
      const last30Days = Array.from({ length: parseInt(selectedPeriod) }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      const processedData = last30Days.map(date => {
        const daySales = salesData
          .filter((sale: any) => sale.createdAt.split('T')[0] === date)
          .reduce((sum: number, sale: any) => sum + Number(sale.total), 0)

        const dayExpenses = expensesData
          .filter((expense: any) => expense.date.split('T')[0] === date)

        const operationalExpenses = dayExpenses
          .filter((expense: any) => expense.type === 'Operational')
          .reduce((sum: number, expense: any) => sum + Number(expense.amount), 0)

        const administrativeExpenses = dayExpenses
          .filter((expense: any) => expense.type === 'Administrative')
          .reduce((sum: number, expense: any) => sum + Number(expense.amount), 0)

        const financialExpenses = dayExpenses
          .filter((expense: any) => expense.type === 'Financial')
          .reduce((sum: number, expense: any) => sum + Number(expense.amount), 0)

        const otherExpenses = dayExpenses
          .filter((expense: any) => expense.type === 'Other')
          .reduce((sum: number, expense: any) => sum + Number(expense.amount), 0)

        const totalDayExpenses = operationalExpenses + administrativeExpenses + financialExpenses + otherExpenses

        // Calcular impostos
        const icms = daySales * 0.17 // 17% de ICMS
        const pisCofins = daySales * 0.0925 // 9.25% de PIS/COFINS
        const incomeTax = (daySales - totalDayExpenses) * 0.15 // 15% de IR

        // Calcular depreciação e amortização
        const depreciation = totalDayExpenses * 0.05 // 5% de depreciação
        const amortization = totalDayExpenses * 0.03 // 3% de amortização

        return {
          date,
          sales: daySales,
          expenses: totalDayExpenses,
          profit: daySales - totalDayExpenses,
          operationalExpenses,
          administrativeExpenses,
          financialExpenses,
          otherExpenses,
          otherRevenues: daySales * 0.05, // 5% de outras receitas
          financialRevenues: daySales * 0.02, // 2% de receitas financeiras
          serviceRevenues: daySales * 0.03, // 3% de receitas de serviços
          icms,
          pisCofins,
          incomeTax,
          depreciation,
          amortization,
          departmentExpenses: departmentsData.reduce((acc: any, dept: any) => {
            acc[dept.name] = Number(dept.expenses) || 0
            return acc
          }, {}),
          productSales: productsData.reduce((acc: any, prod: any) => {
            acc[prod.name] = Number(prod.sales) || 0
            return acc
          }, {})
        }
      })

      // Calcular totais e indicadores
      const totalSales = processedData.reduce((sum, day) => sum + day.sales, 0)
      const totalExpenses = processedData.reduce((sum, day) => sum + day.expenses, 0)
      const totalProfit = totalSales - totalExpenses
      const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0

      const operationalExpenses = processedData.reduce((sum, day) => sum + day.operationalExpenses, 0)
      const administrativeExpenses = processedData.reduce((sum, day) => sum + day.administrativeExpenses, 0)
      const financialExpenses = processedData.reduce((sum, day) => sum + day.financialExpenses, 0)
      const otherExpenses = processedData.reduce((sum, day) => sum + day.otherExpenses, 0)

      const otherRevenues = processedData.reduce((sum, day) => sum + day.otherRevenues, 0)
      const financialRevenues = processedData.reduce((sum, day) => sum + day.financialRevenues, 0)
      const serviceRevenues = processedData.reduce((sum, day) => sum + day.serviceRevenues, 0)
      const totalRevenues = totalSales + otherRevenues + financialRevenues + serviceRevenues

      const ebitda = totalProfit + 
        processedData.reduce((sum, day) => sum + day.depreciation + day.amortization, 0)
      const ebitdaMargin = totalRevenues > 0 ? (ebitda / totalRevenues) * 100 : 0
      const netMargin = totalRevenues > 0 ? (totalProfit / totalRevenues) * 100 : 0
      const operationalMargin = totalRevenues > 0 ? ((totalRevenues - operationalExpenses) / totalRevenues) * 100 : 0

      // Calcular indicadores financeiros
      const roi = totalExpenses > 0 ? (totalProfit / totalExpenses) * 100 : 0
      const roe = totalExpenses > 0 ? (totalProfit / (totalExpenses * 0.7)) * 100 : 0 // Assumindo 70% de patrimônio líquido
      const assetTurnover = totalExpenses > 0 ? totalRevenues / totalExpenses : 0
      const debtRatio = totalExpenses > 0 ? (totalExpenses * 0.3) / totalExpenses : 0 // Assumindo 30% de dívida

      // Calcular impostos totais
      const icms = processedData.reduce((sum, day) => sum + day.icms, 0)
      const pisCofins = processedData.reduce((sum, day) => sum + day.pisCofins, 0)
      const incomeTax = processedData.reduce((sum, day) => sum + day.incomeTax, 0)

      // Calcular depreciação e amortização totais
      const depreciation = processedData.reduce((sum, day) => sum + day.depreciation, 0)
      const amortization = processedData.reduce((sum, day) => sum + day.amortization, 0)

      setFinancialData(processedData)
      setSummary({
        totalSales,
        totalExpenses,
        totalProfit,
        profitMargin,
        operationalExpenses,
        administrativeExpenses,
        financialExpenses,
        otherExpenses,
        otherRevenues,
        financialRevenues,
        serviceRevenues,
        totalRevenues,
        ebitda,
        ebitdaMargin,
        netMargin,
        operationalMargin,
        roi,
        roe,
        assetTurnover,
        debtRatio,
        icms,
        pisCofins,
        incomeTax,
        depreciation,
        amortization,
        previousPeriod: {
          totalSales: totalSales * 0.9, // 10% menor que o período atual
          totalExpenses: totalExpenses * 0.9,
          totalProfit: totalProfit * 0.9
        },
        goals: {
          sales: totalSales * 1.1, // 10% maior que o período atual
          profit: totalProfit * 1.1,
          ebitda: ebitda * 1.1
        },
        projections: {
          sales: Array.from({ length: 12 }, (_, i) => totalSales * (1 + (i + 1) * 0.05)),
          expenses: Array.from({ length: 12 }, (_, i) => totalExpenses * (1 + (i + 1) * 0.03)),
          profit: Array.from({ length: 12 }, (_, i) => totalProfit * (1 + (i + 1) * 0.07))
        }
      })

      // Processar dados dos departamentos
      const processedDepartments = departmentsData.map((dept: any) => ({
        name: dept.name,
        expenses: Number(dept.expenses),
        revenue: Number(dept.revenue),
        profit: Number(dept.profit)
      }))
      setDepartments(processedDepartments)

      // Processar dados dos produtos
      const processedProducts = productsData.map((prod: any) => ({
        name: prod.name,
        sales: Number(prod.sales),
        cost: Number(prod.cost),
        profit: Number(prod.profit)
      }))
      setProducts(processedProducts)

      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados. Por favor, tente novamente.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchData()
      // Atualizar dados a cada 5 minutos
      const interval = setInterval(fetchData, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [status, router, selectedPeriod])

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(financialData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DRE')
    XLSX.writeFile(workbook, 'dre.xlsx')
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('Demonstração do Resultado do Exercício', 14, 15)
    
    // Período
    doc.setFontSize(12)
    doc.text(`Período: Últimos ${selectedPeriod} dias`, 14, 25)
    
    // Resumo
    doc.setFontSize(14)
    doc.text('Resumo', 14, 35)
    
    const summaryData = [
      ['Vendas Totais', `R$ ${summary.totalSales.toFixed(2)}`],
      ['Despesas Totais', `R$ ${summary.totalExpenses.toFixed(2)}`],
      ['Lucro Total', `R$ ${summary.totalProfit.toFixed(2)}`],
      ['Margem de Lucro', `${summary.profitMargin.toFixed(2)}%`],
      ['EBITDA', `R$ ${summary.ebitda.toFixed(2)}`],
      ['Margem EBITDA', `${summary.ebitdaMargin.toFixed(2)}%`]
    ]
    
    autoTable(doc, {
      startY: 40,
      head: [['Indicador', 'Valor']],
      body: summaryData
    })
    
    doc.save('dre.pdf')
  }

  const sendByEmail = async () => {
    try {
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: session?.user?.email,
          data: {
            summary,
            financialData,
            departments,
            products
          }
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar relatório')
      }

      alert('Relatório enviado com sucesso!')
    } catch (err) {
      console.error('Erro ao enviar relatório:', err)
      alert('Erro ao enviar relatório')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Resultados Financeiros</h1>
            
            <div className="flex space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="180">Últimos 180 dias</option>
                <option value="365">Último ano</option>
              </select>

              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="overview">Visão Geral</option>
                <option value="departments">Por Departamento</option>
                <option value="products">Por Produto</option>
              </select>

              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Exportar Excel
              </button>

              <button
                onClick={exportToPDF}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Exportar PDF
              </button>

              <button
                onClick={sendByEmail}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Enviar por Email
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card Receitas */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Receitas Totais
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        R$ {summary.totalRevenues.toFixed(2)}
                      </dd>
                      <dt className="text-sm font-medium text-gray-500 truncate mt-1">
                        Vendas
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        R$ {summary.totalSales.toFixed(2)}
                      </dd>
                      <dt className="text-sm font-medium text-gray-500 truncate mt-1">
                        Outras Receitas
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        R$ {(summary.otherRevenues + summary.financialRevenues + summary.serviceRevenues).toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Card EBITDA */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        EBITDA
                      </dt>
                      <dd className={`text-lg font-medium ${summary.ebitda >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {summary.ebitda.toFixed(2)}
                      </dd>
                      <dt className="text-sm font-medium text-gray-500 truncate mt-1">
                        Margem EBITDA
                      </dt>
                      <dd className={`text-sm font-medium ${summary.ebitdaMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.ebitdaMargin.toFixed(2)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Lucro */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Lucro Total
                      </dt>
                      <dd className={`text-lg font-medium ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {summary.totalProfit.toFixed(2)}
                      </dd>
                      <dt className="text-sm font-medium text-gray-500 truncate mt-1">
                        Margem Líquida
                      </dt>
                      <dd className={`text-sm font-medium ${summary.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.netMargin.toFixed(2)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Indicadores */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        ROI
                      </dt>
                      <dd className={`text-lg font-medium ${summary.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.roi.toFixed(2)}%
                      </dd>
                      <dt className="text-sm font-medium text-gray-500 truncate mt-1">
                        ROE
                      </dt>
                      <dd className={`text-sm font-medium ${summary.roe >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.roe.toFixed(2)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico de Receitas vs Despesas */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Receitas vs Despesas</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#4F46E5" name="Vendas" />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="Despesas" />
                    <Line type="monotone" dataKey="otherRevenues" stroke="#10B981" name="Outras Receitas" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Composição das Despesas */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Composição das Despesas</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Operacionais', value: summary.operationalExpenses },
                        { name: 'Administrativas', value: summary.administrativeExpenses },
                        { name: 'Financeiras', value: summary.financialExpenses },
                        { name: 'Outras', value: summary.otherExpenses }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
                        if (value === 0) return null;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
                        let x = cx + radius * Math.cos(-midAngle * RADIAN);
                        let y = cy + radius * Math.sin(-midAngle * RADIAN);
                        if (name === 'Operacionais') {
                          y -= 30;
                        }
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#333"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight={500}
                          >
                            {percent === 1
                              ? `${(percent * 100).toFixed(1)}%`
                              : `${name}: ${(percent * 100).toFixed(1)}%`}
                          </text>
                        );
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px'
                      }}
                    />
                    <Legend 
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{
                        paddingLeft: '40px',
                        fontSize: '14px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Comparação com Período Anterior */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Comparação com Período Anterior</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Vendas</h3>
                <div className="mt-2 flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    R$ {summary.totalSales.toFixed(2)}
                  </p>
                  <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                    summary.totalSales > summary.previousPeriod.totalSales ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {((summary.totalSales - summary.previousPeriod.totalSales) / summary.previousPeriod.totalSales * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Despesas</h3>
                <div className="mt-2 flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    R$ {summary.totalExpenses.toFixed(2)}
                  </p>
                  <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                    summary.totalExpenses < summary.previousPeriod.totalExpenses ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {((summary.totalExpenses - summary.previousPeriod.totalExpenses) / summary.previousPeriod.totalExpenses * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Lucro</h3>
                <div className="mt-2 flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    R$ {summary.totalProfit.toFixed(2)}
                  </p>
                  <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                    summary.totalProfit > summary.previousPeriod.totalProfit ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {((summary.totalProfit - summary.previousPeriod.totalProfit) / summary.previousPeriod.totalProfit * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metas e Projeções */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Metas e Projeções</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Vendas</h3>
                <div className="mt-2">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                          Progresso
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          {((summary.totalSales / summary.goals.sales) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                      <div
                        style={{ width: `${(summary.totalSales / summary.goals.sales) * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Lucro</h3>
                <div className="mt-2">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                          Progresso
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-green-600">
                          {((summary.totalProfit / summary.goals.profit) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                      <div
                        style={{ width: `${(summary.totalProfit / summary.goals.profit) * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">EBITDA</h3>
                <div className="mt-2">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                          Progresso
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-blue-600">
                          {((summary.ebitda / summary.goals.ebitda) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                      <div
                        style={{ width: `${(summary.ebitda / summary.goals.ebitda) * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DRE por Departamento */}
          {selectedView === 'departments' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">DRE por Departamento</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Departamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receitas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Despesas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lucro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departments.map((dept) => (
                      <tr key={dept.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {dept.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {dept.revenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {dept.expenses.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {dept.profit.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((dept.profit / dept.revenue) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DRE por Produto */}
          {selectedView === 'products' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">DRE por Produto</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Custo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lucro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((prod) => (
                      <tr key={prod.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {prod.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {prod.sales.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {prod.cost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {prod.profit.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((prod.profit / prod.sales) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 