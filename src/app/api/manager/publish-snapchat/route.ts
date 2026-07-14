import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await req.json()

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
    }

    const task = await prisma.socialPublishTask.findUnique({
      where: { id: taskId, platform: 'SNAPCHAT' }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    if (task.status !== 'PENDING') {
      return NextResponse.json({ error: 'Task is not pending' }, { status: 400 })
    }

    await prisma.socialPublishTask.update({
      where: { id: taskId },
      data: {
        status: 'PUBLISHED',
        publisherId: session.user.id,
        publishedAt: new Date(),
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
