import Link from 'next/link'
import { Archive } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function PublisherDashboardMenu() {
  // جلب عدد المقاطع الجاهزة للنشر (الجديدة فقط وليس المتأخرة المخالفة)
  const tiktokPending = await prisma.socialPublishTask.count({
    where: { platform: 'TIKTOK', status: 'PENDING' }
  });

  const snapchatPending = await prisma.socialPublishTask.count({
    where: { platform: 'SNAPCHAT', status: 'PENDING' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center space-y-12 mt-10">
        
        {/* TikTok */}
        <Link href="/publisher/tiktok" className="group hover:scale-110 transition-transform duration-300 relative flex justify-center w-24 mx-auto">
          {tiktokPending > 0 && (
            <span className="absolute 0 top-0 right-0 flex h-6 w-6 z-10 -mt-1 -mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative flex justify-center items-center rounded-full h-6 w-6 bg-red-500 border-2 border-white dark:border-gray-800 text-white text-xs font-bold shadow-sm">
                {tiktokPending}
              </span>
            </span>
          )}
          <img src="/images/tiktok-logo.png" alt="TikTok" className="w-24 h-24 object-contain shrink-0" />
        </Link>

        {/* Snapchat */}
        <Link href="/publisher/snapchat" className="group hover:scale-110 transition-transform duration-300 relative flex justify-center w-24 mx-auto">
          {snapchatPending > 0 && (
            <span className="absolute 0 top-0 right-0 flex h-6 w-6 z-10 -mt-1 -mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative flex justify-center items-center rounded-full h-6 w-6 bg-red-500 border-2 border-white dark:border-gray-800 text-white text-xs font-bold shadow-sm">
                {snapchatPending}
              </span>
            </span>
          )}
          <img src="/images/snapchat-logo.png" alt="Snapchat" className="w-24 h-24 object-contain shrink-0" />
        </Link>

        {/* TikTok Archive */}
        <Link href="/publisher/archive-tiktok" className="group flex items-center justify-between hover:scale-110 transition-transform duration-300 w-24 mx-auto">
          <Archive className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
          <img src="/images/tiktok-logo.png" alt="TikTok Archive" className="w-16 h-16 object-contain shrink-0 transition-all duration-300" />
        </Link>

        {/* Snapchat Archive */}
        <Link href="/publisher/archive-snapchat" className="group flex items-center justify-between hover:scale-110 transition-transform duration-300 w-24 mx-auto">
          <Archive className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
          <img src="/images/snapchat-logo.png" alt="Snapchat Archive" className="w-16 h-16 object-contain shrink-0 transition-all duration-300" />
        </Link>

      </div>
    </div>
  )
}
