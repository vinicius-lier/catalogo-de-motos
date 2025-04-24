import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_WIDTH = 1200
const MAX_HEIGHT = 800
const OUTPUT_QUALITY = 80

export async function validateAndProcessImage(file: File): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'Imagem muito grande (máximo 5MB)' }
    }

    // Validar tipo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { success: false, error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP' }
    }

    // Ler arquivo
    const buffer = Buffer.from(await file.arrayBuffer())

    // Processar imagem com sharp
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Sempre redimensionar para o tamanho máximo permitido
    image.resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true
    })

    // Converter para WebP e otimizar
    const processedBuffer = await image
      .webp({ quality: OUTPUT_QUALITY })
      .toBuffer()

    // Gerar nome único para o arquivo
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    
    // Verificar se o diretório existe, se não, criar
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    const filePath = join(uploadsDir, fileName)

    // Salvar arquivo
    await writeFile(filePath, processedBuffer)

    // Retornar URL relativa
    return {
      success: true,
      url: `/uploads/${fileName}`
    }
  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    return { success: false, error: 'Erro ao processar imagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido') }
  }
} 