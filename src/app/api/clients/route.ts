import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return new NextResponse('Erro interno do servidor', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, address } = body

    if (!name || !email || !phone) {
      return new NextResponse('Dados incompletos', { status: 400 })
    }

    const existingClient = await prisma.client.findUnique({
      where: {
        email,
      },
    })

    if (existingClient) {
      return new NextResponse('Email já cadastrado', { status: 400 })
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
      },
    })

    return NextResponse.json({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
    })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return new NextResponse('Erro interno do servidor', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const body = await request.json()
    const { id, name, email, phone, address } = body

    if (!id || !name || !email || !phone) {
      return new NextResponse('Dados incompletos', { status: 400 })
    }

    const client = await prisma.client.update({
      where: {
        id,
      },
      data: {
        name,
        email,
        phone,
        address,
      },
    })

    return NextResponse.json({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
    })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return new NextResponse('Erro interno do servidor', { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('ID não fornecido', { status: 400 })
    }

    await prisma.client.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ message: 'Cliente excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    return new NextResponse('Erro interno do servidor', { status: 500 })
  }
} 