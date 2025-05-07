import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const { email, data } = await req.json()

    // Configurar o transporter do nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    // Criar o conteúdo do email
    const emailContent = `
      <h1>Relatório Financeiro</h1>
      <h2>Resumo</h2>
      <ul>
        <li>Vendas Totais: R$ ${data.summary.totalSales.toFixed(2)}</li>
        <li>Despesas Totais: R$ ${data.summary.totalExpenses.toFixed(2)}</li>
        <li>Lucro Total: R$ ${data.summary.totalProfit.toFixed(2)}</li>
        <li>Margem de Lucro: ${data.summary.profitMargin.toFixed(2)}%</li>
        <li>EBITDA: R$ ${data.summary.ebitda.toFixed(2)}</li>
        <li>Margem EBITDA: ${data.summary.ebitdaMargin.toFixed(2)}%</li>
      </ul>

      <h2>Indicadores</h2>
      <ul>
        <li>ROI: ${data.summary.roi.toFixed(2)}%</li>
        <li>ROE: ${data.summary.roe.toFixed(2)}%</li>
        <li>Giro de Ativos: ${data.summary.assetTurnover.toFixed(2)}</li>
        <li>Índice de Endividamento: ${data.summary.debtRatio.toFixed(2)}%</li>
      </ul>

      <h2>Impostos</h2>
      <ul>
        <li>ICMS: R$ ${data.summary.icms.toFixed(2)}</li>
        <li>PIS/COFINS: R$ ${data.summary.pisCofins.toFixed(2)}</li>
        <li>IR: R$ ${data.summary.incomeTax.toFixed(2)}</li>
      </ul>

      <h2>Depreciação e Amortização</h2>
      <ul>
        <li>Depreciação: R$ ${data.summary.depreciation.toFixed(2)}</li>
        <li>Amortização: R$ ${data.summary.amortization.toFixed(2)}</li>
      </ul>
    `

    // Enviar o email
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Relatório Financeiro',
      html: emailContent
    })

    return new NextResponse('Relatório enviado com sucesso', { status: 200 })
  } catch (error) {
    console.error('Erro ao enviar relatório:', error)
    return new NextResponse('Erro ao enviar relatório', { status: 500 })
  }
} 