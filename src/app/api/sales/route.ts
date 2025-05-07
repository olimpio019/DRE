import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        client: true,
        department: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Erro ao buscar vendas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vendas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    const { clientId, items } = body;

    if (!clientId || !items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse("Dados incompletos", { status: 400 });
    }

    // Verificar se o cliente existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return new NextResponse("Cliente não encontrado", { status: 404 });
    }

    // Verificar estoque e calcular total
    let total = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return new NextResponse(`Produto não encontrado: ${item.productId}`, { status: 404 });
      }

      if (product.stock < item.quantity) {
        return new NextResponse(`Estoque insuficiente para o produto: ${product.name}`, { status: 400 });
      }

      total += product.price * item.quantity;
    }

    // Criar venda e itens
    const sale = await prisma.sale.create({
      data: {
        clientId,
        total,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Atualizar estoque
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Erro ao criar venda:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return new NextResponse("Dados incompletos", { status: 400 });
    }

    const sale = await prisma.sale.update({
      where: { id },
      data: { status },
      include: {
        items: true,
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Erro ao atualizar venda:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("ID não fornecido", { status: 400 });
    }

    // Verificar se a venda existe
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      return new NextResponse("Venda não encontrada", { status: 404 });
    }

    // Restaurar estoque
    for (const item of sale.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    // Excluir venda
    await prisma.sale.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Venda excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir venda:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 