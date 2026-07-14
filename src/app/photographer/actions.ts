'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { addDays, startOfWeek, addMonths, startOfDay, isFriday, isBefore, endOfMonth, differenceInDays } from 'date-fns'
import { ar } from 'date-fns/locale'

const RIYADH_TZ = 'Asia/Riyadh'

export async function getPhotographerData() {
  const session = await auth()
  if (!session || session.user.role !== 'PHOTOGRAPHER') {
    throw new Error('Unauthorized')
  }

  const nowRiyadh = toZonedTime(new Date(), RIYADH_TZ)
  // Current hour in Riyadh
  const currentHour = parseInt(formatInTimeZone(nowRiyadh, RIYADH_TZ, 'HH'))

  // Fetch dynamic deadline hour from System Settings
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'PHOTOGRAPHER_DEADLINE_HOUR' }
  })
  const deadlineHour = setting ? parseInt(setting.value) : 11

  // Full current month view
  let rangeStart = startOfDay(new Date(nowRiyadh.getFullYear(), nowRiyadh.getMonth(), 1))
  let rangeEnd = endOfMonth(nowRiyadh)

  // Allow next month only if there is 1 day or less left in the current month
  const daysLeftInMonth = differenceInDays(rangeEnd, startOfDay(nowRiyadh))
  if (daysLeftInMonth <= 1) {
    rangeEnd = endOfMonth(addMonths(nowRiyadh, 1))
  }

  // Fetch tasks
  const tasks = await prisma.videoTask.findMany({
    where: {
      photographerId: session.user.id,
      date: {
        gte: rangeStart,
        lte: rangeEnd,
      }
    },
    include: {
      videos: {
        include: { socialTasks: true }
      }
    }
  })

  // We need to generate the calendar days and map tasks to them
  const days = []
  let currentDate = rangeStart

  while (currentDate <= rangeEnd) {
    if (!isFriday(currentDate)) { // Exclude Fridays
      const dateStr = formatInTimeZone(currentDate, RIYADH_TZ, 'yyyy-MM-dd')
      const existingTask = tasks.find(t => {
        const tDate = new Date(t.date)
        return tDate.getFullYear() === currentDate.getFullYear() &&
               tDate.getMonth() === currentDate.getMonth() &&
               tDate.getDate() === currentDate.getDate()
      })
      
      const isToday = currentDate.getTime() === startOfDay(nowRiyadh).getTime()
      let status = existingTask?.status || 'PENDING'

      // Check deadline if it's today and past dynamic deadline
      if (isToday && status === 'PENDING' && currentHour >= deadlineHour) {
        status = 'DELAYED'
      }

      // If it's a past date and pending, it's delayed
      if (isBefore(currentDate, startOfDay(nowRiyadh)) && status === 'PENDING') {
        status = 'DELAYED'
      }

      days.push({
        date: dateStr,
        dayName: formatInTimeZone(currentDate, RIYADH_TZ, 'EEEE', { locale: ar }),
        task: existingTask || null,
        status,
        isPromotionDay: currentDate.getDay() === 0, // Sunday
        isPastDeadline: (isToday && currentHour >= deadlineHour) || isBefore(currentDate, startOfDay(nowRiyadh))
      })
    }
    currentDate = addDays(currentDate, 1)
  }

  // Calculate delayed days from the generated calendar (this automatically handles missing records and resets monthly)
  const delayedTasksCount = days.filter(d => d.status === 'DELAYED').length

  // Calculate uploaded videos this month
  const uploadedCount = days.filter(d => d.task !== null).length

  return {
    days,
    delayedTasksCount,
    uploadedCount
  }
}

export async function getDelayedDays() {
  const session = await auth()
  if (!session || session.user.role !== 'PHOTOGRAPHER') throw new Error('Unauthorized')

  return await prisma.videoTask.findMany({
    where: {
      photographerId: session.user.id,
      status: 'DELAYED'
    },
    orderBy: {
      date: 'desc'
    }
  })
}
