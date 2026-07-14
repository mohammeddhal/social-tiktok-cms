import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create Manager
  const managerPassword = await bcrypt.hash('Mm@@112233', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'm@grt-garage.com' },
    update: {},
    create: {
      email: 'm@grt-garage.com',
      name: 'المدير',
      passwordHash: managerPassword,
      role: 'MANAGER',
    },
  })

  // Create Publisher
  const publisherPassword = await bcrypt.hash('Ss@@113311', 10)
  const publisher = await prisma.user.upsert({
    where: { email: 's@grt-garage.com' },
    update: {},
    create: {
      email: 's@grt-garage.com',
      name: 'مسؤول السوشيال ميديا',
      passwordHash: publisherPassword,
      role: 'PUBLISHER',
    },
  })

  // Create Photographer
  const photogPassword = await bcrypt.hash('Pp@@113355', 10)
  const photographer = await prisma.user.upsert({
    where: { email: 'p@grt-garage.com' },
    update: {},
    create: {
      email: 'p@grt-garage.com',
      name: 'المصور',
      passwordHash: photogPassword,
      role: 'PHOTOGRAPHER',
    },
  })

  console.log('Database seeded with test users!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
