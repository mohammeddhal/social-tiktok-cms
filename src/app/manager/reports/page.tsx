'use client'

import { useState, useEffect } from 'react'
import { getReportsData } from './actions'
import { BarChart, Calendar as CalendarIcon, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

export default function ReportsPage() {
  const [period, setPeriod] = useState<'current_week' | 'current_month' | 'last_month'>('current_week')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getReportsData(period)
      setData(res)
    } catch (e) {
      toast.error('فشل في جلب التقارير')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [period])

  const handlePrint = () => {
    window.print()
  }

  if (loading && !data) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart className="w-6 h-6 mr-2 text-blue-600" />
            التقارير والإحصائيات
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center">
            <CalendarIcon className="w-4 h-4 mr-1 inline" />
            من {data && format(new Date(data.startDate), 'dd MMMM yyyy', { locale: ar })} إلى {data && format(new Date(data.endDate), 'dd MMMM yyyy', { locale: ar })}
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value as any)}
            className="flex-1 sm:w-auto bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          >
            <option value="current_week">الأسبوع الحالي</option>
            <option value="current_month">الشهر الحالي</option>
            <option value="last_month">الشهر الماضي</option>
          </select>
          <button 
            onClick={handlePrint}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            طباعة / PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">
        {/* Photographer Report */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden print:mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">أداء المصورين</h2>
          </div>
          <div className="p-0">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الاسم</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">تم الرفع</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">تأخير (عجز)</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data?.photographerStats.map((stat: any, i: number) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{stat.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">{stat.uploaded}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">{stat.delayed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.total}</td>
                  </tr>
                ))}
                {data?.photographerStats.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-4 text-gray-500">لا توجد بيانات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Publisher Report */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">أداء مسؤولي النشر</h2>
          </div>
          <div className="p-0">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الاسم</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">نشر في الوقت</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">مخالفة تأخير</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data?.publisherStats.map((stat: any, i: number) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{stat.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">{stat.publishedOnTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">{stat.delayedUnpublished}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.total}</td>
                  </tr>
                ))}
                {data?.publisherStats.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-4 text-gray-500">لا توجد بيانات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
