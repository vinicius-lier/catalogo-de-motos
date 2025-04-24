import { Prisma } from '@prisma/client'

export type MotorcycleWithRelations = Prisma.MotorcycleGetPayload<{
  include: {
    images: true
    colors: true
  }
}>

export type ImageType = Prisma.ImageGetPayload<{}>
export type ColorType = Prisma.ColorGetPayload<{}> 