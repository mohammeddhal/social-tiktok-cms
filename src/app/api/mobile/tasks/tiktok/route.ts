import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/jwt'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(req: Request) {
  try {
    const user = verifyMobileToken(req)
    
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    if (user.role !== 'PUBLISHER' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'غير مصرح لك بعرض هذه البيانات' }, { status: 403 })
    }

    const today = new Date()
    
    const tasks = await prisma.socialPublishTask.findMany({
      where: {
        platform: 'TIKTOK',
        status: 'PENDING',
        video: {
          task: {
            date: {
              gte: startOfDay(today),
              lte: endOfDay(today)
            }
          }
        }
      },
      include: {
        video: {
          include: {
            photographer: {
              select: { name: true }
            },
            task: {
              select: { isPromotionDay: true }
            }
          }
        }
      }
    })

    const videosToPublish = tasks.map(task => ({
      taskId: task.id,
      videoId: task.video.id,
      originalFilename: task.video.originalFilename,
      fileUrl: task.video.fileUrl,
      uploadedAt: task.video.uploadedAt,
      notes: task.video.notes,
      photographerName: task.video.photographer.name,
      isPromotionDay: task.video.task.isPromotionDay
    }))

    return NextResponse.json({ tasks: videosToPublish })
  } catch (error) {
    console.error('Mobile tasks error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
