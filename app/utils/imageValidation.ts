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
      tipo: fileData.type,
      tamanhoBase64: fileData.base64.length
    })

    // Validar tipo
    console.log('Validando tipo do arquivo...')
    if (!ALLOWED_FILE_TYPES.includes(fileData.type)) {
      console.error('Tipo de arquivo não permitido:', {
        tipoRecebido: fileData.type,
        tiposPermitidos: ALLOWED_FILE_TYPES
      })
      return { success: false, error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP' }
    }
    console.log('Tipo de arquivo válido')

    // Decodificar base64
    console.log('Decodificando base64...')
    const base64Data = fileData.base64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    console.log('Base64 decodificado com sucesso. Tamanho do buffer:', buffer.length, 'bytes')
    
    // Validar tamanho
    console.log('Validando tamanho do arquivo...')
    if (buffer.length > MAX_FILE_SIZE) {
      console.error('Imagem muito grande:', {
        tamanhoRecebido: `${(buffer.length / (1024 * 1024)).toFixed(2)}MB`,
        tamanhoMaximo: `${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)}MB`
      })
      return { success: false, error: 'Imagem muito grande (máximo 5MB)' }
    }
    console.log('Tamanho do arquivo válido')

    // Processar imagem com sharp
    console.log('Iniciando processamento com sharp...')
    const image = sharp(buffer)
    const metadata = await image.metadata()
    console.log('Metadata da imagem:', {
      formato: metadata.format,
      largura: metadata.width,
      altura: metadata.height,
      canais: metadata.channels,
      espaçoDeCor: metadata.space,
      profundidadeDeBits: metadata.depth,
      densidade: metadata.density
    })

    // Sempre redimensionar para o tamanho máximo permitido
    console.log('Redimensionando imagem...')
    image.resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true
    })
    console.log('Imagem redimensionada')

    // Converter para WebP e otimizar
    console.log('Convertendo para WebP...')
    const processedBuffer = await image
      .webp({ quality: OUTPUT_QUALITY })
      .toBuffer()
    console.log('Imagem convertida para WebP com sucesso. Novo tamanho:', processedBuffer.length, 'bytes')

    // Criar URL de dados
    console.log('Criando URL de dados...')
    const base64Image = processedBuffer.toString('base64')
    const url = `data:image/webp;base64,${base64Image}`
    console.log('URL de dados criada com sucesso')
    
    console.log('=== Processamento concluído com sucesso ===')
    return {
      success: true,
      url
    }
  } catch (error) {
    console.error('Erro detalhado ao processar imagem:', {
      nome: fileData.name,
      tipo: fileData.type,
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      detalhes: error instanceof Error ? (error as any).details : undefined
    })
    return { 
      success: false, 
      error: 'Erro ao processar imagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido') 
    }
  }
} 