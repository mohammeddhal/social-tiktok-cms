import { PrismaClient } from '@prisma/client'
import { toZonedTime } from 'date-fns-tz'
import { startOfDay } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.videoTask.update({
    where: { id: 'da41929e-ad0f-45e6-a7a1-afe2a59c1f4e' },
    data: { date: new Date('2026-07-19T00:00:00.000Z') }
  })
  console.log('Updated VideoTask date to today:', result.id)
}

main().finally(() => prisma.$disconnect())
