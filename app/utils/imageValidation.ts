import sharp from 'sharp'

const MAX_WIDTH = 1200
const MAX_HEIGHT = 800

export interface FileData {
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

    // Decodificar base64
    console.log('Decodificando base64...')
    const base64Data = fileData.base64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    console.log('Base64 decodificado com sucesso. Tamanho do buffer:', buffer.length, 'bytes')

    // Processar imagem com sharp
    console.log('Iniciando processamento com sharp...')
    const image = sharp(buffer)
    const metadata = await image.metadata()
    console.log('Metadata da imagem:', metadata)

    // Verificar se é uma imagem válida
    if (!metadata.format) {
      console.error('Formato de imagem inválido')
      return { success: false, error: 'Formato de imagem inválido' }
    }

    // Redimensionar se necessário (opcional)
    if (metadata.width && metadata.width > MAX_WIDTH || metadata.height && metadata.height > MAX_HEIGHT) {
      console.log('Redimensionando imagem...')
      image.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      })
      console.log('Imagem redimensionada')
    }

    // Salvar no formato original
    let processedBuffer: Buffer
    if (metadata.format === 'jpeg') {
      processedBuffer = await image.jpeg().toBuffer()
    } else if (metadata.format === 'png') {
      processedBuffer = await image.png().toBuffer()
    } else if (metadata.format === 'webp') {
      processedBuffer = await image.webp().toBuffer()
    } else if (metadata.format === 'gif') {
      processedBuffer = await image.gif().toBuffer()
    } else if (metadata.format === 'tiff') {
      processedBuffer = await image.tiff().toBuffer()
    } else if (metadata.format === 'avif') {
      processedBuffer = await image.avif().toBuffer()
    } else {
      // fallback para buffer original (ex: bmp, svg, etc)
      processedBuffer = buffer
    }

    // Criar URL de dados no formato original
    const base64Image = processedBuffer.toString('base64')
    const url = `data:image/${metadata.format};base64,${base64Image}`
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
      error: 'Erro ao processar imagem. Por favor, tente novamente com uma imagem válida.' 
    }
  }
} 