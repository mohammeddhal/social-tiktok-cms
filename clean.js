const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log("Cleaning orphaned videos...");
  const videos = await prisma.video.findMany();
  for (const v of videos) {
    const task = await prisma.videoTask.findUnique({ where: { id: v.taskId } });
    if (!task) {
      console.log('Orphaned video found, deleting:', v.id);
      await prisma.socialPublishTask.deleteMany({ where: { videoId: v.id } });
      await prisma.video.delete({ where: { id: v.id } });
    }
  }
  console.log('Done cleaning orphaned videos');
}
clean();
