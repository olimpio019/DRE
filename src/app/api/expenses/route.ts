import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      include: {
        department: true
      },
      orderBy: {
        date: "desc"
      }
    });

    // Processar os dados para garantir que os valores sejam números
    const processedExpenses = expenses.map(expense => ({
      ...expense,
      amount: Number(expense.amount),
      date: expense.date.toISOString()
    }));

    return NextResponse.json(processedExpenses);
  } catch (error) {
    console.error("Erro ao buscar despesas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar despesas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Validar e converter o valor para número
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        amount: amount,
        type: data.type,
        date: new Date(),
        departmentId: data.departmentId
      },
      include: {
        department: true
      }
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Erro ao criar despesa:", error);
    return NextResponse.json(
      { error: "Erro ao criar despesa" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID da despesa não fornecido" },
        { status: 400 }
      );
    }

    await prisma.expense.delete({
      where: {
        id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar despesa:", error);
    return NextResponse.json(
      { error: "Erro ao deletar despesa" },
      { status: 500 }
    );
  }
} 