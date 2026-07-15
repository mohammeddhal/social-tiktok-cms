import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/jwt'

export async function POST(req: Request) {
  try {
    const user = verifyMobileToken(req)
    
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    if (user.role !== 'PUBLISHER' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'غير مصرح لك للقيام بهذه العملية' }, { status: 403 })
    }

    const body = await req.json()
    const { taskId, link } = body

    if (!taskId || !link) {
      return NextResponse.json({ error: 'معرف المهمة والرابط مطلوبان' }, { status: 400 })
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { videos: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 })
    }

    // Update the task
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'PUBLISHED',
        publishedLink: link,
        publishedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mobile confirm error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
