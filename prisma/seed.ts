import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Limpar o banco de dados
  await prisma.color.deleteMany()
  await prisma.image.deleteMany()
  await prisma.motorcycle.deleteMany()

  // Criar motos de exemplo
  const motos = [
    {
      name: 'DCX 150cc Sport',
      description: 'Moto esportiva com design moderno e excelente desempenho. Motor potente de 150cc, freios a disco e painel digital.',
      price: 12990.00,
      images: ['/motos/IMG-20250417-WA0032.jpg', '/motos/IMG-20250417-WA0033.jpg'],
      colors: [
        { name: 'Vermelho', hex: '#FF0000' },
        { name: 'Preto', hex: '#000000' }
      ]
    },
    {
      name: 'DCX 250cc Adventure',
      description: 'Moto aventureira ideal para todos os terrenos. Motor 250cc, suspensão elevada e tanque de grande capacidade.',
      price: 18990.00,
      images: ['/motos/IMG-20250417-WA0034.jpg', '/motos/IMG-20250417-WA0035.jpg'],
      colors: [
        { name: 'Verde', hex: '#008000' },
        { name: 'Azul', hex: '#0000FF' }
      ]
    },
    {
      name: 'DCX 300cc Touring',
      description: 'Perfeita para viagens longas. Conforto excepcional, bagageiro espaçoso e proteção aerodinâmica.',
      price: 22990.00,
      images: ['/motos/IMG-20250417-WA0036.jpg', '/motos/IMG-20250417-WA0037.jpg'],
      colors: [
        { name: 'Prata', hex: '#C0C0C0' },
        { name: 'Preto', hex: '#000000' }
      ]
    },
    {
      name: 'DCX 200cc Street',
      description: 'Moto urbana com estilo e economia. Ideal para o dia a dia, com baixo consumo e grande agilidade.',
      price: 15990.00,
      images: ['/motos/IMG-20250417-WA0038.jpg', '/motos/IMG-20250417-WA0039.jpg'],
      colors: [
        { name: 'Amarelo', hex: '#FFD700' },
        { name: 'Branco', hex: '#FFFFFF' }
      ]
    },
    {
      name: 'DCX 400cc Premium',
      description: 'O topo de linha da DCX. Tecnologia de ponta, acabamento premium e máximo desempenho.',
      price: 32990.00,
      images: ['/motos/IMG-20250417-WA0040.jpg', '/motos/IMG-20250417-WA0041.jpg'],
      colors: [
        { name: 'Dourado', hex: '#FFD700' },
        { name: 'Grafite', hex: '#1C1C1C' }
      ]
    }
  ]

  for (const moto of motos) {
    const createdMoto = await prisma.motorcycle.create({
      data: {
        name: moto.name,
        description: moto.description,
        price: moto.price,
        images: {
          create: moto.images.map(url => ({ url }))
        },
        colors: {
          create: moto.colors
        }
      }
    })
    console.log(`Criada moto: ${createdMoto.name}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 