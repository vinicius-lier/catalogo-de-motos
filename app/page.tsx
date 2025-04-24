'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClientMotorcycleCard } from './components/ClientMotorcycleCard'

interface Color {
  id: string
  name: string
  hex: string
  motorcycleId: string
}

interface Image {
  id: string
  url: string
  motorcycleId: string
}

interface Motorcycle {
  id: string
  name: string
  description: string
  price: number
  isSold: boolean
  images: Image[]
  colors: Color[]
  createdAt: Date
  updatedAt: Date
}

export default function Home() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([])
  const [loading, setLoading] = useState(true)

  const getMotorcycles = useCallback(async () => {
    try {
      const response = await fetch('/api/motorcycles')
      const data = await response.json()
      
      if (!data || !data.data) {
        console.error('Formato de resposta inválido:', data)
        throw new Error('Formato de resposta inválido')
      }
      
      const motorcyclesWithDates = data.data.map((moto: Motorcycle) => ({
        ...moto,
        createdAt: new Date(moto.createdAt),
        updatedAt: new Date(moto.updatedAt)
      }))
      setMotorcycles(motorcyclesWithDates)
    } catch (error) {
      console.error('Erro ao buscar motos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getMotorcycles()
  }, [getMotorcycles])

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-200 h-96 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 font-poppins">
        Catálogo de Motos
      </h1>

      {motorcycles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {motorcycles.map((motorcycle) => (
            <ClientMotorcycleCard key={motorcycle.id} motorcycle={motorcycle} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 font-poppins">
          Nenhuma moto disponível no momento.
        </p>
      )}
    </main>
  )
} 