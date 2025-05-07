import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Limpar dados existentes
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.product.deleteMany();
    await prisma.department.deleteMany();
    await prisma.client.deleteMany();

    // Criar departamentos
    const departments = await Promise.all([
      prisma.department.create({
        data: {
          name: "Vendas",
          description: "Departamento de vendas",
          expenses: 5000
        }
      }),
      prisma.department.create({
        data: {
          name: "Marketing",
          description: "Departamento de marketing",
          expenses: 3000
        }
      }),
      prisma.department.create({
        data: {
          name: "TI",
          description: "Departamento de tecnologia",
          expenses: 4000
        }
      })
    ]);

    // Criar produtos
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: "Produto A",
          description: "Descrição do Produto A",
          price: 100,
          cost: 60,
          stock: 100,
          minStock: 20
        }
      }),
      prisma.product.create({
        data: {
          name: "Produto B",
          description: "Descrição do Produto B",
          price: 150,
          cost: 90,
          stock: 80,
          minStock: 15
        }
      }),
      prisma.product.create({
        data: {
          name: "Produto C",
          description: "Descrição do Produto C",
          price: 200,
          cost: 120,
          stock: 50,
          minStock: 10
        }
      })
    ]);

    // Criar clientes
    const clients = await Promise.all([
      prisma.client.create({
        data: {
          name: "Cliente A",
          email: "clienteA@email.com",
          phone: "11999999999"
        }
      }),
      prisma.client.create({
        data: {
          name: "Cliente B",
          email: "clienteB@email.com",
          phone: "11988888888"
        }
      }),
      prisma.client.create({
        data: {
          name: "Cliente C",
          email: "clienteC@email.com",
          phone: "11977777777"
        }
      })
    ]);

    // Criar despesas
    const expenses = await Promise.all([
      // Despesas Operacionais
      prisma.expense.create({
        data: {
          description: "Aluguel",
          amount: 5000,
          type: "Operational",
          date: new Date(),
          departmentId: departments[0].id
        }
      }),
      prisma.expense.create({
        data: {
          description: "Energia",
          amount: 2000,
          type: "Operational",
          date: new Date(),
          departmentId: departments[0].id
        }
      }),
      // Despesas Administrativas
      prisma.expense.create({
        data: {
          description: "Salários",
          amount: 15000,
          type: "Administrative",
          date: new Date(),
          departmentId: departments[1].id
        }
      }),
      prisma.expense.create({
        data: {
          description: "Material de Escritório",
          amount: 1000,
          type: "Administrative",
          date: new Date(),
          departmentId: departments[1].id
        }
      }),
      // Despesas Financeiras
      prisma.expense.create({
        data: {
          description: "Juros",
          amount: 2000,
          type: "Financial",
          date: new Date(),
          departmentId: departments[2].id
        }
      }),
      prisma.expense.create({
        data: {
          description: "Taxas Bancárias",
          amount: 500,
          type: "Financial",
          date: new Date(),
          departmentId: departments[2].id
        }
      }),
      // Outras Despesas
      prisma.expense.create({
        data: {
          description: "Manutenção",
          amount: 1500,
          type: "Other",
          date: new Date(),
          departmentId: departments[0].id
        }
      }),
      prisma.expense.create({
        data: {
          description: "Seguros",
          amount: 1000,
          type: "Other",
          date: new Date(),
          departmentId: departments[0].id
        }
      })
    ]);

    // Criar vendas
    const sales = await Promise.all([
      prisma.sale.create({
        data: {
          clientId: clients[0].id,
          total: 500,
          status: "Completed",
          items: {
            create: [
              {
                productId: products[0].id,
                quantity: 2,
                price: 100,
                cost: 60
              },
              {
                productId: products[1].id,
                quantity: 2,
                price: 150,
                cost: 90
              }
            ]
          }
        }
      }),
      prisma.sale.create({
        data: {
          clientId: clients[1].id,
          total: 400,
          status: "Completed",
          items: {
            create: [
              {
                productId: products[0].id,
                quantity: 4,
                price: 100,
                cost: 60
              }
            ]
          }
        }
      }),
      prisma.sale.create({
        data: {
          clientId: clients[2].id,
          total: 600,
          status: "Completed",
          items: {
            create: [
              {
                productId: products[1].id,
                quantity: 2,
                price: 150,
                cost: 90
              },
              {
                productId: products[2].id,
                quantity: 1.5,
                price: 200,
                cost: 120
              }
            ]
          }
        }
      })
    ]);

    return NextResponse.json({
      message: "Dados de exemplo criados com sucesso",
      departments,
      products,
      clients,
      expenses,
      sales
    });
  } catch (error) {
    console.error("Erro ao criar dados de exemplo:", error);
    return NextResponse.json(
      { error: "Erro ao criar dados de exemplo" },
      { status: 500 }
    );
  }
} 