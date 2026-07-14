import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const nowRiyadh = toZonedTime(new Date(), 'Asia/Riyadh');
    const todayStr = formatInTimeZone(nowRiyadh, 'Asia/Riyadh', 'yyyy-MM-dd');
    const todayStart = new Date(`${todayStr}T00:00:00Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);

    // Find all TikTok publish tasks created today that are still PENDING
    const overdueTasks = await prisma.socialPublishTask.findMany({
      where: {
        platform: 'TIKTOK',
        status: 'PENDING',
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const results = [];

    for (const task of overdueTasks) {
      await prisma.socialPublishTask.update({
        where: { id: task.id },
        data: { status: 'DELAYED_UNPUBLISHED' },
      });
      results.push({ taskId: task.id, videoId: task.videoId, action: 'MARKED_DELAYED' });
    }

    return NextResponse.json({ success: true, updatedCount: results.length, results });
  } catch (error) {
    console.error('Error running publisher delay cron:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
