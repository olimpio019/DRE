import { NextResponse } from 'next/server'
import { getTopRankings } from '@/lib/ranking'

export async function GET() {
  try {
    const rankings = await getTopRankings()
    return NextResponse.json(rankings)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar ranking' },
      { status: 500 }
    )
  }
} 