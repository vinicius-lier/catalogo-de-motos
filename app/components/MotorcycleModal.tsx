'use client'

import { MotorcycleWithRelations } from '@/types/prisma'
import { Dialog, DialogContent } from '../../components/ui/dialog'
import Image from 'next/image'

interface MotorcycleModalProps {
  motorcycle: MotorcycleWithRelations
  isOpen: boolean
  onClose: () => void
}

export function MotorcycleModal({ motorcycle, isOpen, onClose }: MotorcycleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative aspect-square">
            {motorcycle.images[0] && (
              <Image
                src={motorcycle.images[0].base64}
                alt={motorcycle.name}
                fill
                className="object-cover rounded-lg"
              />
            )}
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{motorcycle.name}</h2>
            <p className="text-gray-600">{motorcycle.description}</p>
            
            <div className="flex items-center gap-2">
              <span className="font-semibold">Preço:</span>
              <span className="text-lg">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(motorcycle.price)}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Cores disponíveis:</h3>
              <div className="flex flex-wrap gap-2">
                {motorcycle.colors.map((color) => (
                  <div
                    key={color.id}
                    className="flex items-center gap-2 p-2 border rounded"
                  >
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 