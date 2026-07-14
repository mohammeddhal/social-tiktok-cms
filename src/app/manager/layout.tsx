import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getTotalStorageSize } from './actions'
import { AlertTriangle } from 'lucide-react'

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session || session.user.role !== 'MANAGER') {
    redirect('/login')
  }

  const totalSize = await getTotalStorageSize()
  const GB = 1024 * 1024 * 1024
  const isWarning = totalSize > 9 * GB

  return (
    <DashboardLayout role={session.user.role} user={session.user}>
      {isWarning && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 mx-4 mt-4 rounded-lg shadow-sm flex items-start" role="alert" dir="rtl">
          <AlertTriangle className="h-6 w-6 ml-3 mt-0.5 flex-shrink-0 text-red-500" />
          <div>
            <h3 className="font-bold text-lg mb-1">تحذير مساحة التخزين!</h3>
            <p>لقد تجاوزت مساحة التخزين المستخدمة 9 جيجابايت (الحجم الحالي: <strong>{(totalSize / GB).toFixed(2)} GB</strong>). يرجى حذف الفيديوهات القديمة من الأرشيف لتجنب تجاوز الحد الأقصى (10 جيجابايت) وتجنب التكاليف الإضافية.</p>
          </div>
        </div>
      )}
      {children}
    </DashboardLayout>
  )
}
