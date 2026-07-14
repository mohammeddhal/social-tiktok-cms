import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default async function PublisherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'PUBLISHER' && session.user.role !== 'MANAGER')) {
    redirect('/login')
  }

  return (
    <DashboardLayout role={session.user.role} user={session.user}>
      {children}
    </DashboardLayout>
  )
}
