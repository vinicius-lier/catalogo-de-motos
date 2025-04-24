import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MotorcycleDetailsProps {
  motorcycle: {
    id: string;
    name: string;
    description: string;
    price: number;
    isSold: boolean;
    images: { url: string }[];
    colors: { name: string; hex: string }[];
  };
  onClose: () => void;
}

export function MotorcycleDetails({ motorcycle, onClose }: MotorcycleDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === motorcycle.images.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? motorcycle.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <div className="relative mb-6 h-[400px] w-full">
          <Image
            src={motorcycle.images[currentImageIndex]?.url || '/placeholder.jpg'}
            alt={`${motorcycle.name} - Imagem ${currentImageIndex + 1}`}
            fill
            className="rounded-lg object-cover"
          />
          
          {motorcycle.images.length > 1 && (
            <>
              <button
                onClick={previousImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {motorcycle.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 w-2 rounded-full ${
                  index === currentImageIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <h2 className="mb-4 text-3xl font-bold text-gray-900">{motorcycle.name}</h2>
        
        <p className="mb-6 text-lg text-gray-600">{motorcycle.description}</p>

        <div className="mb-6">
          <h3 className="mb-2 text-xl font-semibold text-gray-800">Cores disponíveis:</h3>
          <div className="flex gap-4">
            {motorcycle.colors.map((color) => (
              <div key={color.hex} className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full border-2 border-gray-200"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-gray-700">{color.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-600">Preço:</p>
            <p className="text-3xl font-bold text-blue-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(motorcycle.price)}
            </p>
          </div>

          {motorcycle.isSold ? (
            <div className="rounded-full bg-red-500 px-6 py-3 text-lg font-semibold text-white">
              Vendida
            </div>
          ) : (
            <button className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700">
              Entrar em Contato
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 