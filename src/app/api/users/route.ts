import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { hash } from 'bcryptjs'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return new NextResponse('Erro interno do servidor', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    console.log("Tentando registrar usuário:", { name, email, role });

    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("Usuário já existe:", email);
      return NextResponse.json(
        { error: "Usuário já existe" },
        { status: 400 }
      );
    }

    // Hash da senha com 12 rounds
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("Senha hasheada com sucesso");

    // Cria o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
      },
    });
    console.log("Usuário criado com sucesso:", { id: user.id, email: user.email });

    // Remove a senha do objeto retornado
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    
    // Verifica se é um erro do Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar usuário. Por favor, tente novamente." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const body = await request.json()
    const { id, name, email, role } = body

    if (!id || !name || !email || !role) {
      return new NextResponse('Dados incompletos', { status: 400 })
    }

    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        name,
        email,
        role,
      },
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
  
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }
  
    return NextResponse.json(
      { error: "Erro ao criar usuário. Por favor, tente novamente." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('ID não fornecido', { status: 400 })
    }

    await prisma.user.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ message: 'Usuário excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return new NextResponse('Erro interno do servidor', { status: 500 })
  }
} 