import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth/next";
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
export { authOptions } // <-- ADICIONE ESTA LINHA