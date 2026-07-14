'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getSystemSettings() {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  const settings = await prisma.systemSetting.findMany()
  
  // Default values if not found in DB
  const defaultSettings = {
    PHOTOGRAPHER_DEADLINE_HOUR: '11',
    PUBLISHER_DEADLINE_HOUR: '15'
  }

  const result = { ...defaultSettings }
  settings.forEach((s: any) => {
    if (s.key === 'PHOTOGRAPHER_DEADLINE_HOUR') result.PHOTOGRAPHER_DEADLINE_HOUR = s.value
    if (s.key === 'PUBLISHER_DEADLINE_HOUR') result.PUBLISHER_DEADLINE_HOUR = s.value
  })

  return result
}

export async function updateSystemSettings(photographerHour: string, publisherHour: string) {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  await prisma.systemSetting.upsert({
    where: { key: 'PHOTOGRAPHER_DEADLINE_HOUR' },
    update: { value: photographerHour },
    create: { key: 'PHOTOGRAPHER_DEADLINE_HOUR', value: photographerHour }
  })

  await prisma.systemSetting.upsert({
    where: { key: 'PUBLISHER_DEADLINE_HOUR' },
    update: { value: publisherHour },
    create: { key: 'PUBLISHER_DEADLINE_HOUR', value: publisherHour }
  })

  return { success: true }
}
