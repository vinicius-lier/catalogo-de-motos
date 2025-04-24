'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/app/utils/format'
import { MotorcycleForm } from '@/app/components/MotorcycleForm'

interface Color {
  id: string
  name: string
  hex: string
}

interface Image {
  id: string
  url: string
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

export default function AdminPage() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMotorcycle, setSelectedMotorcycle] = useState<Motorcycle | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchMotorcycles()
  }, [])

  async function fetchMotorcycles() {
    try {
      const response = await fetch('/api/motorcycles')
      const data = await response.json()
      const motorcyclesWithDates = data.map((moto: any) => ({
        ...moto,
        createdAt: new Date(moto.createdAt),
        updatedAt: new Date(moto.updatedAt)
      }))
      setMotorcycles(motorcyclesWithDates)
    } catch (error) {
      console.error('Erro ao buscar motos:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta moto?')) return
    
    try {
      await fetch(`/api/motorcycles/${id}`, {
        method: 'DELETE',
      })
      await fetchMotorcycles()
    } catch (error) {
      console.error('Erro ao deletar moto:', error)
    }
  }

  function handleEdit(motorcycle: Motorcycle) {
    setSelectedMotorcycle(motorcycle)
    setIsEditing(true)
  }

  async function handleFormSubmit(formData: FormData) {
    try {
      setIsLoading(true)
      const endpoint = selectedMotorcycle 
        ? `/api/motorcycles/${selectedMotorcycle.id}`
        : '/api/motorcycles'

      const response = await fetch(endpoint, {
        method: selectedMotorcycle ? 'PUT' : 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao salvar moto')
      }

      await fetchMotorcycles()
      setIsEditing(false)
      setSelectedMotorcycle(null)
    } catch (error) {
      console.error('Erro ao salvar moto:', error)
      alert('Erro ao salvar moto: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gerenciar Motocicletas</h1>
      
      {isEditing ? (
        <MotorcycleForm 
          onSubmit={handleFormSubmit}
          onCancel={() => setIsEditing(false)}
          motorcycle={selectedMotorcycle}
          isLoading={isLoading}
        />
      ) : (
        <>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-red-600 text-white px-4 py-2 rounded mb-4 hover:bg-red-700 transition-colors"
          >
            Adicionar Nova Moto
          </button>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Nome</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Preço</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Vendida</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {motorcycles.map((moto) => (
                  <tr key={moto.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800">{moto.name}</td>
                    <td className="px-4 py-2 text-gray-800">{formatPrice(moto.price)}</td>
                    <td className="px-4 py-2 text-gray-800">
                      {moto.isSold ? 'Sim' : 'Não'}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleEdit(moto)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(moto.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
} 