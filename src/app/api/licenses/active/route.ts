import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const license = await prisma.license.findFirst({
      where: {
        status: "ACTIVE",
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        expiresAt: "desc",
      },
    });

    if (!license) {
      return new NextResponse("Nenhuma licença ativa encontrada", { status: 404 });
    }

    return NextResponse.json({
      key: license.key,
      expiresAt: license.expiresAt,
    });
  } catch (error) {
    console.error("Erro ao obter licença ativa:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 