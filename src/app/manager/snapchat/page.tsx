'use client'

import { useState, useEffect } from 'react'
import { getManagerSnapchatData, deleteSnapchatVideo } from './uploadActions'
import { Calendar as CalendarIcon, Upload, Trash2, RefreshCw, Eye, Ghost, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { ManagerSnapchatUploadModal } from '@/components/manager/ManagerSnapchatUploadModal'

export default function ManagerSnapchatDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploadDate, setUploadDate] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getManagerSnapchatData()
      setData(result)
    } catch (e) {
      toast.error('حدث خطأ أثناء جلب البيانات')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading && !data) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Calendar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
        {data?.days.map((day: any) => (
          <DayCard key={day.date} day={day} reload={loadData} onUpload={() => setUploadDate(day.date)} />
        ))}
      </div>

      {uploadDate && (
        <ManagerSnapchatUploadModal 
          dateStr={uploadDate} 
          onClose={() => setUploadDate(null)} 
          onSuccess={() => { 
            setUploadDate(null); 
            loadData(); 
          }} 
        />
      )}
    </div>
  )
}

function DayCard({ day, reload, onUpload }: { day: any, reload: () => void, onUpload: () => void }) {
  const dateObj = new Date(day.date)
  
  let cardStyle = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
  let statusBadge = null

  if (day.status === 'DELAYED') {
    cardStyle = 'bg-red-50/70 dark:bg-red-900/20 border-red-300 dark:border-red-800 opacity-60'
    statusBadge = <span className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded">متأخر</span>
  } else if (day.status === 'UPLOADED') {
    cardStyle = 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800'
    statusBadge = <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 text-[10px] font-bold px-1.5 py-0.5 rounded">مرفوع</span>
  } else if (day.status === 'PENDING') {
    cardStyle = 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 border-dashed'
    statusBadge = <span className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded">فارغ</span>
  }

  let publisherBadge = null
  if (day.publisherStatus === 'DELAYED_UNPUBLISHED') {
    publisherBadge = <span className="mt-1 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center whitespace-nowrap"><AlertTriangle className="w-2.5 h-2.5 ml-1"/>تأخير الناشر</span>
  } else if (day.publisherStatus === 'PENDING') {
    publisherBadge = <span className="mt-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center whitespace-nowrap"><Clock className="w-2.5 h-2.5 ml-1"/>بانتظار الناشر</span>
  } else if (day.publisherStatus === 'PUBLISHED') {
    publisherBadge = <span className="mt-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center whitespace-nowrap"><CheckCircle className="w-2.5 h-2.5 ml-1"/>نشر الناشر</span>
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟ سيتم حذفه من الناشر أيضاً.')) return
    try {
      await deleteSnapchatVideo(day.task.id)
      toast.success('تم حذف الفيديو بنجاح')
      reload()
    } catch (e: any) {
      toast.error(e.message || 'فشل الحذف')
    }
  }

  return (
    <div className={`rounded-xl border shadow-sm p-3 relative transition-all flex flex-col justify-between ${cardStyle} ${day.isPromotionDay ? 'ring-2 ring-orange-500' : ''}`}>
      {day.isPromotionDay && (
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
          🔥 ترويج
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{day.dayName}</h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            {format(dateObj, 'dd MMM', { locale: ar })}
          </p>
        </div>
        <div className="flex flex-col items-end">
          {statusBadge}
          {publisherBadge}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {day.status === 'PENDING' && !day.isPastDeadline && (
          <button onClick={onUpload} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1.5 rounded-md text-xs font-medium flex items-center justify-center transition-colors">
            <Upload className="w-3 h-3 ml-1" /> رفع فيديو
          </button>
        )}
        
        {day.status === 'UPLOADED' && !day.isPastDeadline && (
          <>
            <button onClick={onUpload} className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:text-yellow-300 px-2 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center transition-colors">
              <RefreshCw className="w-3 h-3 ml-1" /> بدّل
            </button>
            <button onClick={handleDelete} className="flex-none bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 px-2 py-1.5 rounded-md flex items-center justify-center transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}

        {day.status === 'UPLOADED' && (
          <a href={day.task?.videos?.[0]?.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center transition-colors">
            <Eye className="w-3 h-3 ml-1" /> شاهد
          </a>
        )}
      </div>
    </div>
  )
}
