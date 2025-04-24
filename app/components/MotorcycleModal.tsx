'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import Image from 'next/image'
import { MotorcycleWithRelations } from '@/types/prisma'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface MotorcycleModalProps {
  motorcycle: MotorcycleWithRelations
  isOpen: boolean
  onClose: () => void
}

export function MotorcycleModal({ motorcycle, isOpen, onClose }: MotorcycleModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="relative h-64 w-full mb-4">
                  <Image
                    src={motorcycle.images[currentImageIndex]?.url || '/placeholder.jpg'}
                    alt={motorcycle.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>

                {motorcycle.images.length > 1 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {motorcycle.images.map((image, index) => (
                      <button
                        key={image.url}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                          index === currentImageIndex ? 'border-primary-600' : 'border-transparent'
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={`${motorcycle.name} - Imagem ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-2">
                  {motorcycle.name}
                </Dialog.Title>

                <p className="text-gray-600 mb-4">{motorcycle.description}</p>

                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-bold text-primary-700">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(motorcycle.price)}
                  </span>

                  {motorcycle.isSold && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                      VENDIDA
                    </span>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Cores disponíveis:</h4>
                  <div className="flex gap-2">
                    {motorcycle.colors.map((color) => (
                      <div
                        key={color.hex}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-sm text-gray-600">{color.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 