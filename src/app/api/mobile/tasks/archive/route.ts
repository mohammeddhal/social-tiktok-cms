import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/jwt'

export async function GET(req: Request) {
  try {
    const user = verifyMobileToken(req)
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    
    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform') as 'TIKTOK' | 'SNAPCHAT'

    if (!platform) return NextResponse.json({ error: 'المنصة مطلوبة' }, { status: 400 })

    const tasks = await prisma.socialPublishTask.findMany({
      where: {
        platform: platform,
        status: 'PUBLISHED'
      },
      include: {
        video: {
          include: {
            photographer: { select: { name: true } },
            task: { select: { isPromotionDay: true, date: true } }
          }
        },
        publisher: { select: { name: true } }
      },
      orderBy: { publishedAt: 'desc' },
      take: 50 // Limit to last 50 for mobile
    })

    const archive = tasks.map(task => ({
      taskId: task.id,
      videoId: task.video.id,
      originalFilename: task.video.originalFilename,
      fileUrl: task.video.fileUrl,
      publishedUrl: task.publishedUrl,
      publishedAt: task.publishedAt,
      photographerName: task.video.photographer.name,
      publisherName: task.publisher?.name || 'مجهول',
      date: task.video.task.date.toISOString().split('T')[0]
    }))

    return NextResponse.json({ tasks: archive })
  } catch (error) {
    console.error('Mobile archive error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
