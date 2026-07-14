'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

const RIYADH_TZ = 'Asia/Riyadh'

export async function getPublisherTasks(platform: 'TIKTOK' | 'SNAPCHAT', status: 'PENDING' | 'ARCHIVED') {
  const session = await auth()
  if (!session || (session.user.role !== 'PUBLISHER' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized')
  }

  const nowRiyadh = toZonedTime(new Date(), RIYADH_TZ)
  const currentHour = parseInt(formatInTimeZone(nowRiyadh, RIYADH_TZ, 'HH'))

  // Fetch dynamic deadline hour
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'PUBLISHER_DEADLINE_HOUR' }
  })
  const deadlineHour = setting ? parseInt(setting.value) : 16

  // Lazy evaluation: If it's deadline or later, mark pending tasks for today (or older) as DELAYED_UNPUBLISHED
  const { startOfDay, setHours, isAfter, addDays } = await import('date-fns')
  
  const pendingTasks = await prisma.socialPublishTask.findMany({
    where: {
      status: 'PENDING',
      video: {
        task: {
          date: { lte: startOfDay(nowRiyadh) }
        }
      }
    },
    include: {
      video: {
        include: { task: true }
      }
    }
  })

  const overdueIds: string[] = []

  for (const pTask of pendingTasks) {
    const taskDate = pTask.video.task.date
    const deadlineToday = setHours(taskDate, deadlineHour)
    const deadlineTomorrow = setHours(addDays(taskDate, 1), deadlineHour)

    let isOverdue = false

    if (nowRiyadh.getTime() >= deadlineToday.getTime()) {
      isOverdue = true // Default is overdue if past 4 PM of the task date

      if (pTask.platform === 'SNAPCHAT') {
        // Condition 1: Was it uploaded late (after 4 PM on the task date)?
        const uploadedLate = pTask.createdAt.getTime() > deadlineToday.getTime()

        // Condition 2: Was it uploaded after TikTok was published for this day?
        let uploadedAfterTikTok = false
        const tiktokTask = await prisma.socialPublishTask.findFirst({
          where: {
            platform: 'TIKTOK',
            status: 'PUBLISHED',
            video: {
              task: { id: pTask.video.task.id } // Same VideoTask day
            }
          }
        })

        if (tiktokTask && tiktokTask.publishedAt && pTask.createdAt.getTime() > tiktokTask.publishedAt.getTime()) {
          uploadedAfterTikTok = true
        }

        if (uploadedLate || uploadedAfterTikTok) {
          // It gets an extension until 4 PM the NEXT day
          if (nowRiyadh.getTime() < deadlineTomorrow.getTime()) {
            isOverdue = false
          }
        }
      }
    }

    if (isOverdue) {
      overdueIds.push(pTask.id)
    }
  }

  if (overdueIds.length > 0) {
    await prisma.socialPublishTask.updateMany({
      where: { id: { in: overdueIds } },
      data: { status: 'DELAYED_UNPUBLISHED' }
    })
  }

  const queryStatus = status === 'PENDING' 
    ? { equals: 'PENDING' } 
    : { in: ['PUBLISHED', 'DELAYED_UNPUBLISHED'] }

  const tasks = await prisma.socialPublishTask.findMany({
    where: {
      platform,
      // @ts-ignore
      status: queryStatus,
      video: {
        storageStatus: status === 'PENDING' ? 'ACTIVE' : undefined
      }
    },
    include: {
      video: {
        include: {
          photographer: { select: { name: true } },
          task: { select: { isPromotionDay: true } }
        }
      },
      publisher: { select: { name: true } }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Filter out any logic if needed, but for PENDING we probably only want today's videos or earlier if they weren't archived
  return tasks
}

export async function publishTask(taskId: string) {
  const session = await auth()
  if (!session || session.user.role !== 'PUBLISHER') throw new Error('Unauthorized')

  // Check deadline
  const nowRiyadh = toZonedTime(new Date(), RIYADH_TZ)
  const currentHour = parseInt(formatInTimeZone(nowRiyadh, RIYADH_TZ, 'HH'))
  
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'PUBLISHER_DEADLINE_HOUR' }
  })
  const deadlineHour = setting ? parseInt(setting.value) : 16

  if (currentHour >= deadlineHour) {
    throw new Error('انتهت مهلة النشر، لا يمكنك تأكيد النشر الآن.')
  }

  const task = await prisma.socialPublishTask.findUnique({
    where: { id: taskId }
  })

  if (!task) throw new Error('Task not found')
  if (task.status !== 'PENDING') throw new Error('Task is not pending')

  await prisma.socialPublishTask.update({
    where: { id: taskId },
    data: {
      status: 'PUBLISHED',
      publisherId: session.user.id,
      publishedAt: new Date(),
    }
  })

  return { success: true }
}

export async function publishSnapchatByVideo(videoId: string) {
  const session = await auth()
  if (!session || session.user.role !== 'PUBLISHER') throw new Error('Unauthorized')

  // Check deadline
  const nowRiyadh = toZonedTime(new Date(), RIYADH_TZ)
  const currentHour = parseInt(formatInTimeZone(nowRiyadh, RIYADH_TZ, 'HH'))
  
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'PUBLISHER_DEADLINE_HOUR' }
  })
  const deadlineHour = setting ? parseInt(setting.value) : 16

  if (currentHour >= deadlineHour) {
    throw new Error('انتهت مهلة النشر، لا يمكنك تأكيد النشر الآن.')
  }

  const snapTask = await prisma.socialPublishTask.findFirst({
    where: { videoId, platform: 'SNAPCHAT' }
  })

  if (!snapTask) throw new Error('Snapchat task not found for this video')
  if (snapTask.status !== 'PENDING') throw new Error('Task is not pending')

  await prisma.socialPublishTask.update({
    where: { id: snapTask.id },
    data: {
      status: 'PUBLISHED',
      publisherId: session.user.id,
      publishedAt: new Date()
    }
  })

  return { success: true }
}

export async function getPublisherViolationsCount() {
  const session = await auth()
  if (!session || session.user.role !== 'PUBLISHER') throw new Error('Unauthorized')

  return await prisma.socialPublishTask.count({
    where: { status: 'DELAYED_UNPUBLISHED' }
  })
}

export async function getPublisherViolations(platform: 'TIKTOK' | 'SNAPCHAT') {
  const session = await auth()
  if (!session || session.user.role !== 'PUBLISHER') throw new Error('Unauthorized')

  return await prisma.socialPublishTask.findMany({
    where: { platform, status: 'DELAYED_UNPUBLISHED' },
    include: {
      video: {
        include: {
          photographer: { select: { name: true } },
          task: { select: { date: true, isPromotionDay: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function checkPendingSnapchatForToday() {
  const session = await auth()
  if (!session || session.user.role !== 'PUBLISHER') throw new Error('Unauthorized')

  const nowRiyadh = toZonedTime(new Date(), RIYADH_TZ)
  const { startOfDay } = await import('date-fns')

  const count = await prisma.socialPublishTask.count({
    where: {
      platform: 'SNAPCHAT',
      status: 'PENDING',
      video: {
        task: {
          date: startOfDay(nowRiyadh)
        }
      }
    }
  })

  return count > 0
}
