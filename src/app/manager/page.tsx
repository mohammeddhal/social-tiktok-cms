'use client'

import { useState, useEffect } from 'react'
import { getManagerDashboardData } from './actions'
import { BarChart3, AlertCircle, Video, CheckCircle, Ghost, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import Link from 'next/link'

export default function ManagerDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await getManagerDashboardData()
        setData(res)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
          المتابعة الرئيسية
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">نظرة عامة على أداء الفريق وحالة المهام.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/manager/reports" className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg ml-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">عجز المصور</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.stats.delayedTasksCount}</p>
          </div>
        </Link>

        <Link href="/manager/reports" className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg ml-4">
            <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">عجز النشر</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.stats.delayedSocialTasksCount}</p>
          </div>
        </Link>

        <Link href="/publisher/tiktok" className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg ml-4">
            <img src="/images/tiktok-logo.png" alt="TikTok" className="w-6 h-6 object-contain grayscale dark:invert" style={{ filter: 'none' }} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">فيديوهات بانتظار</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.stats.pendingTikTok}</p>
          </div>
        </Link>

        <Link href="/publisher/snapchat" className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg ml-4">
            <img src="/images/snapchat-logo.png" alt="Snapchat" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">فيديوهات بانتظار</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.stats.pendingSnapchat}</p>
          </div>
        </Link>
      </div>
      
      {/* Snapchat Floating Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Link href="/manager/snapchat" className="block transition-transform hover:scale-110 drop-shadow-lg" title="إدارة مهام سناب شات">
          <img src="/images/snapchat-logo.png" alt="Snapchat Tasks" className="w-14 h-14 object-contain" />
        </Link>
      </div>
    </div>
  )
}
