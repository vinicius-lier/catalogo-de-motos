import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAndProcessImage } from '@/app/utils/imageValidation'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = 10
    const skip = (page - 1) * limit

    const [motorcycles, total] = await Promise.all([
      prisma.motorcycle.findMany({
        include: {
          images: true,
          colors: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: skip
      }),
      prisma.motorcycle.count()
    ])

    return NextResponse.json({
      motorcycles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
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
    
    // Log do request
    console.log('Request headers:', Object.fromEntries(request.headers))
    console.log('Request method:', request.method)

    const formData = await request.formData().catch(e => {
      console.error('Erro ao ler FormData:', e)
      return null
    })

    if (!formData) {
      return NextResponse.json(
        { error: 'Dados do formulário inválidos' },
        { status: 400 }
      )
    }

    // Log de todos os campos
    const formFields = Array.from(formData.entries()).map(([key, value]) => {
      if (value instanceof File) {
        return `${key}: File(${value.name}, ${value.size} bytes, ${value.type})`
      }
      return `${key}: ${value}`
    })
    console.log('Campos recebidos:', formFields)

    // Validar dados obrigatórios
    const name = formData.get('name')?.toString().trim()
    const description = formData.get('description')?.toString().trim()
    const price = formData.get('price')
    const isSold = formData.get('isSold') === 'true'
    const colorsJson = formData.get('colors')
    const images = formData.getAll('images')

    // Log dos dados processados
    console.log('Dados processados:', {
      name,
      description,
      price,
      isSold,
      colorsJson,
      imagesCount: images.length
    })

    // Validações
    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Descrição é obrigatória' },
        { status: 400 }
      )
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json(
        { error: 'Preço deve ser um número válido maior que zero' },
        { status: 400 }
      )
    }

    if (!images.length) {
      return NextResponse.json(
        { error: 'Pelo menos uma imagem é necessária' },
        { status: 400 }
      )
    }

    let colors = []
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
    console.log('Iniciando processamento das imagens')
    const imageResults = await Promise.all(
      images.map(async (file, index) => {
        try {
          console.log(`Processando imagem ${index + 1}:`, file instanceof File ? file.name : 'Não é um arquivo')
          const result = await validateAndProcessImage(file as File)
          console.log(`Resultado do processamento da imagem ${index + 1}:`, result)
          return result
        } catch (error) {
          console.error(`Erro ao processar imagem ${index + 1}:`, error)
          return { success: false, error: 'Erro ao processar imagem' }
        }
      })
    )

    const failedImages = imageResults.filter(result => !result.success)
    if (failedImages.length > 0) {
      console.error('Falha no processamento das imagens:', failedImages)
      return NextResponse.json(
        { error: 'Erro ao processar uma ou mais imagens' },
        { status: 400 }
      )
    }

    // Criar moto no banco
    console.log('Iniciando criação no banco de dados')
    const motorcycle = await prisma.$transaction(async (tx) => {
      try {
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
        const createdColors = await tx.color.createMany({
          data: colors.map(color => ({
            name: color.name,
            hex: color.hex,
            motorcycleId: moto.id
          }))
        })
        console.log('Cores criadas:', createdColors)

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

        return tx.motorcycle.findUnique({
          where: { id: moto.id },
          include: {
            images: true,
            colors: true
          }
        })
      } catch (error) {
        console.error('Erro na transação:', error)
        throw error
      }
    })

    if (!motorcycle) {
      throw new Error('Erro ao criar motocicleta')
    }

    console.log('Moto criada com sucesso:', motorcycle)
    return NextResponse.json(motorcycle)
  } catch (error) {
    console.error('Erro detalhado ao criar motocicleta:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar motocicleta' },
      { status: 500 }
    )
  }
} 