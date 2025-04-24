'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Motorcycle } from '@prisma/client'
import { HexColorPicker } from 'react-colorful'
import { XMarkIcon } from '@heroicons/react/24/solid'

interface MotorcycleImage {
  url: string
  id?: string
}

interface MotorcycleColor {
  name: string
  id?: string
  hex: string
}

interface MotorcycleFormProps {
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
  motorcycle: (Motorcycle & {
    images: MotorcycleImage[]
    colors: MotorcycleColor[]
  }) | null
  isLoading: boolean
}

export function MotorcycleForm({ motorcycle, onSubmit, onCancel, isLoading }: MotorcycleFormProps) {
  const router = useRouter()
  const [name, setName] = useState(motorcycle?.name || '')
  const [description, setDescription] = useState(motorcycle?.description || '')
  const [price, setPrice] = useState(motorcycle?.price?.toString() || '')
  const [isSold, setIsSold] = useState(motorcycle?.isSold || false)
  
  const [existingImages, setExistingImages] = useState<MotorcycleImage[]>(
    motorcycle?.images || []
  )
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const availableColors = [
    { name: 'Vermelho', hex: '#FF0000' },
    { name: 'Azul', hex: '#0000FF' },
    { name: 'Preto', hex: '#000000' },
    { name: 'Branco', hex: '#FFFFFF' },
    { name: 'Prata', hex: '#C0C0C0' },
    { name: 'Cinza', hex: '#808080' },
    { name: 'Verde', hex: '#008000' },
    { name: 'Amarelo', hex: '#FFFF00' },
    { name: 'Laranja', hex: '#FFA500' },
    { name: 'Marrom', hex: '#8B4513' },
    { name: 'Roxo', hex: '#800080' }
  ]

  const [selectedColors, setSelectedColors] = useState<MotorcycleColor[]>(
    motorcycle?.colors?.map(color => ({
      name: color.name,
      hex: color.hex || availableColors.find(c => c.name === color.name)?.hex || '#000000'
    })) || []
  )
  const [previewImages, setPreviewImages] = useState<string[]>([])

  useEffect(() => {
    if (selectedFiles) {
      const previews = Array.from(selectedFiles).map(file => URL.createObjectURL(file))
      setPreviewImages(previews)
      
      return () => {
        previews.forEach(preview => URL.revokeObjectURL(preview))
      }
    }
  }, [selectedFiles])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files)
    }
  }

  const handleColorToggle = (color: typeof availableColors[0]) => {
    setSelectedColors(prev => 
      prev.some(c => c.name === color.name)
        ? prev.filter(c => c.name !== color.name)
        : [...prev, { name: color.name, hex: color.hex }]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedFiles && existingImages.length === 0) {
      alert('Por favor, selecione pelo menos uma imagem')
      return
    }

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('price', price)
    formData.append('isSold', isSold.toString())
    formData.append('colors', JSON.stringify(selectedColors))

    if (selectedFiles) {
      Array.from(selectedFiles).forEach((file) => {
        formData.append('images', file)
      })
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Erro ao enviar formulário:', error)
      alert('Erro ao salvar a motocicleta. Por favor, tente novamente.')
    }
  }

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Nome da Moto
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Descrição
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Preço
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">R$</span>
          </div>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black bg-white"
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Imagens
        </label>
        {existingImages.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            {existingImages.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={img.url}
                  alt={`Moto ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {previewImages.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            {previewImages.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={preview}
                  alt={`Nova imagem ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
        
        <input
          type="file"
          onChange={handleImageChange}
          multiple
          accept="image/*"
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Cores Disponíveis
        </label>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {availableColors.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => handleColorToggle(color)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
                ${selectedColors.some(c => c.name === color.name)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
            >
              <span 
                className="w-4 h-4 rounded-full border border-gray-300" 
                style={{ backgroundColor: color.hex }}
              />
              {color.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsSold(!isSold)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isSold ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={isSold}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isSold ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="ml-3 text-sm font-medium text-white">
          Marcar como vendida
        </span>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
        >
          {isLoading
            ? 'Salvando...'
            : motorcycle
            ? 'Atualizar Moto'
            : 'Cadastrar Moto'}
        </button>
      </div>
    </form>
  )
}

export default MotorcycleForm