import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'ADMIN'
    const isApiRoute = req.nextUrl.pathname.startsWith('/api')
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
    const isRegisterRoute = req.nextUrl.pathname === '/api/users' && req.method === 'POST'
    const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard')
    const isHomeRoute = req.nextUrl.pathname === '/'

    // Se for a rota inicial, redireciona para o dashboard
    if (isHomeRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Se for a rota de registro, permite o acesso
    if (isRegisterRoute) {
      return NextResponse.next()
    }

    // Se for uma rota de API, permite o acesso
    if (isApiRoute) {
      return NextResponse.next()
    }

    // Se for uma rota de admin, verifica se o usuário é admin
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permite acesso público à rota de registro
        if (req.nextUrl.pathname === '/api/users' && req.method === 'POST') {
          return true
        }
        return !!token
      }
    },
    pages: {
      signIn: '/login'
    }
  }
)

export const config = {
  matcher: [
    '/',
    '/api/:path*',
    '/admin/:path*',
    '/products/:path*',
    '/sales/:path*',
    '/expenses/:path*',
    '/dashboard/:path*'
  ]
} 