'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { r2Client } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'
import { startOfDay } from 'date-fns'

export async function generateSnapchatUploadUrl(dateStr: string, fileName: string, contentType: string) {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  const date = startOfDay(new Date(dateStr))
  
  // Manager is acting as the photographer for this specific Snapchat video
  let task = await prisma.videoTask.findUnique({
    where: {
      photographerId_date: {
        photographerId: session.user.id,
        date: date
      }
    }
  })

  if (!task) {
    task = await prisma.videoTask.create({
      data: {
        photographerId: session.user.id,
        date: date,
        isPromotionDay: date.getDay() === 0,
        status: 'PENDING'
      }
    })
  }

  const fileKey = `manager-snapchat/${session.user.id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '')}`
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  })

  // URL valid for 30 mins
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 1800 })

  return { uploadUrl, fileKey, taskId: task.id }
}

export async function saveSnapchatVideoRecord(taskId: string, fileKey: string, originalFilename: string, fileSize: number, notes: string | null) {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  // Check if replacing existing video
  const existingVideo = await prisma.video.findFirst({ where: { taskId }, orderBy: { uploadedAt: 'desc' } })
  
  if (existingVideo) {
    // Update existing
    await prisma.video.update({
      where: { id: existingVideo.id },
      data: {
        fileKey,
        originalFilename,
        fileSize,
        notes,
        fileUrl: `${process.env.NEXT_PUBLIC_R2_DEV_URL}/${fileKey}`,
        uploadedAt: new Date(),
        storageStatus: 'ACTIVE'
      }
    })

    // Check if SNAPCHAT publish task exists, if not create one
    const publishTask = await prisma.socialPublishTask.findFirst({
        where: { videoId: existingVideo.id, platform: 'SNAPCHAT' }
    })
    if (!publishTask) {
        await prisma.socialPublishTask.create({
          data: { videoId: existingVideo.id, platform: 'SNAPCHAT', status: 'PENDING' }
        })
    }
  } else {
    // Create new
    const video = await prisma.video.create({
      data: {
        taskId,
        photographerId: session.user.id,
        fileKey,
        originalFilename,
        fileSize,
        notes,
        fileUrl: `${process.env.NEXT_PUBLIC_R2_DEV_URL}/${fileKey}`,
      }
    })

    // Create ONLY SNAPCHAT publish task
    await prisma.socialPublishTask.create({
      data: { videoId: video.id, platform: 'SNAPCHAT', status: 'PENDING' }
    })

    // Update task status
    await prisma.videoTask.update({
      where: { id: taskId },
      data: { status: 'UPLOADED' }
    })
  }

  return { success: true }
}

export async function deleteSnapchatVideo(taskId: string) {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  const task = await prisma.videoTask.findUnique({
    where: { id: taskId },
    include: { videos: true }
  })

  if (!task || task.videos.length === 0) throw new Error('Video not found')
  
  await prisma.videoTask.update({
    where: { id: taskId },
    data: { status: 'PENDING' }
  })

  await prisma.video.deleteMany({
    where: { taskId }
  })

  return { success: true }
}

export async function getManagerSnapchatData() {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  const { addDays, format, isFriday, startOfDay, isBefore } = await import('date-fns')
  const { ar } = await import('date-fns/locale')
  const { toZonedTime, formatInTimeZone } = await import('date-fns-tz')

  const RIYADH_TZ = 'Asia/Riyadh'
  const nowRiyadh = toZonedTime(new Date(), RIYADH_TZ)
  const currentHour = parseInt(formatInTimeZone(nowRiyadh, RIYADH_TZ, 'HH'))

  const rangeStart = startOfDay(new Date(nowRiyadh.getFullYear(), nowRiyadh.getMonth(), 1))
  const rangeEnd = new Date(nowRiyadh.getFullYear(), nowRiyadh.getMonth() + 1, 0) // end of month

  const tasks = await prisma.videoTask.findMany({
    where: {
      photographerId: session.user.id,
      date: { gte: rangeStart, lte: rangeEnd }
    },
    include: { videos: { include: { socialTasks: true } } }
  })

  const days = []
  let currentDate = rangeStart

  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'PHOTOGRAPHER_DEADLINE_HOUR' }
  })
  const deadlineHour = setting ? parseInt(setting.value) : 11

  while (currentDate <= rangeEnd) {
    if (!isFriday(currentDate)) {
      const existingTask = tasks.find(t => {
        const tDate = new Date(t.date)
        return tDate.getFullYear() === currentDate.getFullYear() &&
               tDate.getMonth() === currentDate.getMonth() &&
               tDate.getDate() === currentDate.getDate()
      })
      
      const isToday = currentDate.getTime() === startOfDay(nowRiyadh).getTime()
      let status = existingTask?.status || 'PENDING'

      if (isToday && status === 'PENDING' && currentHour >= deadlineHour) {
        status = 'DELAYED'
      }

      if (isBefore(currentDate, startOfDay(nowRiyadh)) && status === 'PENDING') {
        status = 'DELAYED'
      }

      const isPastDeadline = (isToday && currentHour >= deadlineHour) || isBefore(currentDate, startOfDay(nowRiyadh))

      let publisherStatus = null
      if (existingTask && existingTask.videos.length > 0) {
        const socialTasks = existingTask.videos.flatMap((v: any) => v.socialTasks)
        if (socialTasks.length > 0) {
          const hasDelayed = socialTasks.some((st: any) => st.status === 'DELAYED_UNPUBLISHED')
          const hasPending = socialTasks.some((st: any) => st.status === 'PENDING')
          const allPublished = socialTasks.every((st: any) => st.status === 'PUBLISHED')
          
          if (hasDelayed) publisherStatus = 'DELAYED_UNPUBLISHED'
          else if (hasPending) publisherStatus = 'PENDING'
          else if (allPublished) publisherStatus = 'PUBLISHED'
        }
      }

      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        dayName: format(currentDate, 'EEEE', { locale: ar }),
        task: existingTask || null,
        status,
        publisherStatus,
        isPromotionDay: currentDate.getDay() === 0,
        isPastDeadline
      })
    }
    currentDate = addDays(currentDate, 1)
  }

  return { days }
}
