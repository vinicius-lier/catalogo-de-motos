import sharp from 'sharp'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1080
const OUTPUT_QUALITY = 80

export async function validateAndProcessImage(file: File): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'Imagem muito grande (máximo 5MB)' }
    }

    // Validar tipo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { success: false, error: 'Tipo de arquivo não permitido' }
    }

    // Ler arquivo
    const buffer = Buffer.from(await file.arrayBuffer())

    // Processar imagem com sharp
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Redimensionar se necessário
    if (metadata.width && metadata.width > MAX_WIDTH || metadata.height && metadata.height > MAX_HEIGHT) {
      image.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      })
    }

    // Converter para WebP e otimizar
    const processedBuffer = await image
      .webp({ quality: OUTPUT_QUALITY })
      .toBuffer()

    // Converter para base64
    const base64Image = `data:image/webp;base64,${processedBuffer.toString('base64')}`

    return {
      success: true,
      url: base64Image
    }
  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    return { success: false, error: 'Erro ao processar imagem' }
  }
} 