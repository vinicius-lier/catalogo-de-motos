import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Busca todas as imagens
  const images = await prisma.image.findMany()

  for (const image of images) {
    // Se tiver url e não tiver base64, copia o valor
    if ((image as any).url && !image.base64) {
      await prisma.image.update({
        where: { id: image.id },
        data: { base64: (image as any).url }
      })
      console.log(`Imagem ${image.id} corrigida!`)
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 