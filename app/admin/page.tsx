'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MotorcycleForm } from '@/app/components/MotorcycleForm';
import { MotorcycleModal } from '@/app/components/MotorcycleModal';
import { EditMotorcycleForm } from '@/app/components/EditMotorcycleForm';
import { Motorcycle, Image as MotorcycleImage, Color as MotorcycleColor } from '@prisma/client';

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

export default function Admin2Page() {
  const router = useRouter();
  const [motorcycles, setMotorcycles] = useState<MotorcycleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState<MotorcycleWithRelations | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMotorcycles = async () => {
    try {
      const response = await fetch('/api/motorcycles');
      const data = await response.json();
      setMotorcycles(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar motos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotorcycles();
  }, []);

  // Monitorar mudanças nos estados
  useEffect(() => {
    console.log('Estado alterado - isFormOpen:', isFormOpen, 'selectedMotorcycle:', selectedMotorcycle?.id);
  }, [isFormOpen, selectedMotorcycle]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const url = selectedMotorcycle 
        ? `/api/motorcycles/${selectedMotorcycle.id}`
        : '/api/motorcycles';
      
      const method = selectedMotorcycle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      // Tenta ler como JSON, se falhar, lê como texto puro
      let data;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      if (!response.ok) {
        // Se for texto puro, mostra tudo
        if (typeof data === 'string') {
          alert('Erro detalhado do backend:\n' + data);
        } else {
          alert('Erro detalhado da API:\n' + JSON.stringify(data, null, 2));
        }
        throw new Error((data && data.error) || 'Erro ao salvar moto');
      }

      await fetchMotorcycles();
      setIsFormOpen(false);
      setSelectedMotorcycle(undefined);
    } catch (error) {
      console.error('Erro ao salvar moto:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar moto. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta moto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/motorcycles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir moto');
      }

      await fetchMotorcycles();
    } catch (error) {
      console.error('Erro ao excluir moto:', error);
      alert('Erro ao excluir moto. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0f1729]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1729] text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Administração de Motocicletas</h1>
      
      {/* Botão para adicionar nova moto */}
      {!isFormOpen && (
        <button
          onClick={() => {
            console.log('Botão Adicionar clicado');
            setSelectedMotorcycle(undefined);
            setIsFormOpen(true);
          }}
          className="mb-8 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Adicionar Nova Motocicleta
        </button>
      )}
      
      {/* Formulário de adição */}
      {isFormOpen && !selectedMotorcycle && (
        <div className="bg-[#1a2234] rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Adicionar Nova Motocicleta</h2>
          <MotorcycleForm
            motorcycle={undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              console.log('Botão Cancelar clicado');
              setIsFormOpen(false);
              setSelectedMotorcycle(undefined);
            }}
            isLoading={isSubmitting}
          />
        </div>
      )}
      
      {/* Formulário de edição */}
      {isFormOpen && selectedMotorcycle && (
        <EditMotorcycleForm
          motorcycle={selectedMotorcycle}
          onSubmit={handleSubmit}
          onCancel={() => {
            console.log('Botão Cancelar clicado');
            setIsFormOpen(false);
            setSelectedMotorcycle(undefined);
          }}
          isLoading={isSubmitting}
        />
      )}

      {/* Tabela de motocicletas */}
      <div className="bg-[#1a2234] rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Motocicletas Cadastradas</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Preço</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {motorcycles.map((motorcycle) => (
                <tr key={motorcycle.id} className="border-b border-gray-700">
                  <td className="py-3 px-4">{motorcycle.name}</td>
                  <td className="py-3 px-4">
                    R$ {motorcycle.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      motorcycle.isSold ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                      {motorcycle.isSold ? 'Vendida' : 'Disponível'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          console.log('Botão Ver Detalhes clicado para moto:', motorcycle.id);
                          setSelectedMotorcycle(motorcycle);
                          setIsDetailsOpen(true);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Ver Detalhes
                      </button>
                      <button
                        onClick={() => {
                          console.log('Botão Editar clicado para moto:', motorcycle.id);
                          setSelectedMotorcycle(motorcycle);
                          setIsFormOpen(true);
                          console.log('Estado atualizado - selectedMotorcycle:', motorcycle.id, 'isFormOpen:', true);
                        }}
                        className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(motorcycle.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalhes */}
      {selectedMotorcycle && isDetailsOpen && (
        <MotorcycleModal
          motorcycle={selectedMotorcycle}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
    </div>
  );
} 