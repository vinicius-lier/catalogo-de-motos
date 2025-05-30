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

// Adicionar no topo do arquivo, após os imports
interface FileData {
  name: string
  type: string
  size: number
  arrayBuffer(): Promise<ArrayBuffer>
}

const isValidFileData = (value: any): value is FileData => {
  return (
    value != null &&
    typeof value === 'object' &&
    'name' in value &&
    'size' in value &&
    'type' in value &&
    typeof value.arrayBuffer === 'function'
  )
}

interface ImageData {
  base64: string;
  name: string;
  type: string;
}

const motorcycleSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  isSold: z.boolean().optional().default(false),
  colors: z.array(z.object({
    name: z.string(),
    hex: z.string()
  })),
  images: z.array(z.object({
    base64: z.string(),
    name: z.string(),
    type: z.string()
  })).min(1)
})

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

    console.log('Motorcycles do banco:', JSON.stringify(motorcycles, null, 2))

    // Tratamento para garantir que images sempre exista e só tenha imagens válidas
    const motorcyclesSafe = motorcycles.map((moto) => ({
      ...moto,
      images: Array.isArray(moto.images)
        ? moto.images.filter(img => img && typeof img.base64 === 'string' && img.base64.length > 0)
        : []
    }))

    console.log(`Encontradas ${motorcyclesSafe.length} motocicletas`)

    const total = await prisma.motorcycle.count()
    const totalPages = Math.ceil(total / limit)

    console.log('Informações de paginação:', { total, totalPages, currentPage: pageNumber })

    return NextResponse.json({
      data: motorcyclesSafe,
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
  console.log('=== Iniciando rota POST /api/motorcycles ===')
  
  try {
    // Testar conexão com o banco
    try {
      console.log('Testando conexão com o banco...')
      await prisma.$connect()
      console.log('Conexão com o banco estabelecida com sucesso')
    } catch (dbError) {
      console.error('Erro ao conectar com o banco:', {
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : 'Erro desconhecido',
        code: dbError instanceof Error ? (dbError as any).code : undefined,
        meta: dbError instanceof Error ? (dbError as any).meta : undefined
      })
      throw new Error('Erro de conexão com o banco de dados')
    }

    console.log('Obtendo dados da requisição...')
    const data = await request.json()
    console.log('Dados recebidos:', {
      ...data,
      images: data.images?.map((img: any) => ({
        name: img.name,
        type: img.type,
        size: Math.round(img.base64.length * 0.75) // Estimativa do tamanho em bytes
      }))
    })

    // Validar dados com Zod
    const validationResult = motorcycleSchema.safeParse(data)
    if (!validationResult.success) {
      console.error('Erro de validação:', validationResult.error)
      return NextResponse.json(
        { error: 'Dados inválidos: ' + validationResult.error.message },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Criar moto com transaction
    try {
      const motorcycle = await prisma.$transaction(async (tx) => {
        // Criar moto
        const moto = await tx.motorcycle.create({
          data: {
            name: validatedData.name,
            description: validatedData.description,
            price: validatedData.price,
            isSold: validatedData.isSold
          }
        })

        // Adicionar cores
        if (validatedData.colors.length > 0) {
          await tx.color.createMany({
            data: validatedData.colors.map(color => ({
              name: color.name,
              hex: color.hex,
              motorcycleId: moto.id
            }))
          })
        }

        // Adicionar imagens (base64)
        if (validatedData.images.length > 0) {
          await tx.image.createMany({
            data: validatedData.images.map(img => ({
              base64: img.base64,
              motorcycleId: moto.id
            }))
          })
        }

        // Retornar moto com relacionamentos
        return tx.motorcycle.findUnique({
          where: { id: moto.id },
          include: {
            images: true,
            colors: true
          }
        })
      })

      return NextResponse.json({ data: motorcycle })
    } catch (error) {
      console.error('Erro ao criar moto:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      })
      return NextResponse.json(
        { error: 'Erro ao criar moto. Por favor, tente novamente.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro geral:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Erro interno do servidor. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
} 