import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAndProcessImage } from '@/app/utils/imageValidation'
import type { FileData } from '@/app/utils/imageValidation'

interface ImageData {
  base64: string;
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
    const data = await request.json()
    const { name, description, price, isSold, colors, images } = data

    // Validar dados
    if (!name || !description || !price || !Array.isArray(colors) || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const priceNumber = Number(price)
    if (isNaN(priceNumber) || priceNumber <= 0) {
      return NextResponse.json(
        { error: 'Preço inválido' },
        { status: 400 }
      )
    }

    // Validar imagens
    if (!Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Formato de imagens inválido: deve ser um array' },
        { status: 400 }
      )
    }

    // Atualizar moto no banco com transaction
    try {
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

        // Adicionar imagens (base64)
        if (images.length > 0) {
          await tx.image.createMany({
            data: images.map(img => ({
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
      console.error('Erro ao atualizar moto:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      })
      return NextResponse.json(
        { error: 'Erro ao atualizar moto. Por favor, tente novamente.' },
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