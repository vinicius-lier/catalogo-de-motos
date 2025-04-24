import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAndProcessImage } from '@/app/utils/imageValidation'

export async function GET() {
  try {
    const motorcycles = await prisma.motorcycle.findMany({
      include: {
        images: true,
        colors: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(motorcycles)
  } catch (error) {
    console.error('Erro ao buscar motos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar motos' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('Iniciando processamento da requisição POST')
    
    // Verificar método
    if (request.method !== 'POST') {
      console.error('Método inválido:', request.method)
      return NextResponse.json(
        { error: `Método ${request.method} não permitido` },
        { status: 405 }
      )
    }

    const formData = await request.formData().catch(e => {
      console.error('Erro ao ler FormData:', e)
      return null
    })

    if (!formData) {
      console.error('FormData não pôde ser lido')
      return NextResponse.json(
        { error: 'Dados do formulário inválidos' },
        { status: 400 }
      )
    }
    
    // Log detalhado de todos os campos recebidos
    console.log('Campos recebidos no FormData:', Array.from(formData.entries()).map(([key, value]) => {
      if (value instanceof File) {
        return `${key}: File(${value.name}, ${value.size} bytes, ${value.type})`
      }
      return `${key}: ${value}`
    }))
    
    // Validar dados obrigatórios
    const name = formData.get('name')?.toString().trim()
    const description = formData.get('description')?.toString().trim()
    const price = formData.get('price')
    const isSold = formData.get('isSold') === 'true'
    const colorsJson = formData.get('colors')
    const images = formData.getAll('images')

    // Validações específicas
    if (!name) {
      console.error('Nome não fornecido')
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!description) {
      console.error('Descrição não fornecida')
      return NextResponse.json(
        { error: 'Descrição é obrigatória' },
        { status: 400 }
      )
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      console.error('Preço inválido:', price)
      return NextResponse.json(
        { error: 'Preço deve ser um número válido maior que zero' },
        { status: 400 }
      )
    }

    if (!images.length) {
      console.error('Nenhuma imagem fornecida')
      return NextResponse.json(
        { error: 'Pelo menos uma imagem é necessária' },
        { status: 400 }
      )
    }

    let colors: { name: string; hex: string }[] = []
    try {
      colors = colorsJson ? JSON.parse(colorsJson.toString()) : []
      if (!Array.isArray(colors) || colors.length === 0) {
        throw new Error('Array de cores vazio ou inválido')
      }
    } catch (e) {
      console.error('Erro ao processar cores:', e)
      return NextResponse.json(
        { error: 'Formato de cores inválido' },
        { status: 400 }
      )
    }

    // Processar imagens
    const imageResults = await Promise.all(
      images.map(async (file, index) => {
        console.log(`Processando imagem ${index + 1}:`, file)
        const result = await validateAndProcessImage(file as File)
        console.log(`Resultado do processamento da imagem ${index + 1}:`, result)
        return result
      })
    )

    const failedImages = imageResults.filter(result => !result.success)
    if (failedImages.length > 0) {
      console.log('Falha no processamento das imagens:', failedImages)
      return NextResponse.json(
        { error: failedImages[0].error },
        { status: 400 }
      )
    }

    // Criar a moto no banco com transaction
    console.log('Iniciando transação no banco de dados')
    const motorcycle = await prisma.$transaction(async (tx) => {
      // Criar moto
      const moto = await tx.motorcycle.create({
        data: {
          name,
          description,
          price: Number(price),
          isSold
        }
      })
      console.log('Moto criada:', moto)

      // Criar cores
      if (colors.length > 0) {
        const createdColors = await tx.color.createMany({
          data: colors.map(color => ({
            name: color.name,
            hex: color.hex,
            motorcycleId: moto.id
          }))
        })
        console.log('Cores criadas:', createdColors)
      }

      // Criar imagens
      const createdImages = await tx.image.createMany({
        data: imageResults
          .filter((result): result is { success: true; url: string } => result.success && !!result.url)
          .map(result => ({
            url: result.url!,
            motorcycleId: moto.id
          }))
      })
      console.log('Imagens criadas:', createdImages)

      // Retornar moto com relacionamentos
      return tx.motorcycle.findUnique({
        where: { id: moto.id },
        include: {
          images: true,
          colors: true
        }
      })
    })

    console.log('Moto criada com sucesso:', motorcycle)
    return NextResponse.json(motorcycle)
  } catch (error) {
    console.error('Erro detalhado ao criar motocicleta:', error)
    return NextResponse.json(
      { error: 'Erro ao criar motocicleta' },
      { status: 500 }
    )
  }
} 