import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Verificar se é uma rota da API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Validar tamanho do payload
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit
      return NextResponse.json(
        { error: 'Payload muito grande' },
        { status: 413 }
      )
    }

    // Adicionar headers de segurança
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
  }

  return NextResponse.next()
} 