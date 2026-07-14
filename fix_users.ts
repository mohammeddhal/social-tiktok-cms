import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all old users...')
  await prisma.user.deleteMany()

  console.log('Creating new users...')
  
  const managerPassword = await bcrypt.hash('Mm@@112233', 10)
  await prisma.user.create({
    data: {
      email: 'm@grt-garage.com',
      name: 'المدير',
      passwordHash: managerPassword,
      role: 'MANAGER',
    },
  })

  const publisherPassword = await bcrypt.hash('Ss@@113311', 10)
  await prisma.user.create({
    data: {
      email: 's@grt-garage.com',
      name: 'مسؤول السوشيال ميديا',
      passwordHash: publisherPassword,
      role: 'PUBLISHER',
    },
  })

  const photogPassword = await bcrypt.hash('Pp@@113355', 10)
  await prisma.user.create({
    data: {
      email: 'p@grt-garage.com',
      name: 'المصور',
      passwordHash: photogPassword,
      role: 'PHOTOGRAPHER',
    },
  })

  console.log('Users created successfully!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
