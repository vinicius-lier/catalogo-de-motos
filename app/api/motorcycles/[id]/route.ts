import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { validateAndProcessImage } from '@/app/utils/imageValidation'

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
    const formData = await request.formData()
    
    // Validar dados obrigatórios
    const name = formData.get('name')?.toString().trim()
    const description = formData.get('description')?.toString().trim()
    const price = formData.get('price')
    const isSold = formData.get('isSold') === 'true'
    const colorsJson = formData.get('colors')

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
    let colors: { name: string; hex: string }[] = []
    if (colorsJson) {
      try {
        colors = JSON.parse(colorsJson.toString())
        if (!Array.isArray(colors)) {
          throw new Error('Formato inválido')
        }
        for (const color of colors) {
          if (!color.name || !color.hex || typeof color.name !== 'string' || typeof color.hex !== 'string') {
            throw new Error('Dados inválidos')
          }
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Formato de cores inválido' },
          { status: 400 }
        )
      }
    }

    // Processar novas imagens
    const imageFiles = formData.getAll('images')
    let newImageUrls: string[] = []

    if (imageFiles.length > 0) {
      const imageResults = await Promise.all(
        imageFiles.map(file => validateAndProcessImage(file as File))
      )

      const failedImages = imageResults.filter(result => !result.success)
      if (failedImages.length > 0) {
        return NextResponse.json(
          { error: failedImages[0].error },
          { status: 400 }
        )
      }

      newImageUrls = imageResults
        .filter((result): result is { success: true; url: string } => result.success && !!result.url)
        .map(result => result.url!)
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

      // Adicionar novas imagens
      if (newImageUrls.length > 0) {
        await tx.image.createMany({
          data: newImageUrls.map(url => ({
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

    return NextResponse.json(motorcycle)
  } catch (error) {
    console.error('Erro ao atualizar motocicleta:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar motocicleta' },
      { status: 500 }
    )
  }
} 