import { NextResponse } from 'next/server'

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

export async function GET() {
  return NextResponse.json({ colors: availableColors })
} 