import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAndProcessImage } from '@/app/utils/imageValidation'
import { Motorcycle } from '@prisma/client'
import { NextRequest } from 'next/server'
import { z } from 'zod'

interface Color {
  name: string;
  hex: string;
}

interface ImageResult {
  url: string;
  publicId: string;
}

interface ApiResponse {
  data: {
    message?: string;
    motorcycle?: any;
    motorcycles?: any[];
    totalPages?: number;
    currentPage?: number;
    total?: number;
    error?: string;
  }
}

interface ApiError {
  message: string;
}

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

function isImageResult(result: unknown): result is ImageResult {
  return typeof result === 'object' && result !== null && 'success' in result
}

// Definindo o schema para validação
const ColorSchema = z.object({
  name: z.string(),
  hex: z.string()
})

const MotorcycleSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.string().transform(val => Number(val)),
  isSold: z.boolean(),
  colors: z.array(ColorSchema),
  images: z.array(z.instanceof(File))
})

type ValidationError = {
  message: string
  field?: string
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = url.searchParams.get('page')
    const pageNumber = page ? parseInt(page) : 1
    const limit = 10
    const skip = (pageNumber - 1) * limit

    const motorcycles = await prisma.motorcycle.findMany({
      skip,
      take: limit,
      include: {
        colors: true,
        images: true
      }
    })

    const total = await prisma.motorcycle.count()
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: motorcycles,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems: total
      }
    })

  } catch (error) {
    console.error('Erro ao buscar motocicletas:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao buscar motocicletas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      console.log('FormData recebido com sucesso')
    } catch (error: any) {
      console.error('Erro ao ler FormData:', error)
      return NextResponse.json(
        { error: 'Erro ao ler dados do formulário' },
        { status: 400 }
      )
    }

    // Log de todos os campos
    console.log('=== Campos recebidos ===')
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (value instanceof File) {
        console.log(`${key}:`, {
          name: value.name,
          type: value.type,
          size: `${(value.size / (1024 * 1024)).toFixed(2)}MB`,
          lastModified: new Date(value.lastModified).toISOString()
        })
      } else {
        console.log(`${key}:`, value)
      }
    })

    // Extrair e validar campos
    const nameField = formData.get('name')
    const descriptionField = formData.get('description')
    const priceField = formData.get('price')
    const isSold = formData.get('isSold') === 'true'
    const colorsJson = formData.get('colors')?.toString()
    const images = formData.getAll('images')

    console.log('=== Validação inicial dos campos ===', {
      namePresente: !!nameField,
      descriptionPresente: !!descriptionField,
      pricePresente: !!priceField,
      isSold,
      colorsJsonPresente: !!colorsJson,
      quantidadeImagens: images.length
    })

    // Validar campos obrigatórios
    if (!nameField || !descriptionField || !priceField) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    const name = nameField.toString().trim()
    const description = descriptionField.toString().trim()
    const price = priceField.toString()

    // Log dos dados extraídos
    console.log('=== Dados extraídos e normalizados ===', {
      name: {
        valor: name,
        tamanho: name.length,
        temEspacosExtras: name !== name.trim()
      },
      description: {
        valor: description,
        tamanho: description.length,
        temEspacosExtras: description !== description.trim()
      },
      price: {
        valor: price,
        numeroValido: !isNaN(Number(price)),
        valorNumerico: Number(price)
      },
      isSold,
      colorsJson: {
        tamanho: colorsJson?.length || 0,
        conteudo: colorsJson
      },
      imagens: {
        quantidade: images.length,
        tipos: images.map(img => img instanceof File ? img.type : 'não é arquivo')
      }
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
      if (!colorsJson) {
        console.error('Cores não fornecidas')
        throw new Error('Cores não fornecidas')
      }
      
      console.log('=== Processando JSON de cores ===')
      const parsedColors = JSON.parse(colorsJson)
      console.log('JSON de cores parseado:', parsedColors)
      
      if (!Array.isArray(parsedColors) || parsedColors.length === 0) {
        console.error('Array de cores inválido:', {
          éArray: Array.isArray(parsedColors),
          tamanho: Array.isArray(parsedColors) ? parsedColors.length : 'N/A',
          tipo: typeof parsedColors
        })
        throw new Error('Array de cores vazio ou inválido')
      }

      colors = parsedColors.map((color, index) => {
        console.log(`Validando cor ${index + 1}:`, color)
        if (!color.name || !color.hex || typeof color.name !== 'string' || typeof color.hex !== 'string') {
          const erro = {
            temNome: !!color.name,
            tipoNome: typeof color.name,
            temHex: !!color.hex,
            tipoHex: typeof color.hex
          }
          console.error(`Cor ${index + 1} inválida:`, erro)
          throw new Error(`Cor ${index + 1} com dados incompletos`)
        }
        return { name: color.name, hex: color.hex }
      })
      
      console.log('Cores validadas com sucesso:', colors)
    } catch (error: any) {
      console.error('Erro ao processar cores:', error)
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
    console.log('=== Iniciando processamento de imagens ===', {
      quantidadeImagens: images.length,
      tiposImagens: images.map(img => img instanceof File ? img.type : 'não é arquivo'),
      tamanhosImagens: images.map(img => img instanceof File ? `${(img.size / (1024 * 1024)).toFixed(2)}MB` : 'N/A')
    })

    let processedImages: ImageResult[] = []
    try {
      processedImages = await Promise.all(
        images.map(async (image, index) => {
          console.log(`Processando imagem ${index + 1}:`, {
            nome: image instanceof File ? image.name : 'não é arquivo',
            tipo: image instanceof File ? image.type : 'N/A',
            tamanho: image instanceof File ? `${(image.size / (1024 * 1024)).toFixed(2)}MB` : 'N/A'
          })
          
          const result = await processImage(image)
          console.log(`Imagem ${index + 1} processada com sucesso:`, {
            url: result.url,
            publicId: result.publicId
          })
          return result
        })
      )
      
      console.log('=== Todas as imagens processadas com sucesso ===', {
        quantidade: processedImages.length,
        urls: processedImages.map(img => img.url),
        publicIds: processedImages.map(img => img.publicId)
      })
    } catch (error: any) {
      console.error('Erro ao processar imagens:', {
        mensagem: error.message,
        stack: error.stack
      })
      throw error
    }

    // Criar moto no banco de dados
    console.log('=== Iniciando criação no banco de dados ===')
    try {
      const result = await prisma.$transaction(async (tx) => {
        console.log('Criando registro da moto...')
        const motorcycle = await tx.motorcycle.create({
          data: {
            name,
            description,
            price: Number(price),
            isSold,
            colors: {
              create: colors.map(color => ({
                name: color.name,
                hex: color.hex
              }))
            },
            images: {
              create: processedImages.map((img) => ({
                url: img.url
              }))
            }
          },
          include: {
            colors: true,
            images: true
          }
        })
        console.log('Moto criada com sucesso:', motorcycle)

        return {
          motorcycle,
          colors: motorcycle.colors,
          images: motorcycle.images,
        }
      })

      console.log('=== Operação concluída com sucesso ===', result)
      return NextResponse.json({
        data: {
          message: 'Motocicleta criada com sucesso',
          motorcycle: result.motorcycle
        }
      } as ApiResponse)
    } catch (error: any) {
      console.error('Erro na operação do banco de dados:', {
        mensagem: error.message,
        codigo: error.code,
        stack: error.stack
      })
      throw error
    }
  } catch (error: any) {
    console.error('Erro geral na rota POST:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}

async function processImage(file: FormDataEntryValue): Promise<ImageResult> {
  if (!(file instanceof File)) {
    throw new Error('Dado recebido não é um arquivo')
  }

  try {
    const result = await validateAndProcessImage(file)
    
    if (!result.success || !result.url) {
      console.error('Erro ao processar imagem:', result.error)
      throw new Error(result.error || 'Erro ao processar imagem')
    }

    return {
      url: result.url,
      publicId: result.url // Usando a URL como publicId por enquanto
    }
  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    throw new Error('Erro ao processar imagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
  }
} 