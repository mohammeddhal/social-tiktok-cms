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

    const mappedTasks = tasks.map(task => {
      const video = task.video;
      const videoTask = video?.task;
      const photographer = video?.photographer;
      const taskDate = videoTask?.date || new Date();

      return {
        taskId: task.id,
        videoId: video?.id || '',
        originalFilename: video?.originalFilename || 'فيديو مجهول',
        fileUrl: video?.fileUrl || '',
        uploadedAt: video?.uploadedAt || new Date(),
        notes: video?.notes || '',
        photographerName: photographer?.name || 'مجهول',
        isPromotionDay: videoTask?.isPromotionDay || false,
        date: taskDate.toISOString().split('T')[0],
        isDelayed: task.status === 'DELAYED_UNPUBLISHED' || taskDate < startOfDay(today)
      };
    });

    const todayStr = today.toISOString().split('T')[0]
    
    const todayTasks = mappedTasks.filter(t => !t.isDelayed && t.date === todayStr)
    const delayedTasks = mappedTasks.filter(t => t.isDelayed)

    return NextResponse.json({ tasks: todayTasks, delayedTasks })
  } catch (error) {
    console.error('Mobile tasks error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
