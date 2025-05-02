'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Motorcycle, Image as MotorcycleImage, Color as MotorcycleColor } from '@prisma/client'
import { XMarkIcon } from '@heroicons/react/24/solid'

type MotorcycleWithRelations = Motorcycle & {
  images: MotorcycleImage[];
  colors: MotorcycleColor[];
};

// Tipos específicos para o formulário
interface FormColor {
  name: string;
  hex: string;
}

interface FormImage {
  base64?: string;
  url?: string;
  name: string;
  type: string;
}

interface FormData {
  name: string;
  description: string;
  price: number;
  isSold: boolean;
  colors: { name: string; hex: string; }[];
  images: FormImage[];
}

interface MotorcycleFormProps {
  motorcycle?: MotorcycleWithRelations
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function MotorcycleForm({ motorcycle, onSubmit, onCancel, isLoading }: MotorcycleFormProps) {
  const router = useRouter()
  console.log('MotorcycleForm renderizado com motorcycle:', motorcycle?.id);
  
  const [name, setName] = useState(motorcycle?.name || '')
  const [description, setDescription] = useState(motorcycle?.description || '')
  const [price, setPrice] = useState(motorcycle?.price?.toString() || '')
  const [isSold, setIsSold] = useState(motorcycle?.isSold || false)
  
  const [existingImages, setExistingImages] = useState<MotorcycleImage[]>(
    motorcycle?.images || []
  )
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [newColorName, setNewColorName] = useState('')
  const [newColorHex, setNewColorHex] = useState('#000000')

  const [selectedColors, setSelectedColors] = useState<FormColor[]>(
    motorcycle?.colors?.map(color => ({
      name: color.name,
      hex: color.hex
    })) || []
  )
  const [previewImages, setPreviewImages] = useState<string[]>([])

  // Monitorar mudanças no prop motorcycle
  useEffect(() => {
    console.log('Prop motorcycle alterado:', motorcycle?.id);
    if (motorcycle) {
      setName(motorcycle.name);
      setDescription(motorcycle.description);
      setPrice(motorcycle.price.toString());
      setIsSold(motorcycle.isSold);
      setExistingImages(motorcycle.images);
      setSelectedColors(
        motorcycle.colors.map(color => ({
          name: color.name,
          hex: color.hex
        }))
      );
    }
  }, [motorcycle]);

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

  const handleAddColor = () => {
    if (newColorName && newColorHex) {
      setSelectedColors(prev => [...prev, { name: newColorName, hex: newColorHex }])
      setNewColorName('')
      setNewColorHex('#000000')
    }
  }

  const handleRemoveColor = (index: number) => {
    setSelectedColors(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('=== Iniciando submissão do formulário ===')

    // Verificar se é uma edição ou criação
    if (!motorcycle && !selectedFiles && existingImages.length === 0) {
      console.error('Nenhuma imagem selecionada')
      alert('Por favor, selecione pelo menos uma imagem')
      return
    }

    try {
      console.log('Convertendo imagens para base64...')
      const imagePromises = selectedFiles ? Array.from(selectedFiles).map(file => {
        return new Promise<FormImage>((resolve, reject) => {
          console.log('Processando imagem:', file.name)
          const reader = new FileReader()
          reader.onload = () => {
            console.log('Imagem convertida com sucesso:', file.name)
            resolve({
              base64: reader.result as string,
              name: file.name,
              type: file.type
            })
          }
          reader.onerror = (error) => {
            console.error('Erro ao converter imagem:', file.name, error)
            reject(error)
          }
          reader.readAsDataURL(file)
        })
      }) : []

      const images = await Promise.all(imagePromises)
      console.log(`${images.length} imagens processadas com sucesso`)

      const formData: FormData = {
        name,
        description,
        price: Number(price),
        isSold,
        colors: selectedColors,
        images: [
          ...existingImages.map(img => ({
            url: img.url,
            name: `existing-${img.url.split('/').pop()}`,
            type: 'image/webp'
          })),
          ...images.map(img => ({
            base64: img.base64,
            name: img.name,
            type: img.type
          }))
        ]
      }

      console.log('Dados a serem enviados:', {
        ...formData,
        images: formData.images.map(img => ({
          base64: img.base64 ? img.base64.substring(0, 100) + '...' : 'url: ' + img.url,
          name: img.name,
          type: img.type
        }))
      })

      await onSubmit(formData)
    } catch (error) {
      console.error('Erro detalhado:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      })
      alert(error instanceof Error ? error.message : 'Erro ao salvar a motocicleta. Por favor, tente novamente.')
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black bg-white"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Preço
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          min="0"
          step="0.01"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Status
        </label>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSold}
            onChange={(e) => setIsSold(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-white">Vendida</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Cores
        </label>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Nome da cor"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black bg-white"
            />
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="h-10 w-20 rounded-md border-gray-300"
            />
            <button
              type="button"
              onClick={handleAddColor}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedColors.map((color, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-700 rounded-md px-3 py-2"
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-white">{color.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveColor(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Imagens
        </label>
        <div className="space-y-4">
          <input
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            multiple
            className="block w-full text-white"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewImages.map((preview, index) => (
              <div key={index} className="relative">
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  width={200}
                  height={200}
                  className="rounded-lg object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

export default MotorcycleForm