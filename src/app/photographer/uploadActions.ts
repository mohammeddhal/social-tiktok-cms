'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { r2Client } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'
import { messaging } from '@/lib/firebaseAdmin'

export async function generateUploadUrl(dateStr: string, fileName: string, contentType: string, fileHash?: string) {
  const session = await auth()
  if (!session || session.user.role !== 'PHOTOGRAPHER') throw new Error('Unauthorized')

  if (fileHash) {
    const duplicate = await prisma.video.findFirst({
      where: { fileHash },
      include: { photographer: true }
    })
    
    if (duplicate) {
      const uploadDateStr = duplicate.uploadedAt.toLocaleDateString('ar-EG')
      await prisma.notification.create({
        data: {
          userId: null,
          title: 'تنبيه: محاولة تكرار فيديو',
          message: `حاول المصور ${session.user.name} رفع فيديو مكرر، والذي رفعه المصور ${duplicate.photographer.name} مسبقاً بتاريخ ${uploadDateStr}`,
          link: duplicate.fileUrl
        }
      })
      throw new Error(`مرفوض: هذا الفيديو مكرر وتم رفعه مسبقاً بتاريخ ${uploadDateStr}`)
    }
  }

  const date = new Date(dateStr)
  
  // Ensure we have a task for this date
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

  // Prevent upload if it's delayed or past deadline (handled by UI, but double check)
  if (task.status === 'DELAYED') {
    throw new Error('لا يمكنك الرفع في يوم متأخر')
  }

  const fileKey = `${session.user.id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '')}`
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  })

  // URL valid for 30 mins
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 1800 })

  return { uploadUrl, fileKey, taskId: task.id }
}

export async function saveVideoRecord(taskId: string, fileKey: string, originalFilename: string, fileSize: number, notes: string | null, fileHash?: string) {
  const session = await auth()
  if (!session || session.user.role !== 'PHOTOGRAPHER') throw new Error('Unauthorized')

  const task = await prisma.videoTask.findUnique({ where: { id: taskId } })
  if (!task) throw new Error('Task not found')

  if (!task.isPromotionDay) {
    // Check if replacing existing video
    const existingVideo = await prisma.video.findFirst({ where: { taskId } })
    
    if (existingVideo) {
      // Update existing
      await prisma.video.update({
        where: { id: existingVideo.id },
        data: {
          fileKey,
          fileHash,
          originalFilename,
          fileSize,
          notes,
          fileUrl: `${process.env.NEXT_PUBLIC_R2_DEV_URL}/${fileKey}`,
          uploadedAt: new Date(),
          storageStatus: 'ACTIVE'
        }
      })
      return { success: true }
    }
  }

  // Create new
  const video = await prisma.video.create({
    data: {
      taskId,
      photographerId: session.user.id,
      fileKey,
      fileHash,
      originalFilename,
      fileSize,
      notes,
      fileUrl: `${process.env.NEXT_PUBLIC_R2_DEV_URL}/${fileKey}`,
    }
  })

  // Create social publish task (TikTok) for the photographer's video
  await prisma.socialPublishTask.create({
    data: { videoId: video.id, platform: 'TIKTOK', status: 'PENDING' }
  })

  // Create Snapchat task as well if it is Sunday
  if (task.isPromotionDay) {
    await prisma.socialPublishTask.create({
      data: { videoId: video.id, platform: 'SNAPCHAT', status: 'PENDING' }
    })
  }

  // Update task status
  await prisma.videoTask.update({
    where: { id: taskId },
    data: { status: 'UPLOADED' }
  })

  // Send Push Notification to Publishers
  try {
    const publishers = await prisma.user.findMany({
      where: { role: 'PUBLISHER', fcmToken: { not: null } },
      select: { fcmToken: true }
    });

    const tokens = publishers.map(p => p.fcmToken).filter(Boolean) as string[];
    
    if (tokens.length > 0 && messaging) {
      await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: 'فيديو جديد جاهز للنشر!',
          body: `قام المصور ${session.user.name} برفع فيديو جديد. يرجى مراجعته ونشره.`,
        },
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          type: 'new_video'
        }
      });
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }

  return { success: true }
}

export async function deleteVideo(videoId: string) {
  const session = await auth()
  if (!session || session.user.role !== 'PHOTOGRAPHER') throw new Error('Unauthorized')

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { task: true }
  })

  if (!video) throw new Error('Video not found')
  
  await prisma.video.delete({
    where: { id: videoId }
  })

  const remainingVideos = await prisma.video.count({ where: { taskId: video.taskId } })
  if (remainingVideos === 0) {
    await prisma.videoTask.update({
      where: { id: video.taskId },
      data: { status: 'PENDING' }
    })
  }
  
  return { success: true }
}
