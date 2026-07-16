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
        platform: 'SNAPCHAT',
        status: { in: ['PENDING', 'DELAYED_UNPUBLISHED'] }
      },
      include: {
        video: {
          include: {
            photographer: {
              select: { name: true }
            },
            task: {
              select: { isPromotionDay: true, date: true }
            }
          }
        }
      }
    })

    const mappedTasks = tasks.map(task => ({
      taskId: task.id,
      videoId: task.video.id,
      originalFilename: task.video.originalFilename,
      fileUrl: task.video.fileUrl,
      uploadedAt: task.video.uploadedAt,
      notes: task.video.notes,
      photographerName: task.video.photographer.name,
      isPromotionDay: task.video.task.isPromotionDay,
      date: task.video.task.date.toISOString().split('T')[0],
      isDelayed: task.status === 'DELAYED_UNPUBLISHED' || task.video.task.date < startOfDay(today)
    }))

    const todayStr = today.toISOString().split('T')[0]
    
    const todayTasks = mappedTasks.filter(t => !t.isDelayed && t.date === todayStr)
    const delayedTasks = mappedTasks.filter(t => t.isDelayed)

    return NextResponse.json({ tasks: todayTasks, delayedTasks })
  } catch (error) {
    console.error('Mobile tasks error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
