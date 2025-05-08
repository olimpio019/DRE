import { prisma } from './prisma'

export async function updateRanking(userId: string, points: number) {
  // Atualiza ou cria o ranking do usuário
  const userRanking = await prisma.ranking.upsert({
    where: { userId },
    update: {
      points: {
        increment: points
      }
    },
    create: {
      userId,
      points,
      position: 0 // Será atualizado abaixo
    }
  })

  // Recalcula as posições de todos os usuários
  const rankings = await prisma.ranking.findMany({
    orderBy: {
      points: 'desc'
    }
  })

  // Atualiza as posições
  for (let i = 0; i < rankings.length; i++) {
    await prisma.ranking.update({
      where: { id: rankings[i].id },
      data: { position: i + 1 }
    })
  }

  return userRanking
}

export async function getTopRankings(limit: number = 10) {
  return prisma.ranking.findMany({
    take: limit,
    orderBy: {
      points: 'desc'
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })
} 