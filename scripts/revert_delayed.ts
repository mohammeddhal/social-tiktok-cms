import { PrismaClient } from '@prisma/client'
import { toZonedTime } from 'date-fns-tz'
import { startOfDay } from 'date-fns'

const prisma = new PrismaClient()
const RIYADH_TZ = 'Asia/Riyadh'

async function main() {
  const nowRiyadh = toZonedTime(new Date(), RIYADH_TZ)
  const today = startOfDay(nowRiyadh)

  console.log(`Reverting DELAYED_UNPUBLISHED tasks for date: ${today.toISOString()} to PENDING...`)

  const result = await prisma.socialPublishTask.updateMany({
    where: {
      status: 'DELAYED_UNPUBLISHED'
    },
    data: {
      status: 'PENDING'
    }
  })

  console.log(`Successfully reverted ${result.count} tasks back to PENDING.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
