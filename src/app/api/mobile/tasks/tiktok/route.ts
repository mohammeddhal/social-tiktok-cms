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
    
    const tasks = await prisma.task.findMany({
      where: {
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today)
        },
        platform: 'TIKTOK',
        status: 'PENDING',
        videos: {
          some: {
            status: 'READY'
          }
        }
      },
      include: {
        videos: {
          where: { status: 'READY' },
          include: {
            photographer: {
              select: { name: true }
            }
          }
        }
      }
    })

    // Flatten the tasks to just a list of videos to publish
    const videosToPublish = []
    
    for (const task of tasks) {
      for (const video of task.videos) {
        videosToPublish.push({
          taskId: task.id,
          videoId: video.id,
          originalFilename: video.originalFilename,
          fileUrl: video.fileUrl,
          uploadedAt: video.uploadedAt,
          notes: video.notes,
          photographerName: video.photographer.name,
          isPromotionDay: task.isPromotionDay
        })
      }
    }

    return NextResponse.json({ tasks: videosToPublish })
  } catch (error) {
    console.error('Mobile tasks error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
