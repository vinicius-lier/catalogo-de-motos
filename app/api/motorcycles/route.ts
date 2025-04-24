import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAndProcessImage } from '@/app/utils/imageValidation'

interface Color {
  name: string;
  hex: string;
}

interface ImageResult {
  success: boolean;
  error?: string;
  url?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = 10
    const skip = (page - 1) * limit

    console.log('=== Buscando motos ===', { page, limit, skip })

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
    ]).catch(error => {
      console.error('Erro ao buscar do banco:', error)
      return [[], 0]
    })

    const totalPages = Math.ceil(total / limit)
    const response = {
      motorcycles: motorcycles || [],
      totalPages: totalPages || 1,
      currentPage: page,
      total: total || 0
    }

    console.log('=== Resposta da API ===', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar motos:', error)
    return NextResponse.json({
      motorcycles: [],
      totalPages: 1,
      currentPage: 1,
      total: 0,
      error: 'Erro ao buscar motos'
    })
  }
}

export async function POST(request: Request) {
  try {
    console.log('=== Iniciando processamento da requisição POST ===')
    
    // Log do request
    const headers = Object.fromEntries(request.headers)
    console.log('Request headers:', {
      'content-type': headers['content-type'],
      'content-length': headers['content-length']
    })

    // Verificar content-type
    if (!headers['content-type']?.includes('multipart/form-data')) {
      console.error('Content-type inválido:', headers['content-type'])
      return NextResponse.json(
        { error: 'Content-type deve ser multipart/form-data' },
        { status: 400 }
      )
    }

    // Ler FormData
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error: any) {
      console.error('Erro ao ler FormData:', error)
      return NextResponse.json(
        { error: 'Erro ao ler dados do formulário' },
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
    console.log('=== Campos recebidos ===', formFields)

    // Extrair e validar campos
    const name = formData.get('name')?.toString().trim()
    const description = formData.get('description')?.toString().trim()
    const price = formData.get('price')?.toString()
    const isSold = formData.get('isSold') === 'true'
    const colorsJson = formData.get('colors')?.toString()
    const images = formData.getAll('images')

    // Log dos dados extraídos
    console.log('=== Dados extraídos ===', {
      name,
      description,
      price,
      isSold,
      colorsJson,
      imagesCount: images.length
    })

    // Validações detalhadas
    const errors = []
    if (!name) errors.push('Nome é obrigatório')
    if (!description) errors.push('Descrição é obrigatória')
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      errors.push('Preço deve ser um número válido maior que zero')
    }
    if (!images.length) errors.push('Pelo menos uma imagem é necessária')
    
    // Validar cores
    let colors: Color[] = []
    try {
      if (!colorsJson) throw new Error('Cores não fornecidas')
      const parsedColors = JSON.parse(colorsJson)
      if (!Array.isArray(parsedColors) || parsedColors.length === 0) {
        throw new Error('Array de cores vazio ou inválido')
      }
      parsedColors.forEach((color: any) => {
        if (!color.name || !color.hex) {
          throw new Error('Cor com dados incompletos')
        }
      })
      colors = parsedColors
    } catch (error: any) {
      errors.push(`Erro nas cores: ${error.message}`)
    }

    if (errors.length > 0) {
      console.error('Erros de validação:', errors)
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      )
    }

    // Processar imagens
    console.log('=== Iniciando processamento das imagens ===')
    const imageResults = await Promise.all(
      images.map(async (file, index) => {
        try {
          if (!(file instanceof File)) {
            throw new Error('Dado recebido não é um arquivo')
          }
          
          console.log(`Processando imagem ${index + 1}:`, {
            name: file.name,
            type: file.type,
            size: file.size
          })
          
          const result = await validateAndProcessImage(file)
          console.log(`Resultado do processamento da imagem ${index + 1}:`, result)
          return result as ImageResult
        } catch (error: any) {
          console.error(`Erro ao processar imagem ${index + 1}:`, error)
          return { 
            success: false, 
            error: error.message || 'Erro ao processar imagem' 
          } as ImageResult
        }
      })
    )

    const failedImages = imageResults.filter(result => !result.success)
    if (failedImages.length > 0) {
      console.error('Falha no processamento das imagens:', failedImages)
      return NextResponse.json(
        { error: 'Erro ao processar uma ou mais imagens: ' + failedImages.map(img => img.error).join(', ') },
        { status: 400 }
      )
    }

    // Criar moto no banco
    console.log('=== Iniciando criação no banco de dados ===')
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
      throw new Error('Erro ao criar motocicleta no banco de dados')
    }

    console.log('=== Moto criada com sucesso ===', motorcycle)
    return NextResponse.json(motorcycle)
  } catch (error) {
    console.error('=== Erro detalhado ao criar motocicleta ===', {
      message: error.message,
      stack: error.stack,
      error
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar motocicleta' },
      { status: 500 }
    )
  }
} 