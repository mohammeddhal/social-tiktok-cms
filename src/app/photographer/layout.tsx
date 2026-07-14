import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default async function PhotographerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session || session.user.role !== 'PHOTOGRAPHER') {
    redirect('/login')
  }

  return (
    <DashboardLayout role={session.user.role} user={session.user}>
      {children}
    </DashboardLayout>
  )
}
