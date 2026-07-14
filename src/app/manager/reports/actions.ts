'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toZonedTime } from 'date-fns-tz'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns'

const RIYADH_TZ = 'Asia/Riyadh'

export async function getReportsData(period: 'current_week' | 'current_month' | 'last_month') {
  const session = await auth()
  if (!session || session.user.role !== 'MANAGER') throw new Error('Unauthorized')

  const nowRiyadh = toZonedTime(new Date(), RIYADH_TZ)
  let startDate = nowRiyadh
  let endDate = nowRiyadh

  if (period === 'current_week') {
    startDate = startOfWeek(nowRiyadh, { weekStartsOn: 6 })
    endDate = endOfWeek(nowRiyadh, { weekStartsOn: 6 })
  } else if (period === 'current_month') {
    startDate = startOfMonth(nowRiyadh)
    endDate = endOfMonth(nowRiyadh)
  } else if (period === 'last_month') {
    const lastMonth = subMonths(nowRiyadh, 1)
    startDate = startOfMonth(lastMonth)
    endDate = endOfMonth(lastMonth)
  }

  // Photographer Stats
  const photographerTasks = await prisma.videoTask.findMany({
    where: {
      date: { gte: startDate, lte: endDate }
    },
    include: { photographer: true }
  })

  const photographerStats = Object.values(
    photographerTasks.reduce((acc: any, task) => {
      const pid = task.photographerId
      if (!acc[pid]) {
        acc[pid] = { name: task.photographer.name, uploaded: 0, delayed: 0, total: 0 }
      }
      acc[pid].total += 1
      if (task.status === 'UPLOADED') acc[pid].uploaded += 1
      if (task.status === 'DELAYED') acc[pid].delayed += 1
      return acc
    }, {})
  )

  // Publisher Stats
  const socialTasks = await prisma.socialPublishTask.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    include: { publisher: true }
  })

  // Find a default publisher to attribute missing publisherId tasks to
  const defaultPublisher = await prisma.user.findFirst({
    where: { role: 'PUBLISHER' }
  })

  // We need to count published on time vs delayed
  // Note: if publisher is null, it might be manager who published (snapchat)
  let publisherStatsObj: any = {}

  socialTasks.forEach(task => {
    // Skip manager if they published it, as managers shouldn't get violations/stats
    if (task.publisher?.role === 'MANAGER') {
       return; 
    }

    let pId = task.publisherId;
    let name = task.publisher?.name;

    if (!pId) {
      if (defaultPublisher) {
        pId = defaultPublisher.id;
        name = defaultPublisher.name;
      } else {
        pId = 'PUBLISHER_TEAM';
        name = 'مسؤول السوشال';
      }
    }

    if (!publisherStatsObj[pId]) {
      publisherStatsObj[pId] = { name, publishedOnTime: 0, delayedUnpublished: 0, total: 0 }
    }
    
    publisherStatsObj[pId].total += 1
    if (task.status === 'PUBLISHED') publisherStatsObj[pId].publishedOnTime += 1
    if (task.status === 'DELAYED_UNPUBLISHED') publisherStatsObj[pId].delayedUnpublished += 1
  })

  return {
    period,
    startDate,
    endDate,
    photographerStats,
    publisherStats: Object.values(publisherStatsObj)
  }
}
