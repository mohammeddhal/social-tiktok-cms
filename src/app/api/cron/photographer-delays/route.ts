import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Auth check for cron job (optional but recommended in production)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get current time in Riyadh timezone
    const nowRiyadh = toZonedTime(new Date(), 'Asia/Riyadh');
    const todayStr = formatInTimeZone(nowRiyadh, 'Asia/Riyadh', 'yyyy-MM-dd');
    const todayStart = new Date(`${todayStr}T00:00:00Z`); // We treat the date component as the unique identifier

    // Check if today is Friday (Day 5 in JS where 0=Sunday, 5=Friday)
    // formatInTimeZone gives day of week
    const dayOfWeek = nowRiyadh.getDay();
    if (dayOfWeek === 5) {
      return NextResponse.json({ message: 'Today is Friday (off day). No delays to record.' });
    }

    // Find all active photographers
    const photographers = await prisma.user.findMany({
      where: {
        role: 'PHOTOGRAPHER',
        status: 'ACTIVE',
      },
    });

    const results = [];

    for (const photographer of photographers) {
      // Find today's task
      const existingTask = await prisma.videoTask.findUnique({
        where: {
          photographerId_date: {
            photographerId: photographer.id,
            date: todayStart,
          },
        },
      });

      if (!existingTask) {
        // Create a delayed task since they didn't even visit the dashboard to generate one
        // and didn't upload anything.
        await prisma.videoTask.create({
          data: {
            photographerId: photographer.id,
            date: todayStart,
            status: 'DELAYED',
            isPromotionDay: dayOfWeek === 0, // Sunday
          },
        });
        results.push({ photographerId: photographer.id, action: 'CREATED_DELAYED' });
      } else if (existingTask.status === 'PENDING') {
        // Update pending to delayed
        await prisma.videoTask.update({
          where: { id: existingTask.id },
          data: { status: 'DELAYED' },
        });
        results.push({ photographerId: photographer.id, action: 'UPDATED_TO_DELAYED' });
      } else {
        results.push({ photographerId: photographer.id, action: 'ALREADY_UPLOADED' });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error running photographer delay cron:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
