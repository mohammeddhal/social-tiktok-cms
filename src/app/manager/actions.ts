'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toZonedTime } from 'date-fns-tz'
import { startOfWeek, addDays, endOfWeek } from 'date-fns'
import { r2Client } from '@/lib/r2'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

const RIYADH_TZ = 'Asia/Riyadh'

export async function getManagerDashboardData() {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') {
    throw new Error('Unauthorized')
  }

  const nowRiyadh = toZonedTime(new Date(), RIYADH_TZ)
  const currentWeekStart = startOfWeek(nowRiyadh, { weekStartsOn: 6 })
  const currentWeekEnd = endOfWeek(nowRiyadh, { weekStartsOn: 6 })

  // Photographer Tasks for this week
  const photographerTasks = await prisma.videoTask.findMany({
    where: {
      date: {
        gte: currentWeekStart,
        lte: currentWeekEnd,
      }
    },
    include: {
      photographer: true,
    },
    orderBy: { date: 'asc' }
  })

  // Pending Social Tasks
  const pendingSocialTasks = await prisma.socialPublishTask.findMany({
    where: { status: 'PENDING' },
    include: {
      video: { include: { photographer: true } }
    }
  })

  // Recent Notifications
  const notifications = await prisma.notification.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  // Delayed Tasks
  const delayedTasksCount = await prisma.videoTask.count({
    where: { status: 'DELAYED' }
  })

  const delayedSocialTasksCount = await prisma.socialPublishTask.count({
    where: { status: 'DELAYED_UNPUBLISHED' }
  })

  return {
    photographerTasks,
    pendingSocialTasks,
    notifications,
    stats: {
      delayedTasksCount,
      delayedSocialTasksCount,
      pendingTikTok: pendingSocialTasks.filter(t => t.platform === 'TIKTOK').length,
      pendingSnapchat: pendingSocialTasks.filter(t => t.platform === 'SNAPCHAT').length,
    }
  }
}

export async function getTotalStorageSize() {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') {
    throw new Error('Unauthorized')
  }

  const result = await prisma.video.aggregate({
    _sum: {
      fileSize: true
    },
    where: {
      storageStatus: 'ACTIVE'
    }
  })

  return Number(result._sum.fileSize || 0)
}

export async function deleteVideoPermanently(videoId: string) {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') {
    throw new Error('Unauthorized')
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId }
  })

  if (!video) throw new Error('الفيديو غير موجود')

  if (video.storageStatus === 'ACTIVE' && video.fileKey) {
    try {
      await r2Client.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: video.fileKey,
      }))
    } catch (e) {
      console.error('Failed to delete from R2:', e)
      // Continue to delete from DB anyway or throw error
    }
  }

  // Delete from DB completely
  await prisma.video.delete({
    where: { id: videoId }
  })

  return { success: true }
}
