'use client'

import Image from 'next/image'
import { Motorcycle, Image as MotorcycleImage, Color } from '@prisma/client'
import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface MotorcycleWithDetails extends Motorcycle {
  images: MotorcycleImage[]
  colors: Color[]
}

interface MotorcycleCardProps {
  motorcycle: MotorcycleWithDetails
  onDetailsClick?: () => void
}

export default function MotorcycleCard({ motorcycle, onDetailsClick }: MotorcycleCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const imageUrl = motorcycle.images[0]?.url || '/placeholder.jpg'

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === motorcycle.images.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? motorcycle.images.length - 1 : prev - 1
    )
  }

  return (
    <>
      <div className="motorcycle-card" onClick={onDetailsClick}>
        <div className="image-container">
          <Image
            src={imageUrl}
            alt={motorcycle.name}
            fill
            className="object-cover"
            onError={handleImageError}
            unoptimized={imageUrl.startsWith('data:')}
          />
        </div>
        {motorcycle.isSold && (
          <span className="sold-badge">Vendida</span>
        )}
        <div className="content">
          <h3 className="title">{motorcycle.name}</h3>
          <p className="description">{motorcycle.description}</p>
          <div className="colors">
            {motorcycle.colors.map((color) => (
              <div
                key={color.id}
                className="color-dot"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="price">{formatPrice(motorcycle.price)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="details-button"
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={() => setIsModalOpen(false)}
              className="modal-close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <div className="modal-image">
              <Image
                src={motorcycle.images[currentImageIndex]?.url || '/placeholder.jpg'}
                alt={motorcycle.name}
                fill
                className="object-cover"
              />
              {motorcycle.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="modal-nav-button prev">
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button onClick={nextImage} className="modal-nav-button next">
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            <div className="modal-details">
              <h2 className="modal-title">{motorcycle.name}</h2>
              <p className="modal-description">{motorcycle.description}</p>
              
              <div className="modal-colors">
                {motorcycle.colors.map((color) => (
                  <div key={color.id} className="modal-color">
                    <div
                      className="modal-color-dot"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="modal-color-name">{color.name}</span>
                  </div>
                ))}
              </div>

              <p className="modal-price">{formatPrice(motorcycle.price)}</p>

              <a
                href={`https://wa.me/5511999999999?text=Olá! Tenho interesse na moto ${motorcycle.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-contact"
              >
                Entrar em Contato
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 