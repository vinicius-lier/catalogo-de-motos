import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Limpar o banco de dados
  await prisma.image.deleteMany()
  await prisma.color.deleteMany()
  await prisma.motorcycle.deleteMany()

  console.log('Banco de dados limpo')

  // Criar algumas motos de exemplo
  const motos = [
    {
      name: 'Honda CB 500F',
      description: 'Uma naked versátil e econômica, perfeita para o dia a dia e viagens.',
      price: 35000,
      isSold: false,
      colors: [
        { name: 'Vermelho', hex: '#FF0000' },
        { name: 'Preto', hex: '#000000' }
      ],
      images: [
        { url: 'https://example.com/cb500f-1.jpg' },
        { url: 'https://example.com/cb500f-2.jpg' }
      ]
    },
    {
      name: 'Yamaha MT-07',
      description: 'Naked esportiva com excelente torque e design agressivo.',
      price: 45000,
      isSold: false,
      colors: [
        { name: 'Azul', hex: '#0000FF' },
        { name: 'Cinza', hex: '#808080' }
      ],
      images: [
        { url: 'https://example.com/mt07-1.jpg' },
        { url: 'https://example.com/mt07-2.jpg' }
      ]
    }
  ]

  for (const moto of motos) {
    await prisma.motorcycle.create({
      data: {
        name: moto.name,
        description: moto.description,
        price: moto.price,
        isSold: moto.isSold,
        colors: {
          create: moto.colors
        },
        images: {
          create: moto.images
        }
      }
    })
  }

  console.log('Dados de exemplo criados com sucesso')
}

main()
  .catch((e) => {
    console.error('Erro ao criar dados de exemplo:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 