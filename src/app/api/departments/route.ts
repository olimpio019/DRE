import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const departments = await prisma.department.findMany({
      include: {
        expenses: true,
        sales: {
          include: {
            items: true
          }
        }
      }
    })

    // Processar dados dos departamentos
    const processedDepartments = departments.map(department => {
      const expenses = department.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
      const revenue = department.sales.reduce((sum, sale) => sum + Number(sale.total), 0)
      const profit = revenue - expenses

      return {
        id: department.id,
        name: department.name,
        description: department.description,
        expenses,
        revenue,
        profit
      }
    })

    return NextResponse.json(processedDepartments)
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar departamentos' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const { name, description } = await req.json()

    if (!name) {
      return new NextResponse('Nome é obrigatório', { status: 400 })
    }

    const department = await prisma.department.create({
      data: {
        name,
        description
      }
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error('Erro ao criar departamento:', error)
    return new NextResponse('Erro ao criar departamento', { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const { id, name, description } = await req.json()

    if (!id || !name) {
      return new NextResponse('ID e nome são obrigatórios', { status: 400 })
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        description
      }
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error('Erro ao atualizar departamento:', error)
    return new NextResponse('Erro ao atualizar departamento', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const { id } = await req.json()

    if (!id) {
      return new NextResponse('ID é obrigatório', { status: 400 })
    }

    await prisma.department.delete({
      where: { id }
    })

    return new NextResponse('Departamento excluído com sucesso', { status: 200 })
  } catch (error) {
    console.error('Erro ao excluir departamento:', error)
    return new NextResponse('Erro ao excluir departamento', { status: 500 })
  }
} 