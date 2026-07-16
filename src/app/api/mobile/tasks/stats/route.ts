import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/jwt'

export async function GET(req: Request) {
  try {
    const user = verifyMobileToken(req)
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    
    const tiktokPending = await prisma.socialPublishTask.count({
      where: { platform: 'TIKTOK', status: 'PENDING' }
    });

    const snapchatPending = await prisma.socialPublishTask.count({
      where: { platform: 'SNAPCHAT', status: 'PENDING' }
    });

    return NextResponse.json({ tiktok: tiktokPending, snapchat: snapchatPending })
  } catch (error) {
    console.error('Mobile stats error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
