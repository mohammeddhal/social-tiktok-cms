import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const role = session.user?.role

  if (role === 'PHOTOGRAPHER') {
    redirect('/photographer')
  } else if (role === 'PUBLISHER') {
    redirect('/publisher')
  } else if (role === 'MANAGER') {
    redirect('/manager')
  }

  // Fallback
  redirect('/login')
}
