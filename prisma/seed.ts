const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      license: {
        create: {
          key: 'LICENSE-ADMIN-123',
          status: 'ACTIVE',
          expiresAt: new Date('2025-12-31')
        }
      }
    },
    include: {
      license: true
    }
  })

  console.log("Usuário admin e licença criados:", admin);

  // Criar produto
  const product = await prisma.product.create({
    data: {
      name: "Produto 1",
      description: "Descrição do produto 1",
      price: 100,
      cost: 50,
      stock: 100,
      minStock: 10
    }
  })

  console.log("Produto criado:", product);

  // Criar cliente
  const client = await prisma.client.create({
    data: {
      name: "Cliente 1",
      email: "cliente1@example.com",
      phone: "11999999999",
      address: "Rua Exemplo, 123"
    }
  })

  console.log("Cliente criado:", client);
}

main()
  .catch((e) => {
    console.error("Erro durante o seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 