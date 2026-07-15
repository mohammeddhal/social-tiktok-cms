'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function getUsers() {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createUser(data: any) {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  const passwordHash = await bcrypt.hash(data.password, 10)

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash
    }
  })
  
  return { success: true }
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE') {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  if (userId === session.user.id) throw new Error('لا يمكنك تغيير حالة حسابك الشخصي')

  await prisma.user.update({
    where: { id: userId },
    data: { status }
  })

  return { success: true }
}

export async function updateUser(userId: string, data: any) {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
  }

  // Only update password if provided
  if (data.password && data.password.trim() !== '') {
    updateData.passwordHash = await bcrypt.hash(data.password, 10)
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData
  })

  return { success: true }
}
