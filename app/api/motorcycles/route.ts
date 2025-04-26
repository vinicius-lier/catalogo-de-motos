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
  success: boolean;
  error?: string;
  url?: string;
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
  colors: z.array(ColorSchema)
})

type ValidationError = {
  message: string
  field?: string
}

export async function GET(request: Request) {
  try {
    console.log('=== Iniciando busca de motocicletas ===')
    
    const url = new URL(request.url)
    const page = url.searchParams.get('page')
    const pageNumber = page ? parseInt(page) : 1
    const limit = 10
    const skip = (pageNumber - 1) * limit

    console.log('Parâmetros de paginação:', { pageNumber, limit, skip })

    // Teste de conexão com o banco
    try {
      await prisma.$connect()
      console.log('Conexão com o banco estabelecida com sucesso')
    } catch (dbError) {
      console.error('Erro ao conectar com o banco:', dbError)
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      )
    }

    const motorcycles = await prisma.motorcycle.findMany({
      skip,
      take: limit,
      include: {
        colors: true,
        images: true
      }
    })

    console.log(`Encontradas ${motorcycles.length} motocicletas`)

    const total = await prisma.motorcycle.count()
    const totalPages = Math.ceil(total / limit)

    console.log('Informações de paginação:', { total, totalPages, currentPage: pageNumber })

    return NextResponse.json({
      data: motorcycles,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems: total
      }
    })

  } catch (error) {
    console.error('Erro detalhado ao buscar motocicletas:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { error: 'Erro ao buscar motocicletas. Por favor, tente novamente mais tarde.' },
      { status: 500 }
    )
  } finally {
    try {
      await prisma.$disconnect()
      console.log('Desconectado do banco com sucesso')
    } catch (disconnectError) {
      console.error('Erro ao desconectar do banco:', disconnectError)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Iniciando processamento da requisição POST ===')
    
    // Log do request
    const headers = Object.fromEntries(request.headers)
    console.log('Request headers:', {
      'content-type': headers['content-type'],
      'content-length': headers['content-length'],
      'all-headers': headers // Adicionando todos os headers para debug
    })

    // Verificar content-type
    if (!headers['content-type']?.includes('multipart/form-data')) {
      console.error('Content-type inválido:', headers['content-type'])
      return NextResponse.json(
        { error: 'Content-type deve ser multipart/form-data' },
        { status: 400 }
      )
    }

    // Teste de conexão com o banco antes de prosseguir
    try {
      await prisma.$connect()
      console.log('Conexão com o banco estabelecida com sucesso')
    } catch (dbError) {
      console.error('Erro ao conectar com o banco:', dbError)
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
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
          
          return await processImage(image)
        })
      )

      // Verificar se alguma imagem falhou no processamento
      const failedImages = processedImages.filter(img => !img.success)
      if (failedImages.length > 0) {
        console.error('Falha ao processar algumas imagens:', failedImages)
        return NextResponse.json(
          { error: 'Erro ao processar imagens: ' + failedImages.map(img => img.error).join(', ') },
          { status: 400 }
        )
      }

      const successfulImages = processedImages.filter((img): img is ImageResult & { success: true, url: string } => img.success && !!img.url)
      
      if (successfulImages.length === 0) {
        console.error('Nenhuma imagem foi processada com sucesso')
        return NextResponse.json(
          { error: 'Nenhuma imagem foi processada com sucesso' },
          { status: 400 }
        )
      }
      
      console.log('=== Todas as imagens processadas com sucesso ===', {
        quantidade: successfulImages.length,
        urls: successfulImages.map(img => img.url)
      })

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
                create: successfulImages.map((img) => ({
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
      console.error('Erro ao processar imagens:', {
        mensagem: error.message,
        stack: error.stack
      })
      return NextResponse.json(
        { error: 'Erro ao processar imagens: ' + error.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erro detalhado na rota POST:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      meta: error?.meta
    })
    return NextResponse.json(
      { error: 'Erro ao processar requisição: ' + (error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  } finally {
    try {
      await prisma.$disconnect()
      console.log('Desconectado do banco com sucesso')
    } catch (disconnectError) {
      console.error('Erro ao desconectar do banco:', disconnectError)
    }
  }
}

async function processImage(file: FormDataEntryValue): Promise<ImageResult> {
  if (!(file instanceof File)) {
    return {
      success: false,
      error: 'Dado recebido não é um arquivo'
    }
  }

  try {
    const result = await validateAndProcessImage(file)
    return result
  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    return {
      success: false,
      error: 'Erro ao processar imagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }
} 