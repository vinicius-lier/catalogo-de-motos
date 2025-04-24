'use client';

import React from 'react';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Motorcycle, Image as MotorcycleImage, Color as MotorcycleColor } from '@prisma/client';

interface MotorcycleDetailsModalProps {
  motorcycle: Motorcycle & {
    images: MotorcycleImage[];
    colors: MotorcycleColor[];
  };
  onClose: () => void;
}

export function MotorcycleDetailsModal({ motorcycle, onClose }: MotorcycleDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a2234] rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-4">{motorcycle.name}</h2>

        {/* Galeria de imagens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {motorcycle.images.map((image, index) => (
            <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
              <Image
                src={image.url}
                alt={`${motorcycle.name} - Imagem ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Informações da moto */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Preço</h3>
            <p className="text-gray-300">
              R$ {motorcycle.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Descrição</h3>
            <p className="text-gray-300">{motorcycle.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Cores Disponíveis</h3>
            <div className="flex flex-wrap gap-2">
              {motorcycle.colors.map((color, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-[#2a334a] rounded px-3 py-1"
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-600"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-gray-300">{color.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Status</h3>
            <span className={`px-3 py-1 rounded ${
              motorcycle.isSold
                ? 'bg-red-500 text-white'
                : 'bg-green-500 text-white'
            }`}>
              {motorcycle.isSold ? 'Vendida' : 'Disponível'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 