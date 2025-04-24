'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/app/utils/format'

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

interface ApiResponse {
  motorcycles: Motorcycle[]
  totalPages: number
  currentPage: number
  total: number
}

export default function Admin2Page() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    isSold: false
  })
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null)
  const [colors, setColors] = useState<Color[]>([])
  const [newColor, setNewColor] = useState({ name: '', hex: '#000000' })
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchMotorcycles()
  }, [page])

  async function fetchMotorcycles() {
    try {
      setLoading(true)
      const response = await fetch(`/api/motorcycles?page=${page}`)
      if (!response.ok) {
        throw new Error('Erro ao carregar motocicletas')
      }
      const data: ApiResponse = await response.json()
      setMotorcycles(data.motorcycles || [])
      setTotalPages(data.totalPages || 1)
      setError(null)
    } catch (err) {
      setError('Erro ao carregar motocicletas')
      console.error(err)
      setMotorcycles([])
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // Validar tamanho e tipo
      const validFiles = Array.from(files).filter(file => {
        if (file.size > 1 * 1024 * 1024) {
          setError('Imagens devem ter no máximo 1MB')
          return false
        }
        if (!file.type.startsWith('image/')) {
          setError('Arquivo não é uma imagem válida')
          return false
        }
        return true
      })

      if (validFiles.length === files.length) {
        setSelectedImages(files)
        const previews = validFiles.map(file => URL.createObjectURL(file))
        setPreviewImages(previews)
        setError(null)
      }
    }
  }

  const handleColorAdd = () => {
    if (newColor.name && newColor.hex) {
      setColors([...colors, { ...newColor, id: Date.now().toString() }])
      setNewColor({ name: '', hex: '#000000' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      setError(null)
      
      // Validações
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!formData.description.trim()) {
        throw new Error('Descrição é obrigatória')
      }
      const price = Number(formData.price)
      if (isNaN(price) || price <= 0) {
        throw new Error('Preço deve ser maior que zero')
      }
      if (!selectedImages || selectedImages.length === 0) {
        throw new Error('Selecione pelo menos uma imagem')
      }
      if (colors.length === 0) {
        throw new Error('Adicione pelo menos uma cor')
      }

      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('price', formData.price)
      formDataToSend.append('isSold', formData.isSold.toString())
      formDataToSend.append('colors', JSON.stringify(colors))

      Array.from(selectedImages).forEach((image) => {
        formDataToSend.append('images', image)
      })

      const response = await fetch('/api/motorcycles', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar motocicleta')
      }

      // Limpar formulário
      setFormData({
        name: '',
        description: '',
        price: '',
        isSold: false
      })
      setSelectedImages(null)
      setColors([])
      setPreviewImages([])
      setSuccess('Motocicleta cadastrada com sucesso!')
      
      // Recarregar lista
      await fetchMotorcycles()

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar motocicleta')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && motorcycles.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Administração de Motocicletas</h1>

        {/* Formulário */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Adicionar Nova Motocicleta</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-700 rounded px-4 py-2"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block mb-2">Preço</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-gray-700 rounded px-4 py-2"
                  required
                  step="0.01"
                  min="0"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-gray-700 rounded px-4 py-2 h-32"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block mb-2">Imagens (máx. 1MB cada)</label>
              <input
                type="file"
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="w-full bg-gray-700 rounded px-4 py-2"
                disabled={submitting}
              />
              {previewImages.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImages(previewImages.filter((_, i) => i !== index))
                          const newFiles = Array.from(selectedImages || []).filter((_, i) => i !== index)
                          const dataTransfer = new DataTransfer()
                          newFiles.forEach(file => dataTransfer.items.add(file))
                          setSelectedImages(dataTransfer.files)
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2">Cores</label>
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newColor.name}
                  onChange={(e) => setNewColor({...newColor, name: e.target.value})}
                  placeholder="Nome da cor"
                  className="flex-1 bg-gray-700 rounded px-4 py-2"
                  disabled={submitting}
                />
                <input
                  type="color"
                  value={newColor.hex}
                  onChange={(e) => setNewColor({...newColor, hex: e.target.value})}
                  className="w-20 h-10 bg-gray-700 rounded"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={handleColorAdd}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  Adicionar Cor
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {colors.map((color, index) => (
                  <div
                    key={color.id}
                    className="flex items-center gap-2 bg-gray-700 p-2 rounded"
                  >
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                    <button
                      type="button"
                      onClick={() => setColors(colors.filter((_, i) => i !== index))}
                      className="ml-auto text-red-400 hover:text-red-300"
                      disabled={submitting}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isSold}
                onChange={(e) => setFormData({...formData, isSold: e.target.checked})}
                className="w-4 h-4"
                disabled={submitting}
              />
              <label>Vendida</label>
            </div>

            {error && (
              <div className="bg-red-500 text-white p-4 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500 text-white p-4 rounded">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar Motocicleta'}
            </button>
          </form>
        </div>

        {/* Lista de Motocicletas */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Motocicletas Cadastradas</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-4">Nome</th>
                  <th className="pb-4">Preço</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {motorcycles.map((moto) => (
                  <tr key={moto.id} className="border-b border-gray-700">
                    <td className="py-4">{moto.name}</td>
                    <td className="py-4">{formatPrice(moto.price)}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded ${moto.isSold ? 'bg-red-500' : 'bg-green-500'}`}>
                        {moto.isSold ? 'Vendida' : 'Disponível'}
                      </span>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={async () => {
                          if (confirm('Tem certeza que deseja excluir esta motocicleta?')) {
                            try {
                              setLoading(true)
                              const response = await fetch(`/api/motorcycles/${moto.id}`, {
                                method: 'DELETE',
                              })
                              
                              if (!response.ok) {
                                throw new Error('Erro ao excluir motocicleta')
                              }
                              
                              setSuccess('Motocicleta excluída com sucesso!')
                              setTimeout(() => setSuccess(null), 3000)
                              await fetchMotorcycles()
                            } catch (err) {
                              setError('Erro ao excluir motocicleta')
                              console.error(err)
                            } finally {
                              setLoading(false)
                            }
                          }
                        }}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`px-4 py-2 rounded ${
                    page === pageNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 