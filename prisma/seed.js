const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Limpar o banco de dados
  await prisma.color.deleteMany()
  await prisma.image.deleteMany()
  await prisma.motorcycle.deleteMany()

  // Array com todas as motos
  const motos = [
    {
      name: 'Yamaha NMAX',
      description: 'Scooter premium com design moderno, motor potente de 160cc e tecnologia avançada. Ideal para mobilidade urbana com conforto e estilo.',
      price: 17990.00,
      images: [
        '/motos/nmax/foto1.jpg',
        '/motos/nmax/foto2.jpg',
        '/motos/nmax/foto3.jpg',
        '/motos/nmax/foto4.jpg',
        '/motos/nmax/foto5.jpg'
      ],
      colors: [
        { name: 'Azul', hex: '#003366' },
        { name: 'Cinza', hex: '#666666' },
        { name: 'Preto', hex: '#000000' }
      ]
    },
    {
      name: 'Yamaha Factor',
      description: 'Moto econômica e versátil. Design moderno, baixo consumo de combustível e excelente custo-benefício.',
      price: 12990.00,
      images: [
        '/motos/factor/foto1.jpg',
        '/motos/factor/foto2.jpg',
        '/motos/factor/foto3.jpg',
        '/motos/factor/foto4.jpg',
        '/motos/factor/foto5.jpg'
      ],
      colors: [
        { name: 'Vermelho', hex: '#CC0000' },
        { name: 'Preto', hex: '#000000' }
      ]
    },
    {
      name: 'Factor DCX',
      description: 'Nova geração da Factor com design esportivo, motor 150cc mais potente e acabamento premium. Perfeita para o dia a dia.',
      price: 14990.00,
      images: [
        '/motos/factor-dcx/foto1.jpg',
        '/motos/factor-dcx/foto2.jpg',
        '/motos/factor-dcx/foto3.jpg',
        '/motos/factor-dcx/foto4.jpg',
        '/motos/factor-dcx/foto5.jpg'
      ],
      colors: [
        { name: 'Azul', hex: '#0066CC' },
        { name: 'Vermelho', hex: '#CC0000' },
        { name: 'Preto', hex: '#000000' }
      ]
    },
    {
      name: 'Honda NC750',
      description: 'Moto aventureira versátil com motor de 750cc, câmbio DCT opcional e grande capacidade de carga. Perfeita para viagens e uso diário.',
      price: 45990.00,
      images: [
        '/motos/nc750/foto1.jpg',
        '/motos/nc750/foto2.jpg',
        '/motos/nc750/foto3.jpg',
        '/motos/nc750/foto4.jpg',
        '/motos/nc750/foto5.jpg'
      ],
      colors: [
        { name: 'Vermelho', hex: '#CC0000' },
        { name: 'Prata', hex: '#CCCCCC' },
        { name: 'Preto', hex: '#000000' }
      ]
    }
  ]

  // Criar cada moto no banco de dados
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