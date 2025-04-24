import MotorcycleCard from './components/MotorcycleCard'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const motorcycles = await prisma.motorcycle.findMany({
    include: {
      images: true,
      colors: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Catálogo de Motos
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore nossa seleção exclusiva de motocicletas premium, com designs únicos e performance excepcional.
          </p>
        </div>

        {motorcycles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-600 font-light">
              Nenhuma moto disponível no momento.
            </p>
            <p className="text-gray-500 mt-2">
              Por favor, volte mais tarde para ver nossas novas motocicletas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {motorcycles.map((motorcycle) => (
              <MotorcycleCard key={motorcycle.id} motorcycle={motorcycle} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
} 