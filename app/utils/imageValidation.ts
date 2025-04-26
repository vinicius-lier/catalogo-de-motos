import sharp from 'sharp'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_WIDTH = 1200
const MAX_HEIGHT = 800
const OUTPUT_QUALITY = 80

interface FileData {
  base64: string
  type: string
  name: string
}

export async function validateAndProcessImage(fileData: FileData): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    console.log('=== Iniciando validação de imagem ===', {
      nome: fileData.name,
      tipo: fileData.type
    })

    // Validar tipo
    if (!ALLOWED_FILE_TYPES.includes(fileData.type)) {
      console.error('Tipo de arquivo não permitido:', {
        tipoRecebido: fileData.type,
        tiposPermitidos: ALLOWED_FILE_TYPES
      })
      return { success: false, error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP' }
    }

    // Decodificar base64
    console.log('Decodificando base64...')
    const base64Data = fileData.base64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Validar tamanho
    if (buffer.length > MAX_FILE_SIZE) {
      console.error('Imagem muito grande:', {
        tamanhoRecebido: `${(buffer.length / (1024 * 1024)).toFixed(2)}MB`,
        tamanhoMaximo: `${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)}MB`
      })
      return { success: false, error: 'Imagem muito grande (máximo 5MB)' }
    }

    // Processar imagem com sharp
    console.log('Iniciando processamento com sharp...')
    const image = sharp(buffer)
    const metadata = await image.metadata()
    console.log('Metadata da imagem:', metadata)

    // Sempre redimensionar para o tamanho máximo permitido
    console.log('Redimensionando imagem...')
    image.resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true
    })

    // Converter para WebP e otimizar
    console.log('Convertendo para WebP...')
    const processedBuffer = await image
      .webp({ quality: OUTPUT_QUALITY })
      .toBuffer()
    console.log('Imagem convertida para WebP com sucesso')

    // Criar URL de dados
    const base64Image = processedBuffer.toString('base64')
    const url = `data:image/webp;base64,${base64Image}`
    
    console.log('=== Processamento concluído com sucesso ===')
    return {
      success: true,
      url
    }
  } catch (error) {
    console.error('Erro ao processar imagem:', {
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    })
    return { 
      success: false, 
      error: 'Erro ao processar imagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido') 
    }
  }
} 