'use client'

import React, { useState, useEffect } from 'react'
import { Motorcycle, Image as MotorcycleImage, Color as MotorcycleColor } from '@prisma/client'
import { MotorcycleForm } from './MotorcycleForm'

type MotorcycleWithRelations = Motorcycle & {
  images: MotorcycleImage[];
  colors: MotorcycleColor[];
};

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

interface EditMotorcycleFormProps {
  motorcycle: MotorcycleWithRelations;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function EditMotorcycleForm({ motorcycle, onSubmit, onCancel, isLoading }: EditMotorcycleFormProps) {
  console.log('EditMotorcycleForm renderizado com motorcycle:', motorcycle.id);
  
  return (
    <div className="bg-[#1a2234] rounded-lg p-8 mb-8">
      <h2 className="text-2xl font-bold mb-6">Editar Motocicleta</h2>
      <MotorcycleForm
        motorcycle={motorcycle}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isLoading={isLoading}
      />
    </div>
  );
} 