import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { validateAndProcessImage } from '@/app/utils/imageValidation'
import type { FileData } from '@/app/utils/imageValidation'

interface ImageData {
  url?: string;
  base64?: string;
  name: string;
  type: string;
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Usar transaction para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      // Buscar moto com imagens
      const motorcycle = await tx.motorcycle.findUnique({
        where: { id: context.params.id },
        include: { images: true }
      })

      if (!motorcycle) {
        throw new Error('NOT_FOUND')
      }

      // Deletar do banco (cascade delete irá remover imagens e cores)
      await tx.motorcycle.delete({
        where: { id: context.params.id }
      })

      return motorcycle
    })

    // Deletar arquivos físicos após commit da transaction
    for (const image of result.images) {
      try {
        const filepath = join(process.cwd(), 'public', image.url)
        await unlink(filepath)
      } catch (error) {
        console.error('Erro ao deletar arquivo:', error)
        // Não falhar se arquivo não puder ser deletado
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'Motocicleta não encontrada' },
        { status: 404 }
      )
    }

    console.error('Erro ao deletar motocicleta:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar motocicleta' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const isSold = formData.get('isSold') === 'true'

    const motorcycle = await prisma.motorcycle.update({
      where: { id: context.params.id },
      data: { isSold },
      include: {
        images: true,
        colors: true
      }
    })

    return NextResponse.json(motorcycle)
  } catch (error) {
    console.error('Erro ao atualizar motocicleta:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar motocicleta' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Verificar se a moto existe
    const existingMotorcycle = await prisma.motorcycle.findUnique({
      where: { id: context.params.id },
      include: { images: true }
    })

    if (!existingMotorcycle) {
      return NextResponse.json(
        { error: 'Motocicleta não encontrada' },
        { status: 404 }
      )
    }

    const data = await request.json()
    
    // Validar dados obrigatórios
    const { name, description, price, isSold, colors, images } = data

    if (!name || !description || !price) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Validar preço
    const priceNumber = Number(price)
    if (isNaN(priceNumber) || priceNumber <= 0) {
      return NextResponse.json(
        { error: 'Preço inválido' },
        { status: 400 }
      )
    }

    // Validar cores
    if (!Array.isArray(colors)) {
      return NextResponse.json(
        { error: 'Formato de cores inválido' },
        { status: 400 }
      )
    }

    for (const color of colors) {
      if (!color.name || !color.hex || typeof color.name !== 'string' || typeof color.hex !== 'string') {
        return NextResponse.json(
          { error: 'Dados de cor inválidos' },
          { status: 400 }
        )
      }
    }

    // Separar imagens existentes e novas
    const existingImageUrls = images
      .filter((img: ImageData) => img.url && !img.base64)
      .map((img: ImageData) => img.url)

    const newImages = images
      .filter((img: ImageData) => img.base64)

    // Processar novas imagens
    let newImageUrls: string[] = []

    if (newImages.length > 0) {
      try {
        const imageResults = await Promise.all(
          newImages.map(async (image: ImageData) => {
            if (!image.base64) {
              throw new Error('Base64 não encontrado para imagem')
            }
            const fileData: FileData = {
              base64: image.base64,
              type: image.type,
              name: image.name
            }
            const result = await validateAndProcessImage(fileData)
            if (!result.success) {
              throw new Error(result.error || 'Erro ao processar imagem')
            }
            return result
          })
        )

        newImageUrls = imageResults
          .filter((result): result is { success: true; url: string } => result.success && !!result.url)
          .map(result => result.url!)
      } catch (error) {
        console.error('Erro ao processar novas imagens:', error)
        throw new Error('Erro ao processar imagens: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      }
    }

    // Atualizar moto no banco com transaction
    const motorcycle = await prisma.$transaction(async (tx) => {
      // Atualizar moto
      const moto = await tx.motorcycle.update({
        where: { id: context.params.id },
        data: {
          name,
          description,
          price: priceNumber,
          isSold
        }
      })

      // Atualizar cores
      await tx.color.deleteMany({
        where: { motorcycleId: moto.id }
      })

      if (colors.length > 0) {
        await tx.color.createMany({
          data: colors.map(color => ({
            name: color.name,
            hex: color.hex,
            motorcycleId: moto.id
          }))
        })
      }

      // Atualizar imagens
      await tx.image.deleteMany({
        where: { motorcycleId: moto.id }
      })

      // Adicionar imagens existentes e novas
      const allImageUrls = [...existingImageUrls, ...newImageUrls]
      if (allImageUrls.length > 0) {
        await tx.image.createMany({
          data: allImageUrls.map(url => ({
            url,
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
    console.error('Erro detalhado ao atualizar motocicleta:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { error: 'Erro ao atualizar motocicleta: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    )
  }
} 