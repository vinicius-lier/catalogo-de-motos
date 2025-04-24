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
        if (!Array.isArray(colors) || colors.length === 0) {
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

    // Processar imagens
    const imageFiles = formData.getAll('images')
    if (!imageFiles.length) {
      return NextResponse.json(
        { error: 'Pelo menos uma imagem é necessária' },
        { status: 400 }
      )
    }

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

    // Criar a moto no banco com transaction
    const motorcycle = await prisma.$transaction(async (tx) => {
      // Criar moto
      const moto = await tx.motorcycle.create({
        data: {
          name,
          description,
          price: priceNumber,
          isSold
        }
      })

      // Criar cores
      if (colors.length > 0) {
        await tx.color.createMany({
          data: colors.map(color => ({
            name: color.name,
            hex: color.hex,
            motorcycleId: moto.id
          }))
        })
      }

      // Criar imagens
      await tx.image.createMany({
        data: imageResults
          .filter((result): result is { success: true; url: string } => result.success && !!result.url)
          .map(result => ({
            url: result.url!,
            motorcycleId: moto.id
          }))
      })

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
    console.error('Erro ao criar motocicleta:', error)
    return NextResponse.json(
      { error: 'Erro ao criar motocicleta' },
      { status: 500 }
    )
  }
} 