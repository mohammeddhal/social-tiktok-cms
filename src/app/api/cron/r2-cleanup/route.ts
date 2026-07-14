import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { r2Client } from '@/lib/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Target date: exactly 1 month ago
    const oneMonthAgo = subMonths(new Date(), 1);

    // Find all videos older than 1 month that are still ACTIVE in storage
    const videosToDelete = await prisma.video.findMany({
      where: {
        storageStatus: 'ACTIVE',
        uploadedAt: {
          lt: oneMonthAgo,
        },
      },
    });

    const results = [];

    for (const video of videosToDelete) {
      if (video.fileKey && process.env.R2_BUCKET_NAME) {
        try {
          // Delete from R2
          await r2Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: video.fileKey,
            })
          );

          // Update database
          await prisma.video.update({
            where: { id: video.id },
            data: {
              storageStatus: 'DELETED_FROM_STORAGE',
              deletedAt: new Date(),
            },
          });

          results.push({ videoId: video.id, status: 'DELETED' });
        } catch (err: any) {
          console.error(`Failed to delete video ${video.id} from R2:`, err);
          results.push({ videoId: video.id, status: 'FAILED', error: err.message });
        }
      }
    }

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error) {
    console.error('Error running R2 cleanup cron:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
