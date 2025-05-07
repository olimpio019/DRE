import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        saleItems: {
          include: {
            sale: true
          }
        }
      }
    });

    // Processar dados para o DRE
    const processedProducts = products.map(product => {
      const sales = product.saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const totalCost = product.saleItems.reduce((sum, item) => sum + (product.cost * item.quantity), 0)

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        minStock: product.minStock,
        sales,
        totalCost,
        profit: sales - totalCost
      }
    });

    return NextResponse.json(processedProducts);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log("Dados recebidos na API:", data);

    // Validação dos campos obrigatórios
    const requiredFields = ["name", "description", "price", "cost", "stock", "minStock"];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.error("Campos obrigatórios faltando:", missingFields);
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validação dos tipos
    if (typeof data.name !== "string") {
      console.error("Nome inválido:", data.name);
      return NextResponse.json(
        { error: "Nome deve ser uma string" },
        { status: 400 }
      );
    }

    if (typeof data.description !== "string") {
      console.error("Descrição inválida:", data.description);
      return NextResponse.json(
        { error: "Descrição deve ser uma string" },
        { status: 400 }
      );
    }

    const price = Number(data.price);
    if (isNaN(price) || price < 0) {
      console.error("Preço inválido:", data.price);
      return NextResponse.json(
        { error: "Preço de venda deve ser um número positivo" },
        { status: 400 }
      );
    }

    const cost = Number(data.cost);
    if (isNaN(cost) || cost < 0) {
      console.error("Custo inválido:", data.cost);
      return NextResponse.json(
        { error: "Custo unitário deve ser um número positivo" },
        { status: 400 }
      );
    }

    const stock = Number(data.stock);
    if (isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
      console.error("Estoque inválido:", data.stock);
      return NextResponse.json(
        { error: "Quantidade em estoque deve ser um número inteiro positivo" },
        { status: 400 }
      );
    }

    const minStock = Number(data.minStock);
    if (isNaN(minStock) || !Number.isInteger(minStock) || minStock < 0) {
      console.error("Estoque mínimo inválido:", data.minStock);
      return NextResponse.json(
        { error: "Quantidade mínima deve ser um número inteiro positivo" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price,
        cost,
        stock,
        minStock,
      },
    });

    console.log("Produto criado com sucesso:", product);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    if (error instanceof Error) {
      console.error("Mensagem de erro:", error.message);
      console.error("Stack trace:", error.stack);
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { id, name, description, price, cost, stock, minStock } = data;

    if (!id || !name || !description || !price || !cost || !stock || !minStock) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: Number(price),
        cost: Number(cost),
        stock: Number(stock),
        minStock: Number(minStock),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: any } | null;

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do produto é obrigatório" },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Produto deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 