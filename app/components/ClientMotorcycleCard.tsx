'use client'

import { useState } from 'react'
import { MotorcycleWithRelations } from '@/types/prisma'
import MotorcycleCard from './MotorcycleCard'
import { MotorcycleModal } from './MotorcycleModal'

interface ClientMotorcycleCardProps {
  motorcycle: MotorcycleWithRelations
}

export function ClientMotorcycleCard({ motorcycle }: ClientMotorcycleCardProps) {
  const [selectedMoto, setSelectedMoto] = useState<MotorcycleWithRelations | null>(null)

  return (
    <>
      <MotorcycleCard
        motorcycle={motorcycle}
        onDetailsClick={() => setSelectedMoto(motorcycle)}
      />
      
      <MotorcycleModal
        motorcycle={selectedMoto || motorcycle}
        isOpen={!!selectedMoto}
        onClose={() => setSelectedMoto(null)}
      />
    </>
  )
} 